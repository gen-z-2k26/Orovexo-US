import { wooGet } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import type { StoreSettings } from "@/lib/types";

type WooCoupon = {
  id?: number;
  code?: string;
  amount?: string;
  discount_type?: string;
  description?: string;
  date_expires?: string | null;
  date_expires_gmt?: string | null;
  usage_limit?: number | null;
  usage_count?: number;
  free_shipping?: boolean;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function isExpired(coupon: WooCoupon) {
  const raw = coupon.date_expires_gmt || coupon.date_expires;
  if (!raw) return false;
  const expires = Date.parse(raw);
  return Number.isFinite(expires) && expires <= Date.now();
}

function isUsable(coupon: WooCoupon) {
  if (!coupon.code) return false;
  if (isExpired(coupon)) return false;
  const limit = coupon.usage_limit;
  if (typeof limit === "number" && limit > 0) {
    return (coupon.usage_count || 0) < limit;
  }
  return true;
}

function couponMessage(coupon: WooCoupon, settings: StoreSettings) {
  const fromAdmin = stripHtml(coupon.description || "");
  if (fromAdmin) return fromAdmin;

  const code = (coupon.code || "").toUpperCase();
  const amount = Number(coupon.amount) || 0;
  const type = coupon.discount_type || "";
  const parts: string[] = [];

  if (type === "percent" && amount > 0) {
    parts.push(`${amount}% off`);
  } else if ((type === "fixed_cart" || type === "fixed_product") && amount > 0) {
    parts.push(`${formatPrice(amount, settings)} off`);
  }

  if (coupon.free_shipping) {
    parts.push(parts.length ? "free shipping" : "Free shipping");
  }

  if (!parts.length) return "";
  const offer = parts.join(" plus ");
  return code ? `${offer} with code ${code}` : offer;
}

function couponScore(coupon: WooCoupon) {
  let score = 0;
  if (coupon.free_shipping) score += 3;
  if (coupon.discount_type === "percent") score += 2;
  if (coupon.discount_type === "fixed_cart") score += 1;
  score += Number(coupon.amount) || 0;
  return score;
}

export async function getLivePromo(settings: StoreSettings): Promise<{
  promoBanner: string;
  promoCoupon: string;
  promoId: string;
}> {
  const empty = { promoBanner: "", promoCoupon: "", promoId: "" };

  const [coupons, saleProducts] = await Promise.all([
    wooGet<WooCoupon[]>("coupons", {
      per_page: 20,
      orderby: "date",
      order: "desc",
    }),
    wooGet<Array<{ id?: number }>>("products", {
      on_sale: true,
      status: "publish",
      per_page: 1,
      _fields: "id",
    }),
  ]);

  const live = (coupons ?? [])
    .filter(isUsable)
    .map((coupon) => ({
      coupon,
      message: couponMessage(coupon, settings),
    }))
    .filter((entry) => entry.message)
    .sort((a, b) => couponScore(b.coupon) - couponScore(a.coupon));

  const top = live[0];
  if (top) {
    return {
      promoBanner: top.message,
      promoCoupon: top.coupon.code || "",
      promoId: `coupon-${top.coupon.id || top.coupon.code}`,
    };
  }

  if (saleProducts?.length) {
    return {
      promoBanner: "Flash sale on now. Shop sale items in the catalog.",
      promoCoupon: "",
      promoId: "flash-sale",
    };
  }

  return empty;
}
