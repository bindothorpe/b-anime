import React from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { Notification } from "@/types/notifications";

// Hook to manage dismissed notifications
const useDismissedNotifications = () => {
  const [dismissed, setDismissed] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Load dismissed notifications from localStorage on mount
    const stored = localStorage.getItem("dismissed-notifications");
    if (stored) {
      setDismissed(JSON.parse(stored));
    }
  }, []);

  const dismissNotification = (id: string) => {
    setDismissed((prev) => {
      const updated = [...prev, id];
      localStorage.setItem("dismissed-notifications", JSON.stringify(updated));
      return updated;
    });
  };

  return { dismissed, dismissNotification };
};

const NotificationBanner = ({
  notifications,
}: {
  notifications: Notification[];
}) => {
  const { dismissed, dismissNotification } = useDismissedNotifications();
  const [loading, setLoading] = React.useState(true);
  const [activeNotifications, setActiveNotifications] = React.useState<
    Notification[]
  >([]);

  React.useEffect(() => {
    const filterNotifications = () => {
      const activeNotifications = notifications.filter((notification) => {
        if (dismissed.includes(notification.id)) return false;

        const now = new Date();
        const start = notification.startDate
          ? new Date(notification.startDate)
          : new Date(0);
        const end = notification.endDate
          ? new Date(notification.endDate)
          : new Date("2099-12-31");

        return now >= start && now <= end;
      });

      setActiveNotifications(activeNotifications);
      setLoading(false);
    };

    filterNotifications();
  }, [notifications, dismissed]);

  if (loading || activeNotifications.length === 0) return null;

  const variants = {
    default: {
      container: "bg-background border-b border-foreground/10",
      button: "bg-foreground text-background hover:bg-foreground/90",
    },
    success: {
      container: "bg-emerald-500 text-white border-b border-white/10",
      button: "bg-white text-emerald-500 hover:bg-white/90",
    },
    warning: {
      container: "bg-amber-500 text-white border-b border-white/10",
      button: "bg-white text-amber-500 hover:bg-white/90",
    },
    destructive: {
      container:
        "bg-destructive text-destructive-foreground border-b border-destructive-foreground/10",
      button:
        "bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90",
    },
  };

  return (
    <div className="w-full">
      {activeNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`w-full ${
            variants[notification.variant || "default"].container
          }`}
        >
          {/* mobile */}
          <Link
            className="flex lg:hidden items-center justify-between px-4 py-3 max-w-screen-2xl mx-auto"
            href={notification.action ? notification.action.href : ""}
          >
            <div className="flex items-center gap-2">
              <span>{notification.message}</span>
            </div>
            <div className="flex items-center gap-2">
              {notification.dismissible && (
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="p-1 rounded-full hover:bg-white/10"
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </Link>

          {/* desktop */}
          <div className="lg:flex hidden items-center justify-between px-4 py-3 max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-2">
              <span>{notification.message}</span>
            </div>
            <div className="flex items-center gap-2">
              {notification.action && (
                <Link
                  href={notification.action.href}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    variants[notification.variant || "default"].button
                  }`}
                >
                  {notification.action.label}
                </Link>
              )}
              {notification.dismissible && (
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="p-1 rounded-full hover:bg-white/10"
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationBanner;
