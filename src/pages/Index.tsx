import { useMemo, useState } from "react";
import { Play, FileCode2, Download, Copy, Check } from "lucide-react";
import { compile } from "@/compiler";
import { EXAMPLES } from "@/compiler/examples";
import { CodeEditor } from "@/components/CodeEditor";
import { NovaLogo } from "@/components/NovaLogo";
import {
  TokensView,
  AstView,
  IRView,
  PythonView,
  ListingView,
  ErrorsView,
} from "@/components/OutputViews";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Index = () => {
  const [source, setSource] = useState<string>(EXAMPLES[0].source);
  const [exampleId, setExampleId] = useState<string>(EXAMPLES[0].id);
  const [compiled, setCompiled] = useState(() => compile(EXAMPLES[0].source));
  const [activeTab, setActiveTab] = useState<string>("tokens");
  const [copied, setCopied] = useState(false);

  const errorLines = useMemo(
    () => new Set(compiled.errors.map((e) => e.line)),
    [compiled],
  );

  const handleRun = () => {
    setCompiled(compile(source));
    if (activeTab === "errors") return;
  };

  const handleExampleChange = (id: string) => {
    const ex = EXAMPLES.find((e) => e.id === id);
    if (!ex) return;
    setExampleId(id);
    setSource(ex.source);
    setCompiled(compile(ex.source));
  };

  const handleCopyPython = async () => {
    await navigator.clipboard.writeText(compiled.python);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadPython = () => {
    const blob = new Blob([compiled.python], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pipeline.py";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="border-b border-sidebar-border p-4">
          <NovaLogo />
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Examples
          </div>
          <ul className="space-y-1">
            {EXAMPLES.map((ex) => (
              <li key={ex.id}>
                <button
                  onClick={() => handleExampleChange(ex.id)}
                  className={`w-full rounded-md px-3 py-2 text-left font-mono text-xs transition-colors ${
                    exampleId === ex.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <div className="font-medium">{ex.label}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {ex.description}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Pipeline
          </div>
          <ol className="space-y-1 px-2 font-mono text-xs text-muted-foreground">
            <li>1. Lexer</li>
            <li>2. Parser</li>
            <li>3. Semantic</li>
            <li>4. IR Gen</li>
            <li>5. Codegen</li>
          </ol>
        </nav>
        <div className="border-t border-sidebar-border p-3 font-mono text-[10px] text-muted-foreground">
          DSL for data pipeline transforms.
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card/60 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <NovaLogo />
            </div>
            <div className="hidden items-center gap-2 font-mono text-xs text-muted-foreground md:flex">
              <FileCode2 className="h-3.5 w-3.5" />
              <span>pipeline.nova</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={exampleId} onValueChange={handleExampleChange}>
              <SelectTrigger className="h-9 w-[200px] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXAMPLES.map((ex) => (
                  <SelectItem
                    key={ex.id}
                    value={ex.id}
                    className="font-mono text-xs"
                  >
                    {ex.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleRun}
              className="h-9 gap-2 bg-gradient-brand font-mono text-xs font-semibold text-primary-foreground shadow-glow hover:opacity-90"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Run Compiler
            </Button>
          </div>
        </header>

        {/* Split pane */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Editor pane */}
          <section className="flex min-h-[40vh] flex-1 flex-col border-b border-border lg:min-h-0 lg:border-b-0 lg:border-r">
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Source · NovaScript</span>
              <span>{source.split("\n").length} lines</span>
            </div>
            <div className="min-h-0 flex-1">
              <CodeEditor
                value={source}
                onChange={setSource}
                errorLines={errorLines}
              />
            </div>
          </section>

          {/* Output pane */}
          <section className="flex min-h-[40vh] flex-1 flex-col lg:min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex h-full min-h-0 flex-col"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/40 px-2">
                <TabsList className="h-9 gap-0 bg-transparent p-0">
                  {[
                    { v: "tokens", label: "Tokens", count: compiled.tokens.length - 1 },
                    { v: "ast", label: "AST", count: compiled.ast.body.length },
                    { v: "ir", label: "IR", count: compiled.ir.instructions.length },
                    { v: "python", label: "Python" },
                    { v: "listing", label: "Listing" },
                    {
                      v: "errors",
                      label: "Errors",
                      count: compiled.errors.length,
                      destructive: compiled.errors.length > 0,
                    },
                  ].map((t) => (
                    <TabsTrigger
                      key={t.v}
                      value={t.v}
                      className="h-9 rounded-none border-b-2 border-transparent bg-transparent px-3 font-mono text-xs text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    >
                      {t.label}
                      {t.count !== undefined && (
                        <span
                          className={`ml-1.5 rounded-full px-1.5 text-[10px] ${
                            t.destructive
                              ? "bg-destructive/20 text-destructive"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {t.count}
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {activeTab === "python" && (
                  <div className="flex items-center gap-1 pr-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1.5 font-mono text-[10px]"
                      onClick={handleCopyPython}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1.5 font-mono text-[10px]"
                      onClick={handleDownloadPython}
                    >
                      <Download className="h-3 w-3" />
                      .py
                    </Button>
                  </div>
                )}
              </div>
              <div className="min-h-0 flex-1">
                <TabsContent value="tokens" className="m-0 h-full">
                  <TokensView tokens={compiled.tokens} />
                </TabsContent>
                <TabsContent value="ast" className="m-0 h-full">
                  <AstView result={compiled} />
                </TabsContent>
                <TabsContent value="ir" className="m-0 h-full">
                  <IRView result={compiled} />
                </TabsContent>
                <TabsContent value="python" className="m-0 h-full">
                  <PythonView python={compiled.python} />
                </TabsContent>
                <TabsContent value="listing" className="m-0 h-full">
                  <ListingView listing={compiled.listing} />
                </TabsContent>
                <TabsContent value="errors" className="m-0 h-full">
                  <ErrorsView result={compiled} />
                </TabsContent>
              </div>
            </Tabs>

            {/* Status bar */}
            <div className="flex shrink-0 items-center justify-between border-t border-border bg-card/60 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span
                  className={`flex items-center gap-1.5 ${
                    compiled.ok ? "text-success" : "text-destructive"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {compiled.ok ? "Compiled" : `${compiled.errors.length} error(s)`}
                </span>
                <span>{compiled.tokens.length - 1} tokens</span>
                <span>{compiled.symbols.symbols.length} symbols</span>
              </div>
              <div>NovaScript v0.1</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
