import React, { useState } from "react";
import { Plus, MessageSquare, Trash2, X, GraduationCap, ChevronLeft } from "lucide-react";
import { getAvailableTracks } from "../data/roadmaps";

export default function Sidebar({
  tracks,
  activeTrackId,
  onSelectTrack,
  onCreateTrack,
  onDeleteTrack,
  isOpen,
  setIsOpen,
  sessionId
}) {
  const [showNewTrackModal, setShowNewTrackModal] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [initialStage, setInitialStage] = useState("Beginner");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trackName.trim()) return;
    onCreateTrack(trackName.trim(), initialStage);
    setTrackName("");
    setInitialStage("Beginner");
    setShowNewTrackModal(false);
  };

  const selectPreset = (name) => {
    setTrackName(name);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-72 border-r border-[#2d2d2d] bg-bgSecondary transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-accent" />
            <h1 className="text-xl font-bold tracking-tight text-textPrimary">LearnMate</h1>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md hover:bg-bgPrimary text-textSecondary hover:text-textPrimary md:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* New Track Button */}
        <div className="p-4">
          <button
            onClick={() => setShowNewTrackModal(true)}
            className="flex items-center justify-center w-full gap-2 py-2.5 px-4 font-semibold text-sm rounded-lg bg-accent text-white hover:bg-accent-dark active:scale-[0.98] transition-all duration-200 shadow-lg shadow-accent/15"
          >
            <Plus className="w-4 h-4" />
            New Track
          </button>
        </div>

        {/* Track List */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Learning Tracks
          </p>
          {tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="w-8 h-8 mb-2 text-neutral-600" />
              <p className="text-xs text-neutral-500">No tracks saved yet.</p>
              <p className="mt-1 text-[11px] text-neutral-600">Click New Track above to start.</p>
            </div>
          ) : (
            tracks.map((track) => {
              const isActive = track.id === activeTrackId;
              return (
                <div
                  key={track.id}
                  className={`group relative flex items-center justify-between rounded-lg p-2 transition-all duration-200 ${
                    isActive
                      ? "bg-bgPrimary border border-[#3e3e3e] text-textPrimary"
                      : "text-textSecondary hover:bg-bgPrimary/60 hover:text-textPrimary"
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectTrack(track.id);
                      setIsOpen(false); // Close sidebar on mobile select
                    }}
                    className="flex items-start flex-1 gap-3 text-left min-w-0"
                  >
                    <MessageSquare className={`w-4 h-4 mt-1 shrink-0 ${isActive ? "text-accent" : "text-neutral-500"}`} />
                    <div className="min-w-0 pr-6">
                      <p className="text-sm font-medium leading-5 truncate">{track.name}</p>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#2d2d2d] text-neutral-400 mt-1">
                        {track.stage || "Beginner"}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete "${track.name}"?`)) {
                        onDeleteTrack(track.name);
                      }
                    }}
                    className="absolute right-2 p-1.5 rounded-md text-neutral-500 hover:text-red-400 hover:bg-neutral-800 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
                    title="Delete track"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2d2d2d] bg-bgSecondary/50 text-[11px] text-neutral-500 flex flex-col gap-1">
          <p>Session-based Anonymous Mode</p>
          <p className="truncate font-mono">UID: {sessionId ? sessionId.substring(0, 18) : "...loading"}...</p>
        </div>
      </aside>

      {/* New Track Modal */}
      {showNewTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-bgPrimary border border-[#2d2d2d] rounded-xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowNewTrackModal(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-textPrimary mb-4">Start a New Learning Track</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-2">
                  Select a Topic
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {getAvailableTracks().map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => selectPreset(preset)}
                      className={`text-left text-xs p-2.5 rounded-lg border transition-all ${
                        trackName === preset
                          ? "border-accent bg-accent/10 text-textPrimary"
                          : "border-[#2d2d2d] hover:border-neutral-700 bg-bgSecondary text-neutral-400"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                
                <input
                  type="text"
                  placeholder="Or type a custom topic..."
                  value={trackName}
                  onChange={(e) => setTrackName(e.target.value)}
                  className="w-full text-sm bg-bgSecondary border border-[#2d2d2d] focus:border-accent text-textPrimary rounded-lg py-2 px-3 outline-none transition-colors"
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-2">
                  Initial Level
                </label>
                <select
                  value={initialStage}
                  onChange={(e) => setInitialStage(e.target.value)}
                  className="w-full text-sm bg-bgSecondary border border-[#2d2d2d] focus:border-accent text-textPrimary rounded-lg py-2 px-3 outline-none transition-colors"
                >
                  <option value="Beginner">Beginner (Diagnostic quiz will verify)</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3 justify-end text-sm">
                <button
                  type="button"
                  onClick={() => setShowNewTrackModal(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors shadow-md shadow-accent/15"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
