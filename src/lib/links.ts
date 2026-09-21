/**
 * Profile links.
 *
 * Paste a full URL to turn that control into a working link.
 * Leave LinkedIn, X, or Calendly as "" until you have the address —
 * the icon or button still renders, and it will not send people anywhere.
 */
export const links = {
  github: "https://github.com/ethanwiegert",
  linkedin: "",
  x: "",
  calendly: "",
  email: "mailto:ewiegert99@gmail.com",
} as const;

export function hasLink(url: string) {
  return url.trim().length > 0;
}
