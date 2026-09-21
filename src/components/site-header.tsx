import { ThemeToggle } from "@/components/theme-toggle";
import { links } from "@/lib/links";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "AI", href: "#workflows" },
  { label: "Experience", href: "#experience" },
  { label: "GitHub", href: links.github, external: true },
  { label: "Contact", href: "#contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
        <nav className="min-w-0 flex-1">
          <ul className="-mx-2 flex items-center gap-0.5 overflow-x-auto sm:gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  {...(link.external
                    ? { target: "_blank", rel: "noreferrer noopener" }
                    : {})}
                  className="block rounded-md px-2 py-2 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground sm:px-3"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
