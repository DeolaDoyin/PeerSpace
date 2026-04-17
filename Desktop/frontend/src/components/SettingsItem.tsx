import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Checkbox } from "./ui/checkbox";

// Make sure your prop is typed correctly:


interface SettingsItemProps {
  label: string;
  onClick?: () => void;
  hasArrow?: boolean;
  hasCheckbox?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void; // this works too
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
}

const SettingsItem = ({
  label,
  onClick,
  hasArrow = true,
  hasCheckbox = false,
  checked,
  onCheckedChange,
  variant = "default",
  icon,
}: SettingsItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-4",
        "border-b border-border last:border-b-0",
        "transition-colors duration-150 hover:bg-muted/50",
        variant === "destructive" && "text-destructive"
      )}
    >
      <span className="font-medium">{label}</span>
      {hasArrow && !hasCheckbox && (
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      )}
      {hasCheckbox && (
       <Checkbox
  checked={checked}
  onCheckedChange={onCheckedChange ? (val: boolean) => onCheckedChange(val) : undefined}
  onClick={(e) => e.stopPropagation()}
/>
      )}
      {icon && icon}
    </button>
  );
};

export default SettingsItem;
