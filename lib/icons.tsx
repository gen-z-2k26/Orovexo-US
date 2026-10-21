import {
  Clock,
  Heart,
  MessageCircle,
  Package,
  RefreshCcw,
  ShieldCheck,
  Star,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { TrustIcon } from "@/lib/types";

const iconMap: Record<TrustIcon, LucideIcon> = {
  truck: Truck,
  refresh: RefreshCcw,
  shield: ShieldCheck,
  message: MessageCircle,
  package: Package,
  clock: Clock,
  star: Star,
  heart: Heart,
};

export function getTrustIcon(name: TrustIcon): LucideIcon {
  return iconMap[name] ?? Star;
}
