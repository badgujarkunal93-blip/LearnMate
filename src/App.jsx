import React, { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";
import { dbService } from "./services/db";
import { sendMessageToAgent } from "./services/ai";
import {
  generateGreeting,
  createAssessmentState,
  getAssessmentState,
  processAssessmentAnswer,
  isAssessmentInProgress
} from "./services/assessment";
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

  // B5 fix: track toast timeout ID so we can clear it on unmount / new toast
  const toastTimeoutRef = useRef(null);

  // B4 fix: ref-based guard to prevent double-send race condition
  const sendingRef = useRef(false);

  // B1 fix: keep a ref that always tracks the latest activeTrackId so async
  // callbacks don't close over a stale value
  const activeTrackIdRef = useRef(activeTrackId);
  useEffect(() => {
    activeTrackIdRef.current = activeTrackId;
  }, [activeTrackId]);

  // B2/B5 fix: Trigger non-blocking toast notification, clearing any previous timeout
  const showToast = useCallback((message, type = "error") => {
    // Clear any pending timeout from a previous toast so it doesn't
    // prematurely dismiss the new one
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4500);
  }, []);

  // B5 fix: clean up toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

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
      // Sort once after loading
      const sorted = [...data].sort((a, b) => b.updatedAt - a.updatedAt);
      setTracks(sorted);
      if (sorted.length > 0) {
        // Automatically select the most recently updated track
        setActiveTrackId(sorted[0].id);
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
    // B3 fix: prevent duplicate track names
    const tempTrackId = `${sessionId}_${name}`;
    if (tracks.some((t) => t.id === tempTrackId)) {
      showToast(`A track named "${name}" already exists.`, "error");
      return;
    }

    setIsLoading(true);
    setActiveTrackId(tempTrackId);

    try {
      // 1. Generate local initial greeting (no watsonx call required!)
      const greeting = generateGreeting(name);
      const assessmentState = createAssessmentState();

      const newTrack = {
        name,
        stage,
        messages: [{ sender: "agent", text: greeting }],
        assessment: assessmentState,
        updatedAt: Date.now()
      };

      // 2. Cloudant CRUD: Save new track document to database
      let savedRev = null;
      try {
        const saved = await dbService.saveTrack(sessionId, name, newTrack);
        savedRev = saved.rev;
      } catch (dbErr) {
        // Handle Cloudant failure gracefully: show toast but retain in memory
        console.error("Cloudant CRUD: Save new track document failed:", dbErr);
        showToast("Cloudant sync failed. Track created locally.");
      }

      // Prepend the new track directly to local state
      const localTrackRecord = {
        id: tempTrackId,
        rev: savedRev,
        sessionId,
        name,
        stage,
        messages: [{ sender: "agent", text: greeting }],
        assessment: assessmentState,
        updatedAt: Date.now()
      };
      setTracks((prev) => [localTrackRecord, ...prev]);
      setActiveTrackId(tempTrackId);
    } catch (e) {
      console.error("Failed to create track locally:", e);
      setActiveTrackId("");
      showToast("Failed to initialize track.");
    } finally {
      setIsLoading(false);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend !== null ? textToSend : inputMessage).trim();
    if (!text || !activeTrack) return;

    // B4 fix: guard against double-send while React state hasn't flushed yet
    if (sendingRef.current) return;
    sendingRef.current = true;

    // B1 fix: capture the track id at call time and use it throughout
    const currentTrackId = activeTrackId;
    const currentTrack = activeTrack;

    // Reset input box if user typed it
    if (textToSend === null) {
      setInputMessage("");
    }

    // 1. Create and append User message
    const userMsg = { sender: "user", text };
    const updatedMessages = [...currentTrack.messages, userMsg];

    // Check if diagnostic quiz assessment is in progress
    const assessment = getAssessmentState(currentTrack);
    const inProgress = isAssessmentInProgress(assessment);

    if (inProgress) {
      // PROCESS DIAGNOSTIC QUIZ LOCALLY
      const { responseText, updatedAssessment, determinedStage } = processAssessmentAnswer(
        currentTrack.name,
        assessment,
        text
      );

      const agentMsg = { sender: "agent", text: responseText };
      const finalTrack = {
        ...currentTrack,
        stage: determinedStage || currentTrack.stage,
        messages: [...updatedMessages, agentMsg],
        assessment: updatedAssessment,
        updatedAt: Date.now()
      };

      // Optimistically update tracks local state immediately
      setTracks((prev) => {
        const updated = prev.map((t) => (t.id === currentTrackId ? finalTrack : t));
        const idx = updated.findIndex((t) => t.id === currentTrackId);
        if (idx > 0) {
          const [item] = updated.splice(idx, 1);
          updated.unshift(item);
        }
        return updated;
      });

      setIsLoading(true);
      try {
        const saved = await dbService.saveTrack(sessionId, currentTrack.name, finalTrack);
        setTracks((prev) => prev.map((t) => (t.id === currentTrackId ? { ...t, rev: saved.rev } : t)));
      } catch (dbError) {
        console.error("Cloudant CRUD: Failed to save local assessment step:", dbError);
        showToast("Cloudant sync failed. Local history preserved.");
      } finally {
        setIsLoading(false);
        sendingRef.current = false;
      }
      return;
    }

    // If assessment is already complete, use watsonx Orchestrate for general tutoring
    const updatedTrack = {
      ...currentTrack,
      messages: updatedMessages,
      updatedAt: Date.now()
    };
    
    // Update local state with user message
    setTracks((prev) => {
      const updated = prev.map((t) => (t.id === currentTrackId ? updatedTrack : t));
      const idx = updated.findIndex((t) => t.id === currentTrackId);
      if (idx > 0) {
        const [item] = updated.splice(idx, 1);
        updated.unshift(item);
      }
      return updated;
    });

    setIsLoading(true);
    const userSavePromise = dbService.saveTrack(sessionId, currentTrack.name, updatedTrack)
      .then((saved) => {
        setTracks((prev) => prev.map((t) => (t.id === currentTrackId ? { ...t, rev: saved.rev } : t)));
        return saved.rev;
      })
      .catch((dbError) => {
        console.error("Cloudant CRUD: Failed to save user message:", dbError);
        showToast("Cloudant sync failed. Local history preserved.");
        return null;
      });

    try {
      console.log(`watsonx Call: Fetching response for prompt: "${text}"`);
      const [response, userSaveRev] = await Promise.all([
        sendMessageToAgent(text, updatedMessages, currentTrack.name, currentTrack.stage),
        userSavePromise
      ]);
      setIsOnline(true); // Agent online

      const agentMsg = { sender: "agent", text: response };
      const finalTrack = {
        ...updatedTrack,
        rev: userSaveRev || updatedTrack.rev,
        messages: [...updatedMessages, agentMsg],
        updatedAt: Date.now()
      };

      let savedRev = finalTrack.rev;
      try {
        const saved = await dbService.saveTrack(sessionId, currentTrack.name, finalTrack);
        savedRev = saved.rev;
      } catch (dbError) {
        console.error("Cloudant CRUD: Failed to save agent response:", dbError);
        showToast("Cloudant sync failed. Local history preserved.");
      }

      setTracks((prev) => {
        const updated = prev.map((t) => (t.id === currentTrackId ? { ...finalTrack, rev: savedRev } : t));
        const idx = updated.findIndex((t) => t.id === currentTrackId);
        if (idx > 0) {
          const [item] = updated.splice(idx, 1);
          updated.unshift(item);
        }
        return updated;
      });
    } catch (e) {
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

      setTracks((prev) =>
        prev.map((t) => (t.id === currentTrackId ? errorTrack : t))
      );
    } finally {
      setIsLoading(false);
      sendingRef.current = false;
    }
  };

  // Delete learning track
  // P5 fix: remove track from local state directly instead of full fetchTracks() refetch
  const handleDeleteTrack = async (trackName) => {
    // Remove from local state immediately for instant UI feedback
    const deletedTrackId = `${sessionId}_${trackName}`;
    setTracks((prev) => {
      const remaining = prev.filter((t) => t.id !== deletedTrackId);
      // If the deleted track was active, switch to the next available
      if (activeTrackIdRef.current === deletedTrackId) {
        setActiveTrackId(remaining.length > 0 ? remaining[0].id : "");
      }
      return remaining;
    });

    // Delete from Cloudant in the background
    try {
      await dbService.deleteTrack(sessionId, trackName);
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
        sessionId={sessionId}
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
