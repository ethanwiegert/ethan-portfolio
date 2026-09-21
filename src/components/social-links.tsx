import { CalendarIcon, GitHubIcon, LinkedInIcon, XIcon } from "@/components/brand-icons";
import { Button } from "@/components/ui/button";
import { hasLink, links } from "@/lib/links";
import { cn } from "@/lib/utils";

const iconLinkClass =
  "inline-flex size-11 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:border-primary/50 hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function SocialIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  if (!hasLink(href)) {
    return (
      <span
        className={cn(iconLinkClass, "cursor-default opacity-80")}
        role="link"
        aria-disabled="true"
        aria-label={label}
      >
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      className={iconLinkClass}
    >
      {children}
    </a>
  );
}

export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
      <li>
        <SocialIconLink href={links.github} label="GitHub">
          <GitHubIcon />
        </SocialIconLink>
      </li>
      <li>
        <SocialIconLink href={links.linkedin} label="LinkedIn">
          <LinkedInIcon />
        </SocialIconLink>
      </li>
      <li>
        <SocialIconLink href={links.x} label="X">
          <XIcon />
        </SocialIconLink>
      </li>
    </ul>
  );
}

export function BookCallButton({ className }: { className?: string }) {
  const external = hasLink(links.calendly);

  return (
    <Button
      size="lg"
      className={cn("h-11 px-6 text-base", className)}
      nativeButton={false}
      render={
        <a
          href={external ? links.calendly : "#contact"}
          {...(external
            ? { target: "_blank", rel: "noreferrer noopener" }
            : {})}
        />
      }
    >
      <CalendarIcon />
      Book a call
    </Button>
  );
}
