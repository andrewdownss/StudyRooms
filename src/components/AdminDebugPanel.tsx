"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

/**
 * Debug Information Interface
 * Encapsulates all debug data in one structure
 */
interface DebugInfo {
  systemTime: Date;
  systemDate: string;
  timezone: string;
  userRole: string;
}

/**
 * Debug Info Service
 * Single Responsibility: Provide system information
 * Encapsulation: Centralizes time/date logic
 */
class DebugInfoService {
  static getCurrentInfo(role?: string): DebugInfo {
    const now = new Date();
    return {
      systemTime: now,
      systemDate: now.toISOString().split('T')[0],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userRole: role || 'unknown'
    };
  }
}

/**
 * Admin Debug Panel Component
 * Only visible to admin users
 * Shows real-time system information for testing
 */
export function AdminDebugPanel() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(true);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [labelBrightness, setLabelBrightness] = useState<number>(200);

  // Auto-refresh time every second
  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo(DebugInfoService.getCurrentInfo(session?.user?.role));
    };
    
    updateDebugInfo(); // Initial call
    const interval = setInterval(updateDebugInfo, 1000);
    
    return () => clearInterval(interval);
  }, [session?.user?.role]);

  // Guard clause - Encapsulation of admin check (after all hooks)
  if (session?.user?.role !== 'admin') return null;

  // Collapsed state - show small indicator
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-xl z-50 hover:bg-purple-700 transition-colors"
        title="Open Debug Panel"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg shadow-2xl z-50 w-80 border border-purple-500">
      {/* Header */}
      <div className="bg-purple-600 px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          <h3 className="font-bold text-sm">Admin Debug Panel</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200 transition-colors"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 font-mono text-sm">
        {/* System Time */}
        <div>
          <div className={`text-gray-${labelBrightness} text-xs uppercase mb-1`}>System Time</div>
          <div className="bg-gray-800 px-3 py-2 rounded border border-gray-700 text-white">
            {debugInfo?.systemTime.toLocaleTimeString('en-US', { 
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>

        {/* System Date */}
        <div>
          <div className={`text-gray-${labelBrightness} text-xs uppercase mb-1`}>System Date</div>
          <div className="bg-gray-800 px-3 py-2 rounded border border-gray-700 text-white">
            {debugInfo?.systemDate}
          </div>
        </div>

        {/* Timezone */}
        <div>
          <div className={`text-gray-${labelBrightness} text-xs uppercase mb-1`}>Timezone</div>
          <div className="bg-gray-800 px-3 py-2 rounded border border-gray-700 text-white text-xs">
            {debugInfo?.timezone}
          </div>
        </div>

        {/* User Role */}
        <div>
          <div className={`text-gray-${labelBrightness} text-xs uppercase mb-1`}>User Role</div>
          <div className="bg-purple-900 px-3 py-2 rounded border border-purple-700 text-white">
            {debugInfo?.userRole}
          </div>
        </div>

        {/* Display Controls */}
        <div className="border-t border-gray-700 pt-3">
          <div className={`text-gray-${labelBrightness} text-xs uppercase mb-2`}>Display Settings</div>
          
          <div>
            <label className="text-xs text-gray-300 mb-1 block">
              Label Brightness: gray-{labelBrightness}
            </label>
            <input
              type="range"
              min="100"
              max="900"
              step="100"
              value={labelBrightness}
              onChange={(e) => setLabelBrightness(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Bright</span>
              <span>Dark</span>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
          Admin panel with adjustable text visibility.
        </div>
      </div>
    </div>
  );
}

