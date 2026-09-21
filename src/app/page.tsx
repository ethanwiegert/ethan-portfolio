import Image from "next/image";

import { GitHubIcon } from "@/components/brand-icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BookCallButton, SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { WorkflowHero } from "@/components/workflow-hero";
import { links } from "@/lib/links";

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

const offerings = [
  {
    title: "Spend where it counts",
    body: "Frontier models where the task earns them. Smaller models, caching, and batching everywhere else, so the workflow stays fast without a surprise invoice.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-5"
      >
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: "Workflows, not one-off prompts",
    body: "AI wired into the path the work already takes — review, docs, support, internal tools — so the team finishes more of it, not another chat window to babysit.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-5"
      >
        <circle cx="6" cy="6" r="2.25" />
        <circle cx="18" cy="12" r="2.25" />
        <circle cx="6" cy="18" r="2.25" />
        <path d="M8.2 7.1 15.8 10.8" />
        <path d="M8.2 16.9 15.8 13.2" />
      </svg>
    ),
  },
  {
    title: "Built to hand off",
    body: "Full-stack delivery from the first flow to a system your people can run. Something that keeps working after the kickoff call.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-5"
      >
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
      </svg>
    ),
  },
];

const sectionClass =
  "mx-auto w-full max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24";
const headingClass = "text-2xl font-semibold tracking-tight sm:text-3xl";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <WorkflowHero />

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

          <section
            id="workflows"
            className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24"
          >
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              For teams
            </p>
            <h2 className={`${headingClass} mt-3 max-w-2xl`}>
              AI workflows that pay for themselves
            </h2>
            <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              I help teams deliver cost-efficient AI workflows that accelerate
              the work they already do. Practical speed, a bill that stays
              predictable, and something people will still be using next
              quarter.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {offerings.map((offering) => (
                <article
                  key={offering.title}
                  className="rounded-2xl border border-border bg-card p-5 sm:p-6"
                >
                  <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
                    {offering.icon}
                  </div>
                  <h3 className="text-base font-medium">{offering.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {offering.body}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <BookCallButton className="w-full sm:w-auto" />
              <Button
                size="lg"
                variant="outline"
                className="h-11 w-full px-6 text-base sm:w-auto"
                nativeButton={false}
                render={
                  <a
                    href={links.github}
                    target="_blank"
                    rel="noreferrer noopener"
                  />
                }
              >
                <GitHubIcon className="size-4" />
                See the code
              </Button>
            </div>
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
              <p className="max-w-md text-pretty text-muted-foreground">
                Tell me what your team is trying to speed up. Grab a time, or
                send a note.
              </p>
              <div className="mt-2 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center">
                <BookCallButton className="w-full sm:w-auto" />
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 w-full px-6 text-base sm:w-auto"
                  nativeButton={false}
                  render={<a href={links.email} />}
                >
                  Email Ethan
                </Button>
              </div>
              <SocialLinks className="mt-4" />
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
