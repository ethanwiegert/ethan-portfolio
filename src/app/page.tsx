import Image from "next/image";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StarfieldHero } from "@/components/starfield-hero";
import { Button } from "@/components/ui/button";

interface Experience {
  job: string;
  description: string;
  time: string;
}

const CurrentExperience: Experience[] = [
  {
    job: "CDW",
    description: "Lead Software Developer for CDW DeviceCycle",
    time: "April 2026 - Current",
  },
  {
    job: "Lexicon Tech Solutions",
    description: "Software developer",
    time: "April 2024 - April 2026",
  },
  {
    job: "Exela Pharma Sciences",
    description: "QC Microbiologist",
    time: "August 2021 - August 2022",
  },
];

const CurrentRole = "CDW";

interface Projects {
  name: string;
  link: string;
}

const HighlightedProjects: Projects[] = [];

const sectionClass =
  "mx-auto w-full max-w-3xl scroll-mt-20 px-6 py-20 sm:py-24";
const headingClass = "text-2xl font-semibold tracking-tight sm:text-3xl";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <StarfieldHero />

        <div className="divide-y divide-border/60">
          <section id="about" className={sectionClass}>
            <h2 className={headingClass}>About</h2>
            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
              <Image
                className="size-28 shrink-0 rounded-full object-cover ring-1 ring-border"
                src="/ethan.jpeg"
                alt="Ethan Wiegert"
                height={112}
                width={112}
              />
              <div className="min-w-0">
                <p className="text-base font-medium text-foreground">
                  From Microbiologist to Full-stack developer
                </p>
                <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                  I originally obtained my Bachelors of Science in Microbiology
                  in 2021. I began my career working as a QC Microbiologist
                  testing for the presence of bacteria and fungi in liquid
                  injectibles in the Pharmaceutical industry. Years later, I
                  learned Javascript and fell in love with programming. Now the
                  only bugs I deal with are in code.
                </p>
              </div>
            </div>
          </section>

          <section id="projects" className={sectionClass}>
            <h2 className={headingClass}>Projects</h2>
            {HighlightedProjects.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {HighlightedProjects.map((i) => (
                  <a
                    key={i.name}
                    href={i.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-32 items-center justify-center rounded-xl border border-border bg-card p-4 text-center text-sm transition-colors hover:border-primary/50 hover:bg-muted"
                  >
                    {i.name}
                  </a>
                ))}
              </div>
            ) : (
              <div className="mt-8 flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Personal projects coming here soon!
              </div>
            )}
          </section>

          <section id="experience" className={sectionClass}>
            <h2 className={headingClass}>Experience</h2>
            <ol className="mt-8">
              {CurrentExperience.map((i) => (
                <li key={i.job} className="group flex gap-5 pb-8 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span
                      className={
                        i.job === CurrentRole
                          ? "mt-1.5 size-2.5 shrink-0 animate-pulse rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"
                          : "mt-1.5 size-2.5 shrink-0 rounded-full bg-primary"
                      }
                    />
                    <span className="mt-2 w-px flex-1 bg-border group-last:hidden" />
                  </div>
                  <div className="min-w-0 pb-2">
                    <p className="font-medium">{i.job}</p>
                    <p className="mt-0.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      {i.time}
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      {i.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="contact" className={sectionClass}>
            <div className="flex flex-col items-center gap-4 text-center">
              <h2 className={headingClass}>Contact</h2>
              <Button
                size="lg"
                nativeButton={false}
                render={<a href="mailto:ewiegert99@gmail.com" />}
              >
                Contact Ethan
              </Button>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
