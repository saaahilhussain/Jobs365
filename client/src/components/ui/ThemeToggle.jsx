import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { resolvedTheme, toggle } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`press relative inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground ${className}`}
    >
      <Sun
        className="absolute h-4 w-4 transition-all duration-200"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? "rotate(-90deg) scale(0.85)" : "rotate(0) scale(1)",
          transitionTimingFunction: "var(--ease-out-strong)",
        }}
      />
      <Moon
        className="absolute h-4 w-4 transition-all duration-200"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? "rotate(0) scale(1)" : "rotate(90deg) scale(0.85)",
          transitionTimingFunction: "var(--ease-out-strong)",
        }}
      />
    </button>
  );
}
