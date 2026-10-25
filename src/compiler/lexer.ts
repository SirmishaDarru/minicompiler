// NovaScript Lexer
// Tokenizes source character-by-character.

export type TokenType =
  | "KEYWORD"
  | "IDENTIFIER"
  | "STRING_LITERAL"
  | "NUMBER"
  | "OPERATOR"
  | "DELIMITER"
  | "EOF"
  | "ERROR";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

export interface LexError {
  message: string;
  line: number;
  col: number;
  phase: "lexer";
}

export const KEYWORDS = new Set([
  "load",
  "from",
  "filter",
  "where",
  "map",
  "to",
  "output",
]);

const OPERATOR_CHARS = new Set(["=", "<", ">", "!", "+", "-", "*", "/"]);
const TWO_CHAR_OPS = new Set(["==", "!=", "<=", ">="]);

export function tokenize(src: string): { tokens: Token[]; errors: LexError[] } {
  const tokens: Token[] = [];
  const errors: LexError[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  const peek = (offset = 0) => src[i + offset];
  const advance = () => {
    const ch = src[i++];
    if (ch === "\n") {
      line++;
      col = 1;
    } else {
      col++;
    }
    return ch;
  };

  while (i < src.length) {
    const ch = peek();

    // Skip whitespace
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      advance();
      continue;
    }

    // Comments: // until end of line
    if (ch === "/" && peek(1) === "/") {
      while (i < src.length && peek() !== "\n") advance();
      continue;
    }

    const startLine = line;
    const startCol = col;

    // String literal
    if (ch === '"') {
      advance(); // consume opening quote
      let value = "";
      let closed = false;
      while (i < src.length) {
        const c = peek();
        if (c === '"') {
          advance();
          closed = true;
          break;
        }
        if (c === "\n") break;
        value += advance();
      }
      if (!closed) {
        errors.push({
          message: `Unterminated string literal`,
          line: startLine,
          col: startCol,
          phase: "lexer",
        });
        tokens.push({
          type: "ERROR",
          value: `"${value}`,
          line: startLine,
          col: startCol,
        });
      } else {
        tokens.push({
          type: "STRING_LITERAL",
          value,
          line: startLine,
          col: startCol,
        });
      }
      continue;
    }

    // Number
    if (/[0-9]/.test(ch)) {
      let value = "";
      while (i < src.length && /[0-9.]/.test(peek())) {
        value += advance();
      }
      const dots = (value.match(/\./g) || []).length;
      if (dots > 1) {
        errors.push({
          message: `Invalid number literal "${value}"`,
          line: startLine,
          col: startCol,
          phase: "lexer",
        });
        tokens.push({ type: "ERROR", value, line: startLine, col: startCol });
      } else {
        tokens.push({ type: "NUMBER", value, line: startLine, col: startCol });
      }
      continue;
    }

    // Identifier / keyword
    if (/[A-Za-z_]/.test(ch)) {
      let value = "";
      while (i < src.length && /[A-Za-z0-9_]/.test(peek())) {
        value += advance();
      }
      const type: TokenType = KEYWORDS.has(value) ? "KEYWORD" : "IDENTIFIER";
      tokens.push({ type, value, line: startLine, col: startCol });
      continue;
    }

    // Operators
    if (OPERATOR_CHARS.has(ch)) {
      const two = ch + (peek(1) ?? "");
      if (TWO_CHAR_OPS.has(two)) {
        advance();
        advance();
        tokens.push({
          type: "OPERATOR",
          value: two,
          line: startLine,
          col: startCol,
        });
      } else {
        advance();
        tokens.push({
          type: "OPERATOR",
          value: ch,
          line: startLine,
          col: startCol,
        });
      }
      continue;
    }

    // Delimiters
    if (ch === "(" || ch === ")" || ch === "," || ch === ";") {
      advance();
      tokens.push({
        type: "DELIMITER",
        value: ch,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Unknown character
    errors.push({
      message: `Unexpected character "${ch}"`,
      line: startLine,
      col: startCol,
      phase: "lexer",
    });
    tokens.push({ type: "ERROR", value: ch, line: startLine, col: startCol });
    advance();
  }

  tokens.push({ type: "EOF", value: "<EOF>", line, col });
  return { tokens, errors };
}
