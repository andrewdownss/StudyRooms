"use client";

import { useState } from "react";

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail: string | null;
  defaultBookingId: string | null;
}

export function ReportIssueModal({ isOpen, onClose, defaultEmail, defaultBookingId }: ReportIssueModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState<string>(defaultEmail ?? "");
  const [issueType, setIssueType] = useState<"room-issue" | "booking-problem" | "feature-request" | "other">("other");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [bookingId, setBookingId] = useState<string>(defaultBookingId ?? "");
  const [roomId, setRoomId] = useState<string>("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  async function submitIssue() {
    setMessage(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          issueType,
          title: title || undefined,
          description,
          bookingId: bookingId || undefined,
          roomId: roomId || undefined,
        }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Thanks! Your issue was submitted." });
        setTitle("");
        setDescription("");
        setTimeout(() => onClose(), 1000);
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: data.error ? JSON.stringify(data.error) : "Failed to submit issue" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Report an issue</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="room-issue">Room issue</option>
              <option value="booking-problem">Booking problem</option>
              <option value="feature-request">Feature request</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary"
              className="w-full px-3 py-2 border rounded-md"
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened?"
              rows={4}
              className="w-full px-3 py-2 border rounded-md"
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking ID (optional)</label>
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room ID (optional)</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-100 text-gray-800">Cancel</button>
          <button
            onClick={submitIssue}
            disabled={isSubmitting || description.trim().length === 0}
            className="px-4 py-2 rounded-md bg-red-800 text-white disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string | null;
  defaultBookingId?: string | null;
}

export function ReportIssueModal({
  isOpen,
  onClose,
  defaultEmail,
  defaultBookingId,
}: ReportIssueModalProps) {
  const [issueType, setIssueType] = useState<string>("room-issue");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState<string>(defaultEmail || "");
  const [bookingId, setBookingId] = useState<string>(defaultBookingId || "");
  const [roomId, setRoomId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
    if (defaultBookingId) setBookingId(defaultBookingId);
  }, [defaultEmail, defaultBookingId]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType,
          description,
          email: email || undefined,
          bookingId: bookingId || undefined,
          roomId: roomId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit issue");
      }
      setSuccess("Thanks! Your report has been submitted.");
      setDescription("");
      setBookingId(bookingId || "");
      setRoomId("");
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !isSubmitting && onClose()}
      />
      <div className="relative bg-white w-full max-w-lg rounded-lg shadow-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Report an issue
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Close"
            disabled={isSubmitting}
            title="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-sm rounded border border-red-200 bg-red-50 text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm rounded border border-green-200 bg-green-50 text-green-700">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue type
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            >
              <option value="room-issue">Problem with a room</option>
              <option value="booking-problem">Problem with a booking</option>
              <option value="feature-request">Feature request</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="What's wrong? Include any details that help us reproduce it."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Please include date/time and room if relevant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking ID (optional)
              </label>
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="cuid..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room ID (optional)
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="cuid..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact email{" "}
              {defaultEmail ? (
                <span className="text-gray-400">(pre-filled)</span>
              ) : (
                <span className="text-gray-400">(required if not signed in)</span>
              )}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-800 text-white font-semibold hover:bg-red-900 disabled:opacity-50"
              disabled={isSubmitting || description.trim().length < 10}
            >
              {isSubmitting ? "Submitting..." : "Submit report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


