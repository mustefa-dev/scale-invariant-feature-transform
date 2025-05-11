
import * as React from "react";
import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  value: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, className }) => {
  return (
    <div className={`w-full ${className}`}>
      <Progress value={value} className="h-2 w-full" />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{value}%</span>
        <span>{value === 100 ? "Complete" : "Processing..."}</span>
      </div>
    </div>
  );
};

export default ProgressBar;
