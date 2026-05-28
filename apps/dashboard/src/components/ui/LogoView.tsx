import type { CSSProperties } from "react";

interface LogoViewProps {
  alt?: string;
  className?: string;
  width?: number | string;
}

/**
 * Shared Layered logo renderer that preserves the original artwork colors.
 *
 * @param props - Optional layout and accessibility customizations.
 * @returns The Layered brand logo.
 */
export function LogoView({ alt = "layered.work", className, width }: LogoViewProps) {
  const style: CSSProperties | undefined = width !== undefined ? { width } : undefined;

  return <img src="/layered-logo.svg" alt={alt} className={className} style={style} />;
}
