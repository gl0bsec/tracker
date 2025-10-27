"use client"

interface InfoButtonProps {
  onClick: () => void
}

export function InfoButton({ onClick }: InfoButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center w-4 h-4 rounded-sm border border-[#999] text-[#999] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors ml-1.5"
      aria-label="More information"
      title="More information"
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8 7V11M8 5H8.01M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
