"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy } from "lucide-react";

const noop = () => () => {};

export function AgentCommand({ className }: { className?: string }) {
  // The real origin is only known in the browser, so the command
  // works wherever the site is deployed (including preview URLs).
  const origin = useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => "",
  );
  const [copied, setCopied] = useState(false);

  const command = `curl -s ${origin}/llms.txt | "Tell me about Ethan"`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the command is still selectable.
    }
  }

  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Ask your agent about me in one command
      </p>
      <div className="mt-3 flex w-full items-center gap-2 rounded-xl border border-border bg-background/70 py-1.5 pr-1.5 pl-4 text-left shadow-sm backdrop-blur-md">
        <span aria-hidden="true" className="font-mono text-sm text-primary select-none dark:text-ring">
          $
        </span>
        <code className="min-w-0 flex-1 overflow-x-auto py-1.5 font-mono text-[13px] whitespace-nowrap text-foreground/90 [scrollbar-width:none] sm:text-sm">
          {command}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy command"}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
        </button>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Command copied" : ""}
      </span>
    </div>
  );
}
