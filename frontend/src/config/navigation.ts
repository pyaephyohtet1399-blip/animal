import {
  ChartColumn,
  ClipboardList,
  House,
  LayoutDashboard,
  Table2,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  labelMm: string;
  href: string;
  icon: LucideIcon;
  /**
   * Feature modules are registered here first and enabled in the phase that
   * builds them, so navigation order never changes between phases.
   */
  enabled: boolean;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Home",
        labelMm: "ပင်မ",
        href: "/",
        icon: House,
        enabled: true,
      },
      {
        label: "Dashboard",
        labelMm: "ဒက်ဘုတ်",
        href: "/dashboard",
        icon: LayoutDashboard,
        enabled: true,
      },
    ],
  },
  {
    title: "Census",
    items: [
      {
        label: "Data Explorer",
        labelMm: "ဒေတာရှာဖွေးရန်",
        href: "/explorer",
        icon: Table2,
        enabled: true,
      },
      {
        label: "Census Records",
        labelMm: "သနန်းစာရင်းများ",
        href: "/census",
        icon: ClipboardList,
        enabled: true,
      },
    ],
  },
  {
    title: "Analysis",
    items: [
      {
        label: "စစ်တမ်းကောက်ယူမှုအကျဉ်းချုပ်",
        labelMm: "စာရင်းများ",
        href: "/reports",
        icon: ChartColumn,
        enabled: true,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Users",
        labelMm: "အသုံးပြုသူများ",
        href: "/users",
        icon: Users,
        enabled: false,
      },
    ],
  },
];