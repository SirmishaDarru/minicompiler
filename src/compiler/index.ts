// Top-level compile pipeline + listing file generation.
import { tokenize, type LexError, type Token } from "./lexer";
import { parse, type ParseError, type Program } from "./parser";
import { analyze, type SemanticError, type SymbolTable } from "./semantic";
import { generateIR, type IR } from "./ir";
import { generatePython } from "./codegen";

export type CompileError = LexError | ParseError | SemanticError;

export interface CompileResult {
  source: string;
  tokens: Token[];
  ast: Program;
  symbols: SymbolTable;
  ir: IR;
  python: string;
  listing: string;
  errors: CompileError[];
  ok: boolean;
}

export function compile(source: string): CompileResult {
  const { tokens, errors: lexErrors } = tokenize(source);
  const { ast, errors: parseErrors } = parse(tokens);
  const { errors: semErrors, symbols } = analyze(ast);

  const errors: CompileError[] = [...lexErrors, ...parseErrors, ...semErrors];

  const ir = generateIR(ast);
  const python = errors.length === 0 ? generatePython(ast) : "# Compilation failed — fix errors above first.";

  const listing = buildListing(source, errors);

  return {
    source,
    tokens,
    ast,
    symbols,
    ir,
    python,
    listing,
    errors,
    ok: errors.length === 0,
  };
}

function buildListing(source: string, errors: CompileError[]): string {
  const lines = source.split("\n");
  const byLine = new Map<number, CompileError[]>();
  for (const e of errors) {
    const arr = byLine.get(e.line) ?? [];
    arr.push(e);
    byLine.set(e.line, arr);
  }
  const width = String(lines.length).length;
  const out: string[] = [];
  lines.forEach((line, idx) => {
    const n = idx + 1;
    const num = String(n).padStart(width, " ");
    out.push(`${num} | ${line}`);
    const errs = byLine.get(n);
    if (errs) {
      for (const e of errs) {
        out.push(`${" ".repeat(width)} | ✗ [${e.phase}] ${e.message}`);
      }
    }
  });
  return out.join("\n");
}
