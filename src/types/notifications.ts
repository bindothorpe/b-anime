export interface Notification {
  id: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
  variant?: "default" | "success" | "warning" | "destructive";
  startDate?: string; // Optional: When to start showing the notification
  endDate?: string; // Optional: When to stop showing the notification
  dismissible?: boolean;
}
