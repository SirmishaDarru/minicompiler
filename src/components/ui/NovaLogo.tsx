import { Sparkles } from "lucide-react";

export function NovaLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-brand shadow-glow">
        <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <div className="font-mono text-base font-bold tracking-tight text-foreground">
          Nova<span className="bg-gradient-brand bg-clip-text text-transparent">Script</span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Compiler · v0.1
        </div>
      </div>
    </div>
  );
}
