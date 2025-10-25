interface InsightCardProps {
  title: string;
  subtitle: string;
  content: string;
  onClick?: () => void;
}

export function InsightCard({ title, subtitle, content, onClick }: InsightCardProps) {
  // Check if content is long enough to be truncated
  const isContentLong = content.split('\n').length > 11 || content.length > 500;

  return (
    <div
      className="bg-white border border-[#e0e0e0] rounded p-6 h-full flex flex-col hover:border-[#c0c0c0] transition-colors min-h-[352px] cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <h3 className="text-base font-semibold text-[#1a1a1a] mb-2 tracking-tight font-serif">
        {title}
      </h3>
      <p className="text-xs text-[#1a1a1a] mb-3 font-light">
        {subtitle}
      </p>
      <div className="text-xs text-[#666] leading-relaxed font-light">
        <p className="line-clamp-[11]">
          {content}
        </p>
        {isContentLong && (
          <span className="text-[#999] italic mt-1 inline-block"> (click for more)</span>
        )}
      </div>
    </div>
  );
}
