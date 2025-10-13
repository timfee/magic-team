import { cn } from "@/lib/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }: CardProps) => {
  return <div className={cn("p-6 pb-4", className)}>{children}</div>;
};

export const CardTitle = ({ children, className }: CardProps) => {
  return (
    <h3 className={cn("text-lg font-semibold text-zinc-900 dark:text-zinc-50", className)}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className }: CardProps) => {
  return (
    <p className={cn("mt-1 text-sm text-zinc-600 dark:text-zinc-400", className)}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className }: CardProps) => {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
};
