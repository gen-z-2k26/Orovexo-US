"use client";

import { createElement, useEffect, useId } from "react";
import Script from "next/script";
import {
  amountToCents,
  amountToDecimalString,
  affirmCountryCode,
  affirmLocale,
  canLoadAffirmWidget,
  canLoadAfterpayWidget,
  shouldShowAffirm,
  shouldShowAfterpay,
  toAfterpayLocale,
} from "@/lib/bnpl";
import { formatPrice } from "@/lib/format";
import type { BnplPublicConfig, Product, StoreSettings } from "@/lib/types";

type AffirmUi = {
  ready?: (cb: () => void) => void;
  refresh?: () => void;
};

declare global {
  interface Window {
    affirm?: { ui?: AffirmUi };
    _affirm_config?: {
      public_api_key: string;
      script: string;
      locale: string;
      country_code: string;
    };
  }
}

function refreshAffirm(amountCents: number, elementId: string) {
  const node = document.getElementById(elementId);
  if (node) {
    node.setAttribute("data-amount", String(amountCents));
  }
  const refresh = () => window.affirm?.ui?.refresh?.();
  if (window.affirm?.ui?.ready) {
    window.affirm.ui.ready(refresh);
  } else {
    refresh();
  }
}

export function BnplMessaging({
  product,
  settings,
  config,
  affirmEnabled,
  afterpayEnabled,
}: {
  product: Product;
  settings: StoreSettings;
  config: BnplPublicConfig;
  affirmEnabled: boolean;
  afterpayEnabled: boolean;
}) {
  const affirmId = useId().replace(/:/g, "");
  const showAffirm = shouldShowAffirm(settings, config, affirmEnabled);
  const showAfterpay = shouldShowAfterpay(settings, config, afterpayEnabled);
  const loadAffirm = showAffirm && canLoadAffirmWidget(config);
  const loadAfterpay = showAfterpay && canLoadAfterpayWidget(config);
  const cents = amountToCents(product.price, settings.priceDecimals);
  const decimal = amountToDecimalString(product.price, settings.priceDecimals);
  const currency = (settings.currency || "USD").toUpperCase();
  const installment = product.price / 4;
  const affirmScript =
    config.affirmEnv === "live"
      ? "https://cdn1.affirm.com/js/v2/affirm.js"
      : "https://cdn1-sandbox.affirm.com/js/v2/affirm.js";

  useEffect(() => {
    if (!loadAffirm) return;
    window._affirm_config = {
      public_api_key: config.affirmPublicKey,
      script: affirmScript,
      locale: affirmLocale(currency),
      country_code: affirmCountryCode(currency),
    };
    refreshAffirm(cents, `ppx-affirm-${affirmId}`);
  }, [
    loadAffirm,
    config.affirmPublicKey,
    affirmScript,
    currency,
    cents,
    affirmId,
  ]);

  useEffect(() => {
    if (!loadAfterpay) return;
    const el = document.getElementById(`ppx-afterpay-${affirmId}`);
    if (el) el.setAttribute("data-amount", decimal);
  }, [loadAfterpay, decimal, affirmId]);

  if (!showAffirm && !showAfterpay) return null;

  return (
    <div className="ppx-bnpl space-y-1 text-sm text-muted-foreground">
      {showAffirm ? (
        loadAffirm ? (
          <>
            <Script
              id="ppx-affirm-config"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
              window._affirm_config = window._affirm_config || {
                public_api_key: ${JSON.stringify(config.affirmPublicKey)},
                script: ${JSON.stringify(affirmScript)},
                locale: ${JSON.stringify(affirmLocale(currency))},
                country_code: ${JSON.stringify(affirmCountryCode(currency))}
              };
              (function(m,g,n,d,a,e,h,c){var b=m[n]||{},k=document.createElement(e),p=document.getElementsByTagName(e)[0],l=function(a,b,c){return function(){a[b]._.push([c,arguments])}};b[d]=l(b,d,"set");var f=b[d];b[a]={};b[a]._=[];f._=[];b._=[];b[a][h]=l(b,a,h);b[c]=function(){b._.push([h,arguments])};a=0;for(c="set add save post open empty reset on off trigger ready setProduct".split(" ");a<c.length;a++)f[c[a]]=l(b,d,c[a]);a=0;for(c=["get","token","url","items"];a<c.length;a++)f[c[a]]=function(){};k.async=true;k.src=g[e];p.parentNode.insertBefore(k,p);delete g[e];f(g);m[n]=b})(window,window._affirm_config,"affirm","checkout","ui","script","ready","jsReady");
            `,
              }}
            />
            <p
              id={`ppx-affirm-${affirmId}`}
              className="affirm-as-low-as"
              data-page-type="product"
              data-amount={cents}
            />
          </>
        ) : (
          <p>
            Pay over time with Affirm on eligible orders.
          </p>
        )
      ) : null}

      {showAfterpay ? (
        loadAfterpay ? (
          <>
            <Script
              id="ppx-afterpay-js"
              src="https://js.afterpay.com/afterpay-1.x.js"
              strategy="afterInteractive"
            />
            {createElement("square-placement", {
              id: `ppx-afterpay-${affirmId}`,
              "data-mpid": config.afterpayMpid,
              "data-placement-id": config.afterpayPlacementId,
              "data-page-type": "product",
              "data-amount": decimal,
              "data-currency": currency,
              "data-consumer-locale": toAfterpayLocale(settings.locale),
              "data-item-skus": product.id,
              "data-item-categories": product.category,
              "data-is-eligible": "true",
            })}
          </>
        ) : (
          <p>
            Or 4 interest-free payments of{" "}
            {formatPrice(installment, settings)} with Afterpay.
          </p>
        )
      ) : null}
    </div>
  );
}
