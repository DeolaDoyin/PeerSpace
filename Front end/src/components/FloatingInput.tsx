import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, X } from "lucide-react";

interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, type = "text", className, value, onChange, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const hasValue = value !== undefined && value !== "";
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="relative">
        <div
          className={cn(
            "relative border-2 rounded-lg transition-colors duration-200",
            focused ? "border-primary" : "border-border",
            error && "border-destructive"
          )}
        >
          <input
            ref={ref}
            type={inputType}
            value={value}
            onChange={onChange}
            className={cn(
              "w-full px-4 pt-5 pb-2 bg-transparent outline-none text-foreground",
              "placeholder-transparent peer",
              className
            )}
            placeholder={label}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          <label
            className={cn(
              "absolute left-4 transition-all duration-200 pointer-events-none",
              "text-muted-foreground bg-card px-1",
              focused || hasValue
                ? "text-xs -top-2.5"
                : "text-base top-1/2 -translate-y-1/2",
              focused && "text-primary",
              error && "text-destructive"
            )}
          >
            {label}
          </label>
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {hasValue && !isPassword && (
              <button
                type="button"
                onClick={() => {
                  const event = {
                    target: { value: "" },
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange?.(event);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="text-xs text-destructive mt-1 px-1">{error}</p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";

export default FloatingInput;