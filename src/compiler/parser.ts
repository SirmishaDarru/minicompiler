// NovaScript Parser — recursive descent
import type { Token } from "./lexer";

export interface ParseError {
  message: string;
  line: number;
  col: number;
  phase: "parser";
}

export type Expression =
  | { kind: "Identifier"; name: string; line: number }
  | { kind: "String"; value: string; line: number }
  | { kind: "Number"; value: number; line: number }
  | {
      kind: "Call";
      func: string;
      args: Expression[];
      line: number;
    }
  | {
      kind: "Binary";
      op: string;
      left: Expression;
      right: Expression;
      line: number;
    };

export type Statement =
  | {
      kind: "Load";
      target: string;
      source: string;
      line: number;
    }
  | {
      kind: "Filter";
      target: string;
      column: string;
      op: string;
      value: Expression;
      line: number;
    }
  | {
      kind: "Map";
      target: string;
      column: string;
      expr: Expression;
      line: number;
    }
  | {
      kind: "Output";
      target: string;
      destination: string;
      line: number;
    };

export interface Program {
  kind: "Program";
  body: Statement[];
}

export function parse(tokens: Token[]): {
  ast: Program;
  errors: ParseError[];
} {
  const errors: ParseError[] = [];
  let pos = 0;

  const peek = (off = 0) => tokens[pos + off];
  const advance = () => tokens[pos++];

  const error = (msg: string, tok: Token) => {
    errors.push({ message: msg, line: tok.line, col: tok.col, phase: "parser" });
  };

  const expect = (type: Token["type"], value?: string): Token | null => {
    const t = peek();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      error(
        `Expected ${value ? `"${value}"` : type}, got "${t.value}" (${t.type})`,
        t,
      );
      return null;
    }
    return advance();
  };

  // Synchronize to next statement on error: skip to next KEYWORD that begins a statement
  const synchronize = () => {
    while (peek().type !== "EOF") {
      const t = peek();
      if (
        t.type === "KEYWORD" &&
        (t.value === "load" ||
          t.value === "filter" ||
          t.value === "map" ||
          t.value === "output")
      ) {
        return;
      }
      advance();
    }
  };

  const parsePrimary = (): Expression | null => {
    const t = peek();
    if (t.type === "STRING_LITERAL") {
      advance();
      return { kind: "String", value: t.value, line: t.line };
    }
    if (t.type === "NUMBER") {
      advance();
      return { kind: "Number", value: parseFloat(t.value), line: t.line };
    }
    if (t.type === "IDENTIFIER") {
      advance();
      // function call?
      if (peek().type === "DELIMITER" && peek().value === "(") {
        advance();
        const args: Expression[] = [];
        if (!(peek().type === "DELIMITER" && peek().value === ")")) {
          while (true) {
            const a = parseExpression();
            if (a) args.push(a);
            if (peek().type === "DELIMITER" && peek().value === ",") {
              advance();
              continue;
            }
            break;
          }
        }
        const close = expect("DELIMITER", ")");
        if (!close) return null;
        return { kind: "Call", func: t.value, args, line: t.line };
      }
      return { kind: "Identifier", name: t.value, line: t.line };
    }
    error(`Unexpected token "${t.value}" in expression`, t);
    return null;
  };

  const parseExpression = (): Expression | null => {
    const left = parsePrimary();
    if (!left) return null;
    // simple binary: + - * /
    const t = peek();
    if (
      t.type === "OPERATOR" &&
      (t.value === "+" ||
        t.value === "-" ||
        t.value === "*" ||
        t.value === "/")
    ) {
      advance();
      const right = parsePrimary();
      if (!right) return null;
      return {
        kind: "Binary",
        op: t.value,
        left,
        right,
        line: left.line,
      };
    }
    return left;
  };

  const parseLoad = (): Statement | null => {
    const kw = advance(); // load
    const id = expect("IDENTIFIER");
    if (!id) return null;
    if (!expect("KEYWORD", "from")) return null;
    const src = expect("STRING_LITERAL");
    if (!src) return null;
    return {
      kind: "Load",
      target: id.value,
      source: src.value,
      line: kw.line,
    };
  };

  const parseFilter = (): Statement | null => {
    const kw = advance(); // filter
    const id = expect("IDENTIFIER");
    if (!id) return null;
    if (!expect("KEYWORD", "where")) return null;
    const col = expect("IDENTIFIER");
    if (!col) return null;
    const opTok = peek();
    if (opTok.type !== "OPERATOR") {
      error(`Expected operator after "${col.value}", got "${opTok.value}"`, opTok);
      return null;
    }
    advance();
    const valTok = peek();
    let value: Expression;
    if (valTok.type === "STRING_LITERAL") {
      advance();
      value = { kind: "String", value: valTok.value, line: valTok.line };
    } else if (valTok.type === "NUMBER") {
      advance();
      value = { kind: "Number", value: parseFloat(valTok.value), line: valTok.line };
    } else {
      error(`Expected string or number after operator, got "${valTok.value}"`, valTok);
      return null;
    }
    return {
      kind: "Filter",
      target: id.value,
      column: col.value,
      op: opTok.value,
      value,
      line: kw.line,
    };
  };

  const parseMap = (): Statement | null => {
    const kw = advance(); // map
    const id = expect("IDENTIFIER");
    if (!id) return null;
    if (!expect("KEYWORD", "to")) return null;
    const col = expect("IDENTIFIER");
    if (!col) return null;
    const eq = peek();
    if (eq.type !== "OPERATOR" || eq.value !== "=") {
      error(`Expected "=" after "${col.value}", got "${eq.value}"`, eq);
      return null;
    }
    advance();
    const expr = parseExpression();
    if (!expr) return null;
    return {
      kind: "Map",
      target: id.value,
      column: col.value,
      expr,
      line: kw.line,
    };
  };

  const parseOutput = (): Statement | null => {
    const kw = advance(); // output
    const id = expect("IDENTIFIER");
    if (!id) return null;
    if (!expect("KEYWORD", "to")) return null;
    const dest = expect("STRING_LITERAL");
    if (!dest) return null;
    return {
      kind: "Output",
      target: id.value,
      destination: dest.value,
      line: kw.line,
    };
  };

  const parseStatement = (): Statement | null => {
    const t = peek();
    if (t.type !== "KEYWORD") {
      error(`Expected statement keyword, got "${t.value}"`, t);
      return null;
    }
    switch (t.value) {
      case "load":
        return parseLoad();
      case "filter":
        return parseFilter();
      case "map":
        return parseMap();
      case "output":
        return parseOutput();
      default:
        error(`Unknown statement "${t.value}"`, t);
        return null;
    }
  };

  const body: Statement[] = [];
  while (peek().type !== "EOF") {
    const stmt = parseStatement();
    if (stmt) {
      body.push(stmt);
    } else {
      synchronize();
    }
  }

  return { ast: { kind: "Program", body }, errors };
}
