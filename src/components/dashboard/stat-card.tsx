import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: number;
  trendColor?: "default" | "success" | "destructive";
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  trendColor = "default",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend !== undefined) && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {description}
            {trend !== undefined && (
              <span
                className={cn(
                  "ml-1 inline-flex items-center",
                  trendColor === "success" && "text-success",
                  trendColor === "destructive" && "text-destructive"
                )}
              >
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
