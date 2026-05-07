import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

interface AnonAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isClickable?: boolean;
  onClick?: () => void;
  profilePictureUrl?: string | null;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-32 w-32",
};

const iconScale = {
  sm: 0.4,
  md: 0.5,
  lg: 0.6,
  xl: 0.7,
};

const AnonAvatar = ({
  size = "md",
  className,
  isClickable = false,
  onClick,
  profilePictureUrl,
}: AnonAvatarProps) => {
  const scale = iconScale[size];

  return (
    <div
      className={cn(
        "rounded-full bg-avatar flex items-center justify-center flex-shrink-0 relative",
        sizeClasses[size],
        isClickable && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          onClick?.();
        }
      }}
    >
      {profilePictureUrl ? (
        <img
          src={profilePictureUrl}
          alt="Profile"
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <svg
          viewBox="0 0 48 48"
          className="text-muted-foreground"
          style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}
        >
          {/* Triangle */}
          <path
            d="M24 8L32 20H16L24 8Z"
            fill="currentColor"
            opacity="0.7"
          />
          {/* Star burst */}
          <path
            d="M14 28L16 24L18 28L14 26L18 26L14 28Z"
            fill="currentColor"
            opacity="0.6"
          />
          {/* Rounded square */}
          <rect
            x="26"
            y="24"
            width="10"
            height="10"
            rx="2"
            fill="currentColor"
            opacity="0.5"
          />
          {/* Heart/shield shape */}
          <path
            d="M24 42C24 42 16 36 16 30C16 26 20 26 24 30C28 26 32 26 32 30C32 36 24 42 24 42Z"
            fill="currentColor"
            opacity="0.6"
          />
        </svg>
      )}

      {/* Edit Icon Overlay (only show when clickable) */}
      {isClickable && (
        <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Pencil className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
};

export default AnonAvatar;
