// src/components/NavLink.tsx
import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
}

export const NavLink = ({ to, children }: NavLinkProps) => {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "text-base font-medium",
          isActive ? "text-[#8975c6]" : "text-gray-600",
          "hover:text-[#8975c6]"
        )
      }
    >
      {children}
    </RouterNavLink>
  );
};
