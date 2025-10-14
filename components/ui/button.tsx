import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = ({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        {
          // Variants
          "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200":
            variant === "default",
          "bg-blue-600 text-white hover:bg-blue-700": variant === "primary",
          "bg-red-600 text-white hover:bg-red-700": variant === "danger",
          "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800":
            variant === "ghost",
          // Sizes
          "h-8 px-3 text-sm": size === "sm",
          "h-10 px-4 text-sm": size === "md",
          "h-12 px-6 text-base": size === "lg",
        },
        className,
      )}
      {...props}
    />
  );
};
