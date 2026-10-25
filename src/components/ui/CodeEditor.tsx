import { useEffect, useMemo, useRef } from "react";
import { KEYWORDS } from "@/compiler/lexer";

interface CodeEditorProps {
  value: string;
  onChange: (v: string) => void;
  errorLines?: Set<number>;
}

// Highlight a single line of NovaScript using simple span wrapping.
function highlightLine(line: string): string {
  // Escape HTML first
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let i = 0;
  let out = "";
  while (i < line.length) {
    const ch = line[i];

    // line comment
    if (ch === "/" && line[i + 1] === "/") {
      out += `<span class="text-syntax-comment italic">${esc(line.slice(i))}</span>`;
      break;
    }
    // string
    if (ch === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') j++;
      const end = j < line.length ? j + 1 : line.length;
      out += `<span class="text-syntax-string">${esc(line.slice(i, end))}</span>`;
      i = end;
      continue;
    }
    // number
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < line.length && /[0-9.]/.test(line[j])) j++;
      out += `<span class="text-syntax-number">${esc(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // identifier/keyword
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (KEYWORDS.has(word)) {
        out += `<span class="text-syntax-keyword font-semibold">${esc(word)}</span>`;
      } else {
        out += `<span class="text-syntax-identifier">${esc(word)}</span>`;
      }
      i = j;
      continue;
    }
    // operators
    if (/[=<>!+\-*/]/.test(ch)) {
      let j = i;
      while (j < line.length && /[=<>!+\-*/]/.test(line[j])) j++;
      out += `<span class="text-syntax-operator">${esc(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    out += esc(ch);
    i++;
  }
  return out || "&nbsp;";
}

export function CodeEditor({ value, onChange, errorLines }: CodeEditorProps) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  const lines = useMemo(() => value.split("\n"), [value]);

  useEffect(() => {
    // Sync scroll between textarea and highlight overlay
    const ta = taRef.current;
    if (!ta) return;
    const onScroll = () => {
      if (preRef.current) {
        preRef.current.scrollTop = ta.scrollTop;
        preRef.current.scrollLeft = ta.scrollLeft;
      }
      if (gutterRef.current) {
        gutterRef.current.scrollTop = ta.scrollTop;
      }
    };
    ta.addEventListener("scroll", onScroll);
    return () => ta.removeEventListener("scroll", onScroll);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.substring(0, start) + "  " + value.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="relative flex h-full overflow-hidden bg-editor font-mono text-sm">
      {/* Gutter */}
      <div
        ref={gutterRef}
        className="select-none overflow-hidden bg-editor-gutter px-3 py-3 text-right text-editor-line"
        style={{ minWidth: "3.5rem" }}
        aria-hidden
      >
        {lines.map((_, i) => {
          const n = i + 1;
          const hasErr = errorLines?.has(n);
          return (
            <div
              key={i}
              className={`leading-6 ${hasErr ? "font-bold text-destructive" : ""}`}
            >
              {hasErr ? "✗" : ""} {n}
            </div>
          );
        })}
      </div>

      {/* Highlight + textarea overlay */}
      <div className="relative flex-1 overflow-hidden">
        <pre
          ref={preRef}
          aria-hidden
          className="ide-scrollbar pointer-events-none absolute inset-0 m-0 overflow-auto whitespace-pre p-3 leading-6 text-syntax-identifier"
        >
          {lines.map((ln, i) => (
            <div
              key={i}
              dangerouslySetInnerHTML={{ __html: highlightLine(ln) }}
            />
          ))}
        </pre>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="ide-scrollbar absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent p-3 font-mono text-sm leading-6 text-transparent caret-primary outline-none"
          style={{ WebkitTextFillColor: "transparent" }}
        />
      </div>
    </div>
  );
}
