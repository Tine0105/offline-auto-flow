import * as React from "react";
import { cn } from "@/lib/utils";

interface ServiceCheckboxProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const ServiceCheckbox = React.forwardRef<HTMLDivElement, ServiceCheckboxProps>(
  ({ className, checked, disabled, onCheckedChange, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
          checked ? "border-primary bg-primary" : "border-input hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={() => {
          if (!disabled && onCheckedChange) {
            onCheckedChange(!checked);
          }
        }}
        {...props}
      >
        {checked && (
          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6L5 8L9 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    );
  }
);

ServiceCheckbox.displayName = "ServiceCheckbox";

export { ServiceCheckbox };