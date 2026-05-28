interface AuthLogoProps {
  alt: string;
}

/**
 * Auth page brand logo with the original Layered artwork.
 *
 * @param props.alt - Accessible logo label.
 * @returns Centered dashboard auth logo.
 */
export function AuthLogo({ alt }: AuthLogoProps) {
  return (
    <div className="relative mx-auto h-[120px] w-[240px]">
      <div className="absolute inset-0 rounded-full animate-[auth-glow_8s_ease-in-out_infinite] bg-[var(--color-primary)]" />
      <img src="/layered-logo.svg" alt={alt} className="relative h-full w-full object-contain" />
    </div>
  );
}
