import { isLocalhostUrl } from "@/lib/app-url";

export type PhonePeInitResult = {
  redirectUrl: string;
  merchantTransactionId: string;
  mock?: boolean;
};

export type PhonePeOrderStatus = {
  state: "PENDING" | "COMPLETED" | "FAILED" | string;
  transactionId?: string;
  amountPaise?: number;
};

export type PhonePeHealthStatus = {
  ok: boolean;
  mock: boolean;
  environment: "production" | "sandbox";
  authOk: boolean;
  credentialsPresent: boolean;
  merchantIdPresent: boolean;
  redirectUrlExample: string | null;
  issues: string[];
};

let tokenCache: { token: string; expiresAt: number } | null = null;

export function phonePeEnvironment(): "production" | "sandbox" {
  return process.env.PHONEPE_ENV === "production" ? "production" : "sandbox";
}

function isProduction(): boolean {
  return phonePeEnvironment() === "production";
}

function oauthUrl(): string {
  return isProduction()
    ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
}

function checkoutBase(): string {
  return isProduction()
    ? "https://api.phonepe.com/apis/pg"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";
}

export function isPhonePeMock(): boolean {
  return process.env.PHONEPE_MOCK === "true";
}

function hasV2Credentials(): boolean {
  return Boolean(
    process.env.PHONEPE_CLIENT_ID &&
      process.env.PHONEPE_CLIENT_SECRET &&
      process.env.PHONEPE_CLIENT_VERSION,
  );
}

function requireV2Credentials(): void {
  if (isPhonePeMock()) return;
  if (!hasV2Credentials()) {
    throw new Error(
      "PhonePe credentials missing. Set PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, and PHONEPE_CLIENT_VERSION from the PhonePe Business dashboard (Developer Settings).",
    );
  }
}

/** PhonePe allows only [A-Za-z0-9_-], max 63 chars. */
export function sanitizeMerchantOrderId(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 63);
  return cleaned || `SWING_${Date.now()}`;
}

export function validatePhonePeRedirectUrl(redirectUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(redirectUrl);
  } catch {
    throw new Error("Invalid payment return URL.");
  }

  if (isProduction()) {
    if (isLocalhostUrl(redirectUrl)) {
      throw new Error(
        "PhonePe production cannot use localhost. Set NEXT_PUBLIC_APP_URL to https://swing-pos.vercel.app and pay from that domain (not npm run dev).",
      );
    }
    if (parsed.protocol !== "https:") {
      throw new Error(
        "PhonePe production requires HTTPS return URL. Use https://swing-pos.vercel.app on Vercel.",
      );
    }
  }
}

async function getAccessToken(): Promise<string> {
  requireV2Credentials();

  const nowSec = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiresAt > nowSec + 120) {
    return tokenCache.token;
  }

  const body = new URLSearchParams({
    client_id: process.env.PHONEPE_CLIENT_ID!,
    client_version: process.env.PHONEPE_CLIENT_VERSION!,
    client_secret: process.env.PHONEPE_CLIENT_SECRET!,
    grant_type: "client_credentials",
  });

  const res = await fetch(oauthUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await res.json()) as {
    access_token?: string;
    expires_at?: number;
    message?: string;
    code?: string;
  };

  if (!res.ok || !json.access_token) {
    throw new Error(
      json.message ??
        `PhonePe auth failed (${json.code ?? res.status}). Check CLIENT_ID, CLIENT_SECRET, CLIENT_VERSION, and PHONEPE_ENV.`,
    );
  }

  tokenCache = {
    token: json.access_token,
    expiresAt: json.expires_at ?? nowSec + 3600,
  };

  return json.access_token;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `O-Bearer ${token}`,
  };
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  if (merchantId) {
    headers["X-MERCHANT-ID"] = merchantId;
  }
  return headers;
}

