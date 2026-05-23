function normalizeAppUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (
      trimmed.startsWith("http://") &&
      !trimmed.includes("localhost") &&
      !trimmed.includes("127.0.0.1")
    ) {
      return trimmed.replace(/^http:\/\//, "https://");
    }
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function isLocalhostHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
}

function isLocalhostUrl(url: string): boolean {
  try {
    return isLocalhostHost(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Origin from incoming API request (Vercel / reverse proxy headers). */
export function originFromRequest(request: Request): string | null {
  const host = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    ""
  )
    .split(",")[0]
    ?.trim();
  if (!host) return null;

  const protoHeader = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    protoHeader ??
    (isLocalhostHost(host.split(":")[0]) ? "http" : "https");

  return `${proto}://${host}`.replace(/\/$/, "");
}

function isAllowedClientOrigin(clientOrigin: string, request: Request): boolean {
  try {
    const clientHost = new URL(clientOrigin).host;
    const reqOrigin = originFromRequest(request);
    if (reqOrigin && new URL(reqOrigin).host === clientHost) return true;

    const envUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);
    if (envUrl && new URL(envUrl).host === clientHost) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * URL for PhonePe redirectUrl and post-payment redirects.
 * Prefer the live request origin over NEXT_PUBLIC_APP_URL=localhost in .env.
 */
export function resolvePaymentAppUrl(
  request: Request,
  clientOrigin?: string,
): string {
  const fromRequest = originFromRequest(request);
  if (fromRequest && !isLocalhostUrl(fromRequest)) {
    return fromRequest;
  }

  const client = normalizeAppUrl(clientOrigin);
  if (client && isAllowedClientOrigin(client, request) && !isLocalhostUrl(client)) {
    return client;
  }

  const fromEnv = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (fromEnv && !isLocalhostUrl(fromEnv)) {
    return fromEnv;
  }

  if (fromRequest) return fromRequest;
  if (client && isAllowedClientOrigin(client, request)) return client;
  if (fromEnv) return fromEnv;

  return "http://localhost:3000";
}

/** @deprecated Use resolvePaymentAppUrl(request) for payment routes. */
export function getAppUrl(request?: Request): string {
  if (request) return resolvePaymentAppUrl(request);
  const fromEnv = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);
  return fromEnv ?? "http://localhost:3000";
}
