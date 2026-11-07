import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";
import { get, put } from "@vercel/blob";

export type PaymentMode = "sandbox" | "live";
export type PaymentProviderId = "stripe" | "paypal" | "affirm" | "afterpay";
export type ProviderStatus = "live" | "sandbox" | "off" | "needs_keys";

type StripeSecrets = {
  enabled: boolean;
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
};

type PaypalSecrets = {
  enabled: boolean;
  mode: PaymentMode;
  clientId: string;
  clientSecret: string;
};

type AffirmSecrets = {
  enabled: boolean;
  mode: PaymentMode;
  publicKey: string;
  privateKey: string;
};

type AfterpaySecrets = {
  enabled: boolean;
  mode: PaymentMode;
  merchantId: string;
  secret: string;
  mpid: string;
  placementId: string;
};

type StoredPaymentConfig = {
  stripe: StripeSecrets;
  paypal: PaypalSecrets;
  affirm: AffirmSecrets;
  afterpay: AfterpaySecrets;
};

export type PaymentAccounts = StoredPaymentConfig & { managed: boolean };

export type AdminPaymentView = {
  keyReady: boolean;
  blobReady: boolean;
  managed: boolean;
  liveCount: number;
  stripe: {
    enabled: boolean;
    publishableKey: string;
    secretHint: string;
    webhookHint: string;
    status: ProviderStatus;
  };
  paypal: {
    enabled: boolean;
    mode: PaymentMode;
    clientId: string;
    secretHint: string;
    status: ProviderStatus;
  };
  affirm: {
    enabled: boolean;
    mode: PaymentMode;
    publicKey: string;
    secretHint: string;
    status: ProviderStatus;
  };
  afterpay: {
    enabled: boolean;
    mode: PaymentMode;
    merchantId: string;
    secretHint: string;
    mpid: string;
    placementId: string;
    status: ProviderStatus;
  };
};

