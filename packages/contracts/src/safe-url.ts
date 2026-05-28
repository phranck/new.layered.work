const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname.toLowerCase());
}

type SafeUrlOptions = {
  allowHash?: boolean;
  allowMailto?: boolean;
  allowRelative?: boolean;
  allowTel?: boolean;
};

/**
 * Returns true if a dashboard-configured URL is safe to render as a link.
 */
export function isSafeConfiguredUrl(value: string, options: SafeUrlOptions = {}): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (options.allowHash && trimmed.startsWith("#")) {
    return true;
  }

  if (options.allowRelative && /^\/(?!\/)/.test(trimmed)) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    switch (parsed.protocol) {
      case "https:":
        return true;
      case "http:":
        return isLoopbackHost(parsed.hostname);
      case "mailto:":
        return options.allowMailto ?? false;
      case "tel:":
        return options.allowTel ?? false;
      default:
        return false;
    }
  } catch {
    return false;
  }
}
