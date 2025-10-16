import { cn } from "@/lib/utils/cn";
import type { LabelHTMLAttributes } from "react";
import { forwardRef } from "react";

const Label = forwardRef<
  HTMLLabelElement,
  LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium text-zinc-900 dark:text-zinc-50",
        className,
      )}
      {...props}
    />
  );
});
Label.displayName = "Label";

export { Label };
