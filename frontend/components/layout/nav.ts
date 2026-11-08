import { BarChart3, Clock, Home, Map, Mic, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Маршруты, при которых пункт подсвечен */
  match: string[];
};

export const navItems: NavItem[] = [
  { href: "/onboarding", label: "Главная", icon: Home, match: ["/onboarding"] },
  { href: "/interview/setup", label: "Интервью", icon: Mic, match: ["/interview"] },
  { href: "/plan", label: "План подготовки", icon: Map, match: ["/plan"] },
  { href: "/results", label: "Результаты", icon: BarChart3, match: ["/results"] },
  { href: "/history", label: "История", icon: Clock, match: ["/history"] },
];

export function isActive(item: NavItem, pathname: string) {
  return item.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
}
