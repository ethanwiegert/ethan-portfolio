import { SocialLinks } from "@/components/social-links";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-8 sm:px-6">
        <SocialLinks />
        <p className="text-center text-sm text-muted-foreground">
          © {year} Ethan
        </p>
      </div>
    </footer>
  );
}
