import { Notification } from "@/types/notifications";

export const notifications: Notification[] = [
  {
    id: "new-feature-banners",
    message:
      "✨ New! Banners are here to announce new features and updates.",
    variant: "default",
    startDate: "2024-12-01",
    endDate: "2024-12-8",
    dismissible: true,
  },
  {
    id: "maintenance",
    message: "🛠️ Planned maintenance this weekend",
    action: {
      label: "Learn more",
      href: "/status",
    },
    variant: "warning",
    startDate: "2024-03-01",
    endDate: "2024-03-03",
    dismissible: true,
  },
];
