import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StarfieldHero } from "@/components/starfield-hero";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <StarfieldHero />

        <section id="about" className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">About</h2>
          <p className="mt-4 text-muted-foreground">
            I&apos;m a developer who cares about craft, clarity, and the small
            details that make software feel good to use.
          </p>
          <p className="mt-3 text-muted-foreground">
            This section will grow into a proper introduction — for now it&apos;s
            a placeholder while the rest of the site takes shape.
          </p>
        </section>

        <section id="projects" className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Projects</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground"
              >
                Project coming soon
              </div>
            ))}
          </div>
        </section>

        <section id="experience" className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Experience</h2>
          <div className="mt-6 space-y-0">
            {[0, 1, 2].map((i) => (
              <div key={i} className="relative flex gap-4 pb-10 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="mt-1.5 size-2.5 rounded-full bg-primary" />
                  <span className="w-px flex-1 bg-border" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="h-3 w-1/3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Contact</h2>
          <div className="mt-6 flex flex-col items-start gap-4 rounded-lg border border-border p-6">
            <p className="text-muted-foreground">Contact details coming soon</p>
            <Button disabled>Get in touch</Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
