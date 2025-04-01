import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  variant?: "default" | "success" | "destructive" | "warning";
}

export function ProgressBar({
  value,
  max,
  label,
  className,
  size = "md",
  showPercentage = true,
  variant = "default",
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        {showPercentage && <span>{percentage}%</span>}
      </div>
      <Progress
        value={percentage}
        className={cn(
          size === "sm" && "h-1",
          size === "md" && "h-2",
          size === "lg" && "h-3",
          variant === "success" && "bg-success/20 [&>div]:bg-success",
          variant === "destructive" && "bg-destructive/20 [&>div]:bg-destructive",
          variant === "warning" && "bg-warning/20 [&>div]:bg-warning"
        )}
      />
    </div>
  );
}
