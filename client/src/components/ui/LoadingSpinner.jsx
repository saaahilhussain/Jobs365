import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ size = "default", text = "Loading..." }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-muted-foreground`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}
