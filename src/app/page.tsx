import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const sections = [
  { id: "hero", title: "Hero", text: "Welcome — this is the hero section." },
  { id: "about", title: "About", text: "A little about me and what I do." },
  {
    id: "projects",
    title: "Projects",
    text: "A selection of things I have built.",
  },
  {
    id: "experience",
    title: "Experience",
    text: "Where I have worked and what I learned.",
  },
  {
    id: "contact",
    title: "Contact",
    text: "Get in touch — I would love to hear from you.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6"
          >
            <h2 className="text-2xl font-semibold tracking-tight">
              {section.title}
            </h2>
            <p className="mt-2 text-muted-foreground">{section.text}</p>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
