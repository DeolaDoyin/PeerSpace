"use client";

import { Toaster as SonnerToaster } from "sonner";

// Define the type to match Sonner's original props
type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

export const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      className="toaster group"
      // You can set "bottom-center" as a default here
      position="bottom-center" 
      // This spreads any props you pass from main.tsx (like richColors)
      {...props}
    />
  );
};