export async function getPhonePeHealthStatus(
  sampleRedirectUrl?: string,
): Promise<PhonePeHealthStatus> {
  const issues: string[] = [];
  const mock = isPhonePeMock();
  const environment = phonePeEnvironment();
  const credentialsPresent = hasV2Credentials();
  const merchantIdPresent = Boolean(process.env.PHONEPE_MERCHANT_ID?.trim());

  if (!mock && !credentialsPresent) {
    issues.push("Missing PHONEPE_CLIENT_ID, CLIENT_SECRET, or CLIENT_VERSION.");
  }
  if (!mock && !merchantIdPresent) {
    issues.push("Missing PHONEPE_MERCHANT_ID.");
  }

  if (sampleRedirectUrl) {
    try {
      validatePhonePeRedirectUrl(sampleRedirectUrl);
    } catch (err) {
      issues.push(err instanceof Error ? err.message : "Invalid redirect URL.");
    }
  }

  if (environment === "production" && !mock) {
    issues.push(
      "Whitelist this exact redirect URL in PhonePe dashboard (no query params): https://swing-pos.vercel.app/api/payments/phonepe/callback",
    );
    issues.push(
      "Customers must start payment from https://swing-pos.vercel.app (not localhost).",
    );
    issues.push(
      "UPI 'Something went wrong' often means paying from localhost or an unlisted domain — use the Vercel link in Chrome.",
    );
  }

  let authOk = mock;
  if (!mock && credentialsPresent) {
    try {
      await getAccessToken();
      authOk = true;
    } catch (err) {
      authOk = false;
      issues.push(
        err instanceof Error ? err.message : "PhonePe OAuth token failed.",
      );
    }
  }

  return {
    ok: issues.length === 0 && (mock || authOk),
    mock,
    environment,
    authOk,
    credentialsPresent,
    merchantIdPresent,
    redirectUrlExample: sampleRedirectUrl ?? null,
    issues,
  };
}

export async function getPhonePeOrderStatus(
  merchantOrderId: string,
): Promise<PhonePeOrderStatus> {
  if (isPhonePeMock()) {
    return { state: "PENDING" };
  }

  const res = await fetch(
    `${checkoutBase()}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`,
    { headers: await authHeaders(), cache: "no-store" },
  );

  const json = (await res.json()) as {
    state?: string;
    amount?: number;
    code?: string;
    message?: string;
    paymentDetails?: Array<{ transactionId?: string; state?: string }>;
  };

  if (!res.ok) {
    throw new Error(
      json.message ?? `PhonePe status check failed (${json.code ?? res.status}).`,
    );
  }

  const latestPayment = json.paymentDetails?.[0];
  return {
    state: json.state ?? "PENDING",
    transactionId: latestPayment?.transactionId,
    amountPaise: json.amount,
  };
}

export async function createPhonePePayment(params: {
  merchantTransactionId: string;
  amountPaise: number;
  redirectUrl: string;
  mobileNumber?: string;
  bookingId?: string;
}): Promise<PhonePeInitResult> {
  const merchantTransactionId = sanitizeMerchantOrderId(
    params.merchantTransactionId,
  );
  validatePhonePeRedirectUrl(params.redirectUrl);

  if (isPhonePeMock()) {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
    const appUrl =
      envUrl && !envUrl.includes("localhost") ? envUrl : "http://localhost:3000";
    return {
      redirectUrl: `${appUrl}/api/payments/phonepe/mock-confirm?merchantTransactionId=${encodeURIComponent(merchantTransactionId)}`,
      merchantTransactionId,
      mock: true,
    };
  }

  requireV2Credentials();

  const phone = params.mobileNumber?.replace(/\D/g, "").slice(-10) ?? "";

  const body: Record<string, unknown> = {
    merchantOrderId: merchantTransactionId,
    amount: params.amountPaise,
    expireAfter: 900,
    paymentFlow: {
      type: "PG_CHECKOUT",
      message: "Swing turf booking",
      merchantUrls: {
        redirectUrl: params.redirectUrl,
      },
    },
    metaInfo: {
      udf1: (params.bookingId ?? "").slice(0, 256),
      udf2: phone.slice(0, 256),
    },
  };

  if (phone.length === 10) {
    body.prefillUserLoginDetails = { phoneNumber: `+91${phone}` };
  }

  const res = await fetch(`${checkoutBase()}/checkout/v2/pay`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    redirectUrl?: string;
    orderId?: string;
    code?: string;
    message?: string;
  };

  if (!res.ok || !json.redirectUrl) {
    console.error("[phonepe] pay failed", {
      status: res.status,
      code: json.code,
      message: json.message,
      redirectUrl: params.redirectUrl,
    });
    throw new Error(
      json.message ??
        `PhonePe payment initiation failed (${json.code ?? res.status}).`,
    );
  }

  return {
    redirectUrl: json.redirectUrl,
    merchantTransactionId,
  };
}
