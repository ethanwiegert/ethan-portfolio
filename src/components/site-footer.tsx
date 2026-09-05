export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <p className="text-center text-sm text-muted-foreground">
          © {year} Ethan
        </p>
      </div>
    </footer>
  );
}
