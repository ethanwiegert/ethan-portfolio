import { AgentCommand } from "@/components/agent-command";
import { GitHubIcon } from "@/components/brand-icons";
import { EmberField } from "@/components/ember-field";
import { BookCallButton, SocialLinks } from "@/components/social-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { links } from "@/lib/links";

export default function Home() {
  return (
    <main className="relative isolate flex min-h-svh flex-1 flex-col overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_45%,color-mix(in_oklch,var(--primary)_9%,transparent),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_50%_45%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_65%)]"
      />
      <EmberField className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />

      <div className="absolute top-3 right-3 z-20 sm:top-5 sm:right-5">
        <ThemeToggle />
      </div>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 pt-20 pb-36 text-center sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground sm:text-sm">
          Full-stack developer
        </p>
        <h1 className="mt-3 text-6xl font-bold tracking-tight sm:text-8xl">
          Ethan
        </h1>
        <p className="mt-5 max-w-xl text-balance text-lg text-foreground/85 sm:text-xl">
          Cost-efficient AI workflows that accelerate teams.
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
          <BookCallButton className="w-full sm:w-auto" />
          <Button
            size="lg"
            variant="outline"
            className="h-11 w-full bg-background/60 px-6 text-base backdrop-blur-sm sm:w-auto"
            nativeButton={false}
            render={
              <a href={links.github} target="_blank" rel="noreferrer noopener" />
            }
          >
            <GitHubIcon className="size-4" />
            GitHub
          </Button>
        </div>

        <SocialLinks className="mt-8" />

        <AgentCommand className="mt-10 w-full max-w-xl" />
      </section>
    </main>
  );
}
