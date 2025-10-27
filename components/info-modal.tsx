"use client"

import { useEffect } from "react"

interface InfoModalProps {
  title: string
  content: string
  onClose: () => void
}

export function InfoModal({ title, content, onClose }: InfoModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-fadeIn"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.55)", zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#e0e0e0] rounded p-6 max-w-md w-full max-h-[80vh] overflow-y-auto relative animate-zoomIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-[#999] hover:text-[#1a1a1a] transition-colors"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <h3 className="text-lg font-bold text-[#1a1a1a] mb-4 pr-8">{title}</h3>

        <div
          className="prose prose-sm max-w-none text-[#666] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  )
}
