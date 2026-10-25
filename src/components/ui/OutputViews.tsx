import type { CompileResult } from "@/compiler";
import type { Token } from "@/compiler/lexer";

export function TokensView({ tokens }: { tokens: Token[] }) {
  return (
    <div className="ide-scrollbar h-full overflow-auto p-4 font-mono text-xs">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-card text-muted-foreground">
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium">#</th>
            <th className="px-3 py-2 text-left font-medium">Line</th>
            <th className="px-3 py-2 text-left font-medium">Type</th>
            <th className="px-3 py-2 text-left font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-muted/40">
              <td className="px-3 py-1.5 text-muted-foreground">{i}</td>
              <td className="px-3 py-1.5 text-muted-foreground">{t.line}</td>
              <td className="px-3 py-1.5">
                <span className={tokenColor(t.type)}>{t.type}</span>
              </td>
              <td className="px-3 py-1.5 text-foreground">
                <code className="rounded bg-muted/50 px-1.5 py-0.5">{t.value}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function tokenColor(type: Token["type"]): string {
  switch (type) {
    case "KEYWORD":
      return "text-syntax-keyword font-semibold";
    case "STRING_LITERAL":
      return "text-syntax-string";
    case "NUMBER":
      return "text-syntax-number";
    case "OPERATOR":
      return "text-syntax-operator";
    case "IDENTIFIER":
      return "text-syntax-identifier";
    case "DELIMITER":
      return "text-muted-foreground";
    case "EOF":
      return "text-muted-foreground italic";
    case "ERROR":
      return "text-destructive font-semibold";
  }
}

export function AstView({ result }: { result: CompileResult }) {
  return (
    <pre className="ide-scrollbar h-full overflow-auto bg-editor p-4 font-mono text-xs leading-relaxed text-foreground">
      {JSON.stringify(result.ast, null, 2)}
    </pre>
  );
}

export function IRView({ result }: { result: CompileResult }) {
  if (result.ir.instructions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No IR instructions emitted.
      </div>
    );
  }
  return (
    <div className="ide-scrollbar h-full overflow-auto bg-editor p-4 font-mono text-xs">
      {result.ir.instructions.map((ins, i) => (
        <div key={i} className="flex gap-4 py-1">
          <span className="w-10 text-right text-muted-foreground">{i + 1}</span>
          <span className="w-12 text-syntax-keyword">{ins.op}</span>
          <span className="text-foreground">{ins.text}</span>
          <span className="ml-auto text-muted-foreground">line {ins.line}</span>
        </div>
      ))}
    </div>
  );
}

export function PythonView({ python }: { python: string }) {
  return (
    <pre className="ide-scrollbar h-full overflow-auto bg-editor p-4 font-mono text-xs leading-relaxed text-foreground">
      {python}
    </pre>
  );
}

export function ListingView({ listing }: { listing: string }) {
  return (
    <pre className="ide-scrollbar h-full overflow-auto bg-editor p-4 font-mono text-xs leading-relaxed">
      {listing.split("\n").map((line, i) => {
        const isErr = line.includes("✗ [");
        return (
          <div
            key={i}
            className={isErr ? "text-destructive" : "text-foreground"}
          >
            {line || "\u00A0"}
          </div>
        );
      })}
    </pre>
  );
}

export function ErrorsView({ result }: { result: CompileResult }) {
  if (result.errors.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-4xl text-success">✓</div>
          <div className="font-mono text-sm text-success">
            Compiled successfully — 0 errors
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {result.tokens.length - 1} tokens · {result.ast.body.length} statements ·{" "}
            {result.ir.instructions.length} IR ops
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="ide-scrollbar h-full overflow-auto p-4 font-mono text-xs">
      <div className="mb-3 text-muted-foreground">
        {result.errors.length} error{result.errors.length === 1 ? "" : "s"} found
      </div>
      <ul className="space-y-2">
        {result.errors.map((e, i) => (
          <li
            key={i}
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-destructive/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-destructive-foreground">
                {e.phase}
              </span>
              <span className="text-muted-foreground">
                line {e.line}, col {e.col}
              </span>
            </div>
            <div className="mt-1 text-destructive">{e.message}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
