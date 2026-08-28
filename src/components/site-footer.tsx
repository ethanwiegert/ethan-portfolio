export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/60 py-6">
      <p className="text-center text-sm text-muted-foreground">
        © {year} Ethan
      </p>
    </footer>
  );
}
