import React from "react";
import { cn } from "../lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'hero' | 'panel' | 'widget';
}

export function GlassCard({ children, className, variant = 'widget', ...props }: GlassCardProps) {
  const variants = {
    hero: "bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[40px] shadow-2xl overflow-hidden",
    panel: "bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden",
    widget: "bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl overflow-hidden"
  };

  return (
    <div 
      className={cn(
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
