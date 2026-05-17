import { Menu } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const FALLBACK_AVATAR =
  "https://cdn.iconscout.com/icon/free/png-256/free-user-icon-svg-download-png-840228.png?f=webp";

export default function Navbar({ onMenuClick, title }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background px-5">
      <button
        onClick={onMenuClick}
        className="press inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-base font-semibold text-foreground">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <img
          src={user?.avatarUrl || FALLBACK_AVATAR}
          alt={user?.name || "User"}
          onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }}
          className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
        />
      </div>
    </header>
  );
}
