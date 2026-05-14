import { Menu } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Navbar({ onMenuClick, title }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background px-5">
      <button
        onClick={onMenuClick}
        className="press inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-base font-semibold text-foreground">{title}</h1>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
