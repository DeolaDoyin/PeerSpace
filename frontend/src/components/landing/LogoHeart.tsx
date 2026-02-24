// src/components/landing/LogoHeart.tsx
const LogoHeart = ({ className }: { className?: string }) => {
  return (
    <div
      className={`logo-heart ${className} animate-spin-slow text-primary`}
      title="Logo Heart"
    >
      ❤️
    </div>
  );
};

export default LogoHeart;