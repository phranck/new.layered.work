import type { CSSProperties } from "react";
import { siGithub, siInstagram, siMastodon, siXing, siYoutube } from "simple-icons";

interface SimpleIcon {
  readonly hex: string;
  readonly title: string;
  readonly path: string;
}

const socialIcons: Record<string, SimpleIcon> = {
  github: siGithub,
  instagram: siInstagram,
  mastodon: siMastodon,
  xing: siXing,
  youtube: siYoutube,
};

export function SocialIcon({ name, title }: { name: string; title: string }) {
  const icon = socialIcons[name.toLowerCase()] ?? socialIcons[title.toLowerCase()];

  if (!icon) {
    return <span className="mono text-xs">{title.slice(0, 1)}</span>;
  }

  return (
    <span
      className="social-icon inline-flex"
      style={{ "--social-color": `#${icon.hex}` } as CSSProperties}
    >
      <svg aria-hidden="true" className="size-4" fill="currentColor" role="img" viewBox="0 0 24 24">
        <path d={icon.path} />
      </svg>
    </span>
  );
}
