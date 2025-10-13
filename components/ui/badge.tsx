import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export const Badge = ({ children, variant = "default", className }: BadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
        {
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200":
            variant === "default",
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200":
            variant === "success",
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200":
            variant === "warning",
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200":
            variant === "danger",
        },
        className
      )}
    >
      {children}
    </span>
  );
};
