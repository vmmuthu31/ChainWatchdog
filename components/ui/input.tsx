import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  const innerRef = React.useRef<HTMLInputElement | null>(null);

  React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

  React.useEffect(() => {
    if (innerRef.current) {
      innerRef.current.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      innerRef.current.style.color = "#00ffff";
    }
  }, []);

  return (
    <input
      ref={innerRef}
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex  w-full min-w-0 rounded-md border bg-transparent px-4 py-2 text-lg shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "!bg-black/80 !text-[#00ffff] border-[#00ff00]/50 focus:!text-[#00ffff] placeholder:text-[#00ffaa]/50 placeholder:text-lg",
        className
      )}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "#00ffff",
      }}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
