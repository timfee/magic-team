import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-xl",
};

/**
 * Optimized Avatar component with Next.js Image optimization
 * Includes fallback initials for users without profile images
 */
export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const initials = alt
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white",
          sizeClasses[size],
          className,
        )}
        aria-label={alt}>
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full",
        sizeClasses[size],
        className,
      )}
      aria-label={alt}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={
          size === "xs" ? "24px"
          : size === "sm" ?
            "32px"
          : size === "md" ?
            "40px"
          : size === "lg" ?
            "48px"
          : "64px"
        }
        className="object-cover"
      />
    </div>
  );
}
