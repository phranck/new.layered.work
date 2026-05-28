import type { ReactNode } from "react";

export function Logo({ className = "logo-img" }: { className?: string }) {
  return <img className={className} src="/layered-logo.svg" alt="LAYERED.work" />;
}

export function Stripes({ className = "" }: { className?: string }) {
  return (
    <div className={`stripes ${className}`}>
      <span className="s1" />
      <span className="s2" />
      <span className="s3" />
      <span className="s4" />
    </div>
  );
}

export function TerminalPrompt({ children }: { children: ReactNode }) {
  return (
    <div className="terminal-prompt">
      {children}
      <span className="caret" />
    </div>
  );
}

export function SectionHeader({ title, addOn }: { title: string; addOn?: ReactNode }) {
  return (
    <div className="section-header">
      <h2 className="section-label text-sm mono uppercase tracking-widest text-[var(--lw-muted)]">
        {title}
      </h2>
      {addOn}
    </div>
  );
}

export function Tag({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={`tag ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function ProjectThumb({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string | null;
  className?: string;
}) {
  return (
    <div className={`project-thumb ${className}`}>
      {src ? <img src={src} alt={alt ?? ""} className="thumb-img" loading="lazy" /> : null}
    </div>
  );
}
