export default function Footer() {
  return (
    <footer
      className="border-t px-8 py-8"
      style={{
        borderColor: "rgba(255,255,255,0.05)",
        background: "#0A0A08",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="10" height="10" rx="2" fill="#D4A853" opacity="0.9" />
            <rect x="16" y="2" width="10" height="10" rx="2" fill="#D4A853" opacity="0.6" />
            <rect x="2" y="16" width="10" height="10" rx="2" fill="#D4A853" opacity="0.6" />
            <rect x="16" y="16" width="10" height="10" rx="2" fill="#D4A853" opacity="0.3" />
          </svg>
          <span className="text-sm font-medium" style={{ color: "#555550" }}>
            Trovia · DevClash 2026
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#" className="text-xs transition-colors hover:text-amber-400" style={{ color: "#555550" }}>
            GitHub
          </a>
          <a href="#" className="text-xs transition-colors hover:text-amber-400" style={{ color: "#555550" }}>
            Docs
          </a>
          <a href="#" className="text-xs transition-colors hover:text-amber-400" style={{ color: "#555550" }}>
            Explorer
          </a>
        </div>
      </div>
    </footer>
  );
}
