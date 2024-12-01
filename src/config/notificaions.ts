import { Notification } from "@/types/notifications";

export const notifications: Notification[] = [
  {
    id: "new-feature-2024",
    message:
      "✨ New! Banners are here—your new go-to pattern for important announcements",
    
    variant: "default",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
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
