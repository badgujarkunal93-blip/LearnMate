import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";
import { dbService } from "./services/db";
import { sendMessageToAgent } from "./services/ai";
import { Menu, Plus, GraduationCap } from "lucide-react";

// Generate a simple UUID
function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function App() {
  const [sessionId, setSessionId] = useState("");
  const [tracks, setTracks] = useState([]);
  const [activeTrackId, setActiveTrackId] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Real Integration: Online/Offline agent status state
  const [isOnline, setIsOnline] = useState(true);
  
  // Real Integration: Non-blocking Toast notification state
  const [toast, setToast] = useState(null);

  // Trigger non-blocking toast notification
  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Startup Database initialization and tracks loading
  useEffect(() => {
    let sid = localStorage.getItem("learnmate_session_id");
    if (!sid) {
      sid = generateUUID();
      localStorage.setItem("learnmate_session_id", sid);
    }
    setSessionId(sid);
    
        // Real Integration: Create database PUT once on startup before loading
    const initializeAndLoad = async () => {
      setInitialLoading(true);
      try {
        await dbService.initializeDatabase();
      } catch (error) {
        console.error("Startup DB Initialization failed:", error);
        showToast("Database initialization failed. Working in offline mode.");
      }
      // Always attempt to load tracks (uses local storage cache if Cloudant is offline)
      await loadTracks(sid);
    };

    initializeAndLoad();
  }, []);

  const loadTracks = async (sid) => {
    try {
      const data = await dbService.fetchTracks(sid);
      setTracks(data);
      if (data.length > 0) {
        // Automatically select the most recently updated track
        setActiveTrackId(data[0].id);
      }
    } catch (e) {
      console.error("Failed to load tracks from Cloudant:", e);
      showToast("Could not retrieve tracks from Cloudant database.");
    } finally {
      setInitialLoading(false);
    }
  };

  // Find the active track from state
  const activeTrack = tracks.find((t) => t.id === activeTrackId);

  // Switch Active Track
  const handleSelectTrack = (trackId) => {
    setActiveTrackId(trackId);
  };

  // Create a New Track
  const handleCreateTrack = async (name, stage) => {
    setIsLoading(true);
    const tempTrackId = `${sessionId}_${name}`;
    setActiveTrackId(tempTrackId);

    try {
      // 1. Fetch introductory message and first quiz question from Watson agent
      console.log(`watsonx Call: Initializing track completions for: "${name}"`);
      const response = await sendMessageToAgent("", [], name);
      setIsOnline(true); // API succeeded, mark online

      const newTrack = {
        name,
        stage,
        messages: [{ sender: "agent", text: response }],
        updatedAt: Date.now()
      };

      // 2. Cloudant CRUD: Save new track document to database
      try {
        await dbService.saveTrack(sessionId, name, newTrack);
      } catch (dbErr) {
        // Handle Cloudant failure gracefully: show toast but retain in memory
        console.error("Cloudant CRUD: Save new track document failed:", dbErr);
        showToast("Cloudant sync failed. Track created locally.");
        
        const localTrackRecord = {
          id: tempTrackId,
          sessionId,
          name,
          stage,
          messages: [{ sender: "agent", text: response }],
          updatedAt: Date.now()
        };
        setTracks(prev => [localTrackRecord, ...prev]);
        setActiveTrackId(tempTrackId);
        setIsLoading(false);
        return;
      }

      // Reload list if successful
      const updatedList = await dbService.fetchTracks(sessionId);
      setTracks(updatedList);
      setActiveTrackId(tempTrackId);
    } catch (e) {
      console.error("Failed to create track with watsonx Orchestrate:", e);
      setIsOnline(false); // API failed, mark offline
      setActiveTrackId("");
      showToast("Connection to watsonx Orchestrate failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend !== null ? textToSend : inputMessage).trim();
    if (!text || !activeTrack) return;

    // Reset input box if user typed it
    if (textToSend === null) {
      setInputMessage("");
    }

    // 1. Create and append User message
    const userMsg = { sender: "user", text };
    const updatedMessages = [...activeTrack.messages, userMsg];

    // Optimistically update tracks local state immediately (rather than losing message)
    const updatedTrack = {
      ...activeTrack,
      messages: updatedMessages,
      updatedAt: Date.now()
    };
    
    setTracks((prev) =>
      prev
        .map((t) => (t.id === activeTrack.id ? updatedTrack : t))
        .sort((a, b) => b.updatedAt - a.updatedAt)
    );

    // 2. Cloudant CRUD: Save user message in active track document to DB
    try {
      await dbService.saveTrack(sessionId, activeTrack.name, updatedTrack);
    } catch (dbError) {
      console.error("Cloudant CRUD: Failed to save user message:", dbError);
      showToast("Cloudant sync failed. Local history preserved.");
    }

    setIsLoading(true);

    try {
      // 3. watsonx Call: Query the agent chat completions API
      console.log(`watsonx Call: Fetching response for prompt: "${text}"`);
      const response = await sendMessageToAgent(text, updatedMessages, activeTrack.name);
      setIsOnline(true); // Agent online

      // 4. Scan agent response to check for skill level calibration keywords
      let newStage = activeTrack.stage;
      if (response.includes("**Intermediate**")) {
        newStage = "Intermediate";
      } else if (response.includes("**Beginner**")) {
        newStage = "Beginner";
      } else if (response.includes("**Advanced**")) {
        newStage = "Advanced";
      }

      // 5. Create and append Agent response
      const agentMsg = { sender: "agent", text: response };
      const finalTrack = {
        ...updatedTrack,
        stage: newStage,
        messages: [...updatedMessages, agentMsg],
        updatedAt: Date.now()
      };

      // 6. Cloudant CRUD: Save agent message to DB
      try {
        await dbService.saveTrack(sessionId, activeTrack.name, finalTrack);
      } catch (dbError) {
        console.error("Cloudant CRUD: Failed to save agent response:", dbError);
        showToast("Cloudant sync failed. Local history preserved.");
      }

      // Re-load tracks list to update sidebar sorting and stages
      setTracks((prev) =>
        prev
          .map((t) => (t.id === activeTrack.id ? finalTrack : t))
          .sort((a, b) => b.updatedAt - a.updatedAt)
      );
    } catch (e) {
      // watsonx call failed: set Agent Offline and append inline error bubble
      console.error("watsonx Call: Error communicating with completions API:", e);
      setIsOnline(false); // Mark offline

      const errorAgentMsg = {
        sender: "agent",
        text: "⚠️ **Connection Error**: LearnMate is currently offline. Please check your network connection or try again later."
      };
      
      const errorTrack = {
        ...updatedTrack,
        messages: [...updatedMessages, errorAgentMsg],
        updatedAt: Date.now()
      };

      // Sync state so the error message renders in the chat
      setTracks((prev) =>
        prev.map((t) => (t.id === activeTrack.id ? errorTrack : t))
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Delete learning track
  const handleDeleteTrack = async (trackName) => {
    try {
      await dbService.deleteTrack(sessionId, trackName);
      const refreshed = await dbService.fetchTracks(sessionId);
      setTracks(refreshed);
      if (refreshed.length > 0) {
        setActiveTrackId(refreshed[0].id);
      } else {
        setActiveTrackId("");
      }
    } catch (e) {
      console.error("Cloudant CRUD: Delete track failed:", e);
      showToast("Failed to delete track document in Cloudant.");
    }
  };

  return (
    <div className="flex h-screen w-screen bg-bgPrimary text-textPrimary overflow-hidden font-sans">
      {/* Toast Alert Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <div className="px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-950/85 backdrop-blur-md text-xs font-semibold text-rose-200 shadow-2xl flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:text-white text-neutral-400">×</button>
          </div>
        </div>
      )}

      {/* Collapsible Left Sidebar */}
      <Sidebar
        tracks={tracks}
        activeTrackId={activeTrackId}
        onSelectTrack={handleSelectTrack}
        onCreateTrack={handleCreateTrack}
        onDeleteTrack={handleDeleteTrack}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Chat Interface Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full bg-bgPrimary">
        {/* Mobile Navbar / Desktop Header */}
        <header className="flex items-center justify-between h-16 px-4 md:px-8 border-b border-[#2d2d2d] bg-bgSecondary/30 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-bgInput text-textSecondary hover:text-textPrimary md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {activeTrack ? (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-textPrimary truncate max-w-[180px] md:max-w-md">
                    {activeTrack.name}
                  </h2>
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-accent/10 border border-accent/25 text-accent">
                    {activeTrack.stage}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-accent" />
                <h2 className="text-sm font-bold text-textPrimary">LearnMate Workspace</h2>
              </div>
            )}
          </div>
          
          {/* Real Integration: Dynamic online/offline indicator in the header */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
            <span className="text-xs text-neutral-500 font-mono">Agent: {isOnline ? "Online" : "Offline"}</span>
          </div>
        </header>

        {/* Chat History View */}
        {initialLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4"></div>
            <p className="text-sm text-textSecondary font-medium">Syncing with Cloudant...</p>
          </div>
        ) : activeTrack ? (
          <ChatWindow
            messages={activeTrack.messages}
            isLoading={isLoading}
            onSelectOption={handleSendMessage}
            trackName={activeTrack.name}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#242424] border border-[#333333] flex items-center justify-center text-neutral-500 mb-6">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-textPrimary mb-2">No Active Track</h3>
            <p className="text-xs text-textSecondary mb-6 leading-relaxed">
              Create a new learning track to calibrate your skills with the watsonx Orchestrate AI agent and build a custom roadmap.
            </p>
            <button
              onClick={() => setSidebarOpen(true)}
              className="py-2 px-5 font-semibold text-xs rounded-lg bg-accent text-white hover:bg-accent-dark transition-all duration-200 shadow-md shadow-accent/15"
            >
              Open Track Menu
            </button>
          </div>
        )}

        {/* Bottom Input Area */}
        {activeTrack && (
          <ChatInput
            value={inputMessage}
            onChange={setInputMessage}
            onSend={() => handleSendMessage()}
            disabled={isLoading}
          />
        )}
      </main>
    </div>
  );
}
