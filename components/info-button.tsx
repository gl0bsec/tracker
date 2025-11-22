"use client"

interface InfoButtonProps {
  onClick: () => void
}

export function InfoButton({ onClick }: InfoButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-[#999] text-[#999] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors ml-1.5"
      aria-label="More information"
      title="More information"
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.06 6C6.21673 5.55444 6.52609 5.17873 6.93329 4.93942C7.34049 4.70011 7.81926 4.61262 8.28478 4.69247C8.75031 4.77232 9.17254 5.01434 9.47671 5.37568C9.78087 5.73702 9.94737 6.19434 9.94667 6.66666C9.94667 8 7.94667 8.66666 7.94667 8.66666M8 11.3333H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.31811 14.6667 1.33334 11.6819 1.33334 8C1.33334 4.3181 4.31811 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"/>
      </svg>
    </button>
  )
}
