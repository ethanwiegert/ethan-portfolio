/**
 * Served at /llms.txt — the plain-text profile agents read.
 * Edit the text below; it is plain Markdown (https://llmstxt.org).
 */
const content = `# Ethan Wiegert

> Full-stack developer who helps teams deliver cost-efficient AI workflows that accelerate the work they already do.

## About

From microbiologist to full-stack developer. Ethan earned a B.S. in Microbiology in 2021 and started out as a QC Microbiologist, testing liquid injectables for bacteria and fungi in the pharmaceutical industry. Years later he learned JavaScript and fell in love with programming. Now the only bugs he deals with are in code.

## Experience

- CDW — Lead Software Developer for CDW DeviceCycle (April 2026 – present)
- Lexicon Tech Solutions — Software Developer (April 2024 – April 2026)
- Exela Pharma Sciences — QC Microbiologist (August 2021 – August 2022)

## What I help teams with

- Spend where it counts: frontier models where the task earns them; smaller models, caching, and batching everywhere else.
- Workflows, not one-off prompts: AI wired into review, docs, support, and internal tools.
- Built to hand off: full-stack delivery from the first flow to a system the team can run.

## Skills

<!-- Add languages, frameworks, and tools here. -->

## Projects

<!-- Add projects with a one-line description and a link. -->

## Contact

- Email: ewiegert99@gmail.com
- GitHub: https://github.com/ethanwiegert
`;

export const dynamic = "force-static";

export function GET() {
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
