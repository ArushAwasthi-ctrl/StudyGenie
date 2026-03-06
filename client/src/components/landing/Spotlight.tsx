import { useCallback, useRef, type ReactNode } from "react";

interface SpotlightProps {
  children: ReactNode;
  className?: string;
}

export default function Spotlight({ children, className = "" }: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const { left, top } = container.getBoundingClientRect();
    container.style.setProperty("--spotlight-x", `${e.clientX - left}px`);
    container.style.setProperty("--spotlight-y", `${e.clientY - top}px`);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), var(--spotlight-color), transparent 40%)",
        }}
      />
      {children}
    </div>
  );
}