export type PaymentSettingsInput = {
  stripe: {
    enabled: boolean;
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  paypal: {
    enabled: boolean;
    mode: PaymentMode;
    clientId: string;
    clientSecret: string;
  };
  affirm: {
    enabled: boolean;
    mode: PaymentMode;
    publicKey: string;
    privateKey: string;
  };
  afterpay: {
    enabled: boolean;
    mode: PaymentMode;
    merchantId: string;
    secret: string;
  };
};

const BLOB_PATH = "payments/config.enc";
const BLOB_CACHE_SECONDS = 60 * 60 * 24;
const FRESH_MS = 5 * 60 * 1000;
const QUIET_MS = 60 * 60 * 1000;

let memory: { config: StoredPaymentConfig | null; expiresAt: number } | null = null;
let inflight: Promise<StoredPaymentConfig | null> | null = null;
let cacheExtended = false;
let revision = 0;

function encryptionKey() {
  const raw = process.env.PAYMENT_CONFIG_KEY?.trim() || "";
  if (!raw) return null;
  try {
    const key = Buffer.from(raw, "base64");
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

export function paymentConfigKeyReady() {
  return Boolean(encryptionKey());
}

function blobTokenReady() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function emptyStored(): StoredPaymentConfig {
  return {
    stripe: { enabled: false, publishableKey: "", secretKey: "", webhookSecret: "" },
    paypal: { enabled: false, mode: "sandbox", clientId: "", clientSecret: "" },
    affirm: { enabled: false, mode: "sandbox", publicKey: "", privateKey: "" },
    afterpay: {
      enabled: false,
      mode: "sandbox",
      merchantId: "",
      secret: "",
      mpid: "",
      placementId: "",
    },
  };
}

export function maskSecret(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 8) return "Saved";
  return `${trimmed.slice(0, 7)}…${trimmed.slice(-4)}`;
}

function stripeMode(secretKey: string, publishableKey: string): PaymentMode {
  const sample = secretKey || publishableKey;
  return sample.includes("_live_") ? "live" : "sandbox";
}

function statusFor(
  enabled: boolean,
  ready: boolean,
  mode: PaymentMode,
): ProviderStatus {
  if (!enabled) return "off";
  if (!ready) return "needs_keys";
  return mode === "live" ? "live" : "sandbox";
}

function decryptStored(key: Buffer, raw: string) {
  const envelope = JSON.parse(raw) as {
    iv: string;
    tag: string;
    data: string;
  };
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const json = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return normalizeStored(JSON.parse(json));
}

function cacheLifetime(header: string | null | undefined) {
  const ages = [...(header || "").matchAll(/(?:s-maxage|max-age)=(\d+)/gi)].map((match) =>
    Number(match[1]),
  );
  const finite = ages.filter((age) => Number.isFinite(age));
  if (!finite.length) return 0;
  return Math.max(...finite);
}

function remember(config: StoredPaymentConfig | null, maxAgeSeconds: number) {
  const ttl = maxAgeSeconds >= 3600 ? FRESH_MS : QUIET_MS;
  memory = { config, expiresAt: Date.now() + ttl };
}

async function extendBlobCache(raw: string, etag: string) {
  try {
    await put(BLOB_PATH, raw, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: BLOB_CACHE_SECONDS,
      ifMatch: etag,
    });
  } catch {
    cacheExtended = false;
  }
}

async function loadStored(key: Buffer): Promise<StoredPaymentConfig | null> {
  const rev = revision;
  try {
    // CDN hits are free on Hobby. Skipping the cache bills every product view.
    const result = await get(BLOB_PATH, { access: "private" });
    if (revision !== rev) return memory?.config ?? null;
    if (!result || result.statusCode !== 200 || !result.stream) {
      remember(null, 0);
      return null;
    }
    const raw = await new Response(result.stream).text();
    const config = decryptStored(key, raw);
    if (revision !== rev) return memory?.config ?? config;
    let lifetime = cacheLifetime(result.blob.cacheControl);
    if (!cacheExtended && lifetime < 3600) {
      cacheExtended = true;
      await extendBlobCache(raw, result.blob.etag);
      if (revision !== rev) return memory?.config ?? config;
      if (cacheExtended) lifetime = BLOB_CACHE_SECONDS;
    }
    remember(config, lifetime);
    return config;
  } catch {
    if (revision !== rev) return memory?.config ?? null;
    if (memory?.config) {
      memory = { config: memory.config, expiresAt: Date.now() + FRESH_MS };
      return memory.config;
    }
    memory = { config: null, expiresAt: Date.now() + FRESH_MS };
    return null;
  }
}

async function readStored(): Promise<StoredPaymentConfig | null> {
  const key = encryptionKey();
  if (!key || !blobTokenReady()) return null;
  if (memory && memory.expiresAt > Date.now()) return memory.config;
  if (!inflight) {
    inflight = loadStored(key).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

function normalizeStored(value: Partial<StoredPaymentConfig>): StoredPaymentConfig {
  const base = emptyStored();
  return {
    stripe: { ...base.stripe, ...value.stripe },
    paypal: { ...base.paypal, ...value.paypal },
    affirm: { ...base.affirm, ...value.affirm },
    afterpay: { ...base.afterpay, ...value.afterpay },
  };
}

export async function getPaymentAccounts(): Promise<PaymentAccounts> {
  const stored = await readStored();
  if (!stored) return { ...emptyStored(), managed: false };
  return { ...stored, managed: true };
}

export async function getAdminPaymentView(): Promise<AdminPaymentView> {
  const accounts = await getPaymentAccounts();
  const stripeReady = Boolean(accounts.stripe.publishableKey && accounts.stripe.secretKey);
  const paypalReady = Boolean(accounts.paypal.clientId && accounts.paypal.clientSecret);
  const affirmReady = Boolean(accounts.affirm.publicKey && accounts.affirm.privateKey);
  const afterpayReady = Boolean(accounts.afterpay.merchantId && accounts.afterpay.secret);
  const stripeModeValue = stripeMode(accounts.stripe.secretKey, accounts.stripe.publishableKey);
  const statuses: ProviderStatus[] = [
    statusFor(accounts.stripe.enabled, stripeReady, stripeModeValue),
    statusFor(accounts.paypal.enabled, paypalReady, accounts.paypal.mode),
    statusFor(accounts.affirm.enabled, affirmReady, accounts.affirm.mode),
    statusFor(accounts.afterpay.enabled, afterpayReady, accounts.afterpay.mode),
  ];
  return {
    keyReady: paymentConfigKeyReady(),
    blobReady: blobTokenReady(),
    managed: accounts.managed,
    liveCount: statuses.filter((status) => status === "live" || status === "sandbox").length,
    stripe: {
      enabled: accounts.stripe.enabled,
      publishableKey: accounts.stripe.publishableKey,
      secretHint: maskSecret(accounts.stripe.secretKey),
      webhookHint: maskSecret(accounts.stripe.webhookSecret),
      status: statuses[0],
    },
    paypal: {
      enabled: accounts.paypal.enabled,
      mode: accounts.paypal.mode,
      clientId: accounts.paypal.clientId,
      secretHint: maskSecret(accounts.paypal.clientSecret),
      status: statuses[1],
    },
    affirm: {
      enabled: accounts.affirm.enabled,
      mode: accounts.affirm.mode,
      publicKey: accounts.affirm.publicKey,
      secretHint: maskSecret(accounts.affirm.privateKey),
      status: statuses[2],
    },
    afterpay: {
      enabled: accounts.afterpay.enabled,
      mode: accounts.afterpay.mode,
      merchantId: accounts.afterpay.merchantId,
      secretHint: maskSecret(accounts.afterpay.secret),
      mpid: accounts.afterpay.mpid,
      placementId: accounts.afterpay.placementId,
      status: statuses[3],
    },
  };
}

function assertPair(label: string, publishable: string, secret: string, liveMark: string) {
  if (!publishable && !secret) return;
  if (!publishable || !secret) {
    throw new Error(`${label} needs both keys.`);
  }
  const publishableLive = publishable.includes(liveMark);
  const secretLive = secret.includes(liveMark);
  if (publishableLive !== secretLive) {
    throw new Error(`${label} live and test keys are mixed.`);
  }
}

export function validatePaymentInput(input: PaymentSettingsInput, resolved: StoredPaymentConfig) {
  const stripePublishable = input.stripe.publishableKey.trim() || resolved.stripe.publishableKey;
  const stripeSecret = input.stripe.secretKey.trim() || resolved.stripe.secretKey;
  const stripeWebhook = input.stripe.webhookSecret.trim() || resolved.stripe.webhookSecret;
  if (stripePublishable && !stripePublishable.startsWith("pk_")) {
    throw new Error("Stripe publishable key must start with pk_.");
  }
  if (stripeSecret && !stripeSecret.startsWith("sk_")) {
    throw new Error("Stripe secret key must start with sk_.");
  }
  if (stripeWebhook && !stripeWebhook.startsWith("whsec_")) {
    throw new Error("Stripe webhook secret must start with whsec_.");
  }
  assertPair("Stripe", stripePublishable, stripeSecret, "_live_");
  const mode = (value: string): PaymentMode => (value === "live" ? "live" : "sandbox");
  return {
    stripe: {
      enabled: input.stripe.enabled,
      publishableKey: stripePublishable,
      secretKey: stripeSecret,
      webhookSecret: stripeWebhook,
    },
    paypal: {
      enabled: input.paypal.enabled,
      mode: mode(input.paypal.mode),
      clientId: input.paypal.clientId.trim() || resolved.paypal.clientId,
      clientSecret: input.paypal.clientSecret.trim() || resolved.paypal.clientSecret,
    },
    affirm: {
      enabled: input.affirm.enabled,
      mode: mode(input.affirm.mode),
      publicKey: input.affirm.publicKey.trim() || resolved.affirm.publicKey,
      privateKey: input.affirm.privateKey.trim() || resolved.affirm.privateKey,
    },
    afterpay: {
      enabled: input.afterpay.enabled,
      mode: mode(input.afterpay.mode),
      merchantId: input.afterpay.merchantId.trim() || resolved.afterpay.merchantId,
      secret: input.afterpay.secret.trim() || resolved.afterpay.secret,
      mpid: resolved.afterpay.mpid,
      placementId: resolved.afterpay.placementId,
    },
  } satisfies StoredPaymentConfig;
}

export async function savePaymentSettings(input: PaymentSettingsInput) {
  const key = encryptionKey();
  if (!key) {
    throw new Error("Set PAYMENT_CONFIG_KEY before saving payment accounts.");
  }
  const current = await getPaymentAccounts();
  const baseline: StoredPaymentConfig = current.managed ? current : emptyStored();
  const next = validatePaymentInput(input, baseline);
  await writeStored(next);
}

export async function clearProviderSecrets(provider: PaymentProviderId) {
  const key = encryptionKey();
  if (!key) {
    throw new Error("Set PAYMENT_CONFIG_KEY before saving payment accounts.");
  }
  const current = await getPaymentAccounts();
  const next: StoredPaymentConfig = current.managed
    ? {
        stripe: { ...current.stripe },
        paypal: { ...current.paypal },
        affirm: { ...current.affirm },
        afterpay: { ...current.afterpay },
      }
    : emptyStored();
  if (provider === "stripe") {
    next.stripe.secretKey = "";
    next.stripe.webhookSecret = "";
    next.stripe.publishableKey = "";
  } else if (provider === "paypal") {
    next.paypal.clientId = "";
    next.paypal.clientSecret = "";
  } else if (provider === "affirm") {
    next.affirm.publicKey = "";
    next.affirm.privateKey = "";
  } else {
    next.afterpay.merchantId = "";
    next.afterpay.secret = "";
    next.afterpay.mpid = "";
    next.afterpay.placementId = "";
  }
  await writeStored(next);
}

async function writeStored(config: StoredPaymentConfig) {
  const key = encryptionKey();
  if (!key) throw new Error("Set PAYMENT_CONFIG_KEY before saving payment accounts.");
  if (!blobTokenReady()) {
    throw new Error("Set BLOB_READ_WRITE_TOKEN before saving payment accounts.");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(config), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const body = JSON.stringify({
    v: 1,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  });
  await put(BLOB_PATH, body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: BLOB_CACHE_SECONDS,
  });
  revision += 1;
  cacheExtended = true;
  memory = { config, expiresAt: Date.now() + FRESH_MS };
}

export function checkoutPublicConfig(accounts: PaymentAccounts) {
  return {
    stripePublishableKey: accounts.stripe.enabled ? accounts.stripe.publishableKey : "",
    paypalClientId: accounts.paypal.enabled ? accounts.paypal.clientId : "",
    affirmPublicKey: accounts.affirm.enabled ? accounts.affirm.publicKey : "",
    affirmEnv: accounts.affirm.mode,
    afterpayMpid: accounts.afterpay.enabled ? accounts.afterpay.mpid : "",
    afterpayPlacementId: accounts.afterpay.enabled ? accounts.afterpay.placementId : "",
  };
}
