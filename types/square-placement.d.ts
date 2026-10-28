import type { HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "square-placement": HTMLAttributes<HTMLElement> & {
        "data-mpid"?: string;
        "data-placement-id"?: string;
        "data-page-type"?: string;
        "data-amount"?: string;
        "data-currency"?: string;
        "data-consumer-locale"?: string;
        "data-item-skus"?: string;
        "data-item-categories"?: string;
        "data-is-eligible"?: string;
      };
    }
  }
}
