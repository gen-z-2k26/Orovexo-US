const SANDBOX = "https://api-m.sandbox.paypal.com";
const LIVE = "https://api-m.paypal.com";

function paypalBase() {
  return process.env.PAYPAL_ENV?.trim().toLowerCase() === "live" ? LIVE : SANDBOX;
}

export function isPayPalConfigured() {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID?.trim() &&
      process.env.PAYPAL_CLIENT_SECRET?.trim(),
  );
}

export function payPalClientId() {
  return (
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() ||
    process.env.PAYPAL_CLIENT_ID?.trim() ||
    ""
  );
}

async function paypalToken() {
  const id = process.env.PAYPAL_CLIENT_ID?.trim() || "";
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim() || "";
  if (!id || !secret) {
    throw new Error(
      "PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.",
    );
  }
  const response = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || "Could not start PayPal.");
  }
  return data.access_token;
}

export async function createPayPalOrder(input: {
  orderId: string;
  amount: number;
  currency: string;
}) {
  const token = await paypalToken();
  const response = await fetch(`${paypalBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.orderId,
          custom_id: input.orderId,
          amount: {
            currency_code: input.currency.trim().toUpperCase(),
            value: input.amount.toFixed(2),
          },
        },
      ],
    }),
  });
  const data = (await response.json()) as { id?: string; message?: string };
  if (!response.ok || !data.id) {
    throw new Error(data.message || "Could not start PayPal.");
  }
  return data.id;
}

export async function capturePayPalOrder(paypalOrderId: string) {
  const token = await paypalToken();
  const response = await fetch(
    `${paypalBase()}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  const data = (await response.json()) as {
    status?: string;
    message?: string;
    purchase_units?: Array<{
      custom_id?: string;
      reference_id?: string;
      payments?: {
        captures?: Array<{
          id?: string;
          status?: string;
          amount?: { value?: string; currency_code?: string };
        }>;
      };
    }>;
  };
  if (!response.ok) {
    throw new Error(data.message || "PayPal capture failed.");
  }
  const unit = data.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  if (data.status !== "COMPLETED" || capture?.status !== "COMPLETED" || !capture.id) {
    throw new Error("PayPal payment was not completed.");
  }
  return {
    captureId: capture.id,
    orderId: unit?.custom_id || unit?.reference_id || "",
    amount: Number(capture.amount?.value || 0),
    currency: capture.amount?.currency_code || "",
  };
}
