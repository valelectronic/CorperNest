// ─── SLUG GENERATOR ───────────────────────────────────────────────────────────
// Generates URL-friendly slugs for listings: type + lga + state + random suffix
// e.g. "self-contained-uyo-akwa-ibom-x7k2"

const TYPE_SLUGS: Record<string, string> = {
  "self-con":  "self-contained",
  "mini-flat": "mini-flat",
  "1-bed":     "1-bedroom",
  "2-bed":     "2-bedroom",
  "3-bed":     "3-bedroom",
  "room":      "single-room",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")  // remove special characters
    .replace(/\s+/g, "-")          // spaces to hyphens
    .replace(/-+/g, "-");          // collapse multiple hyphens
}

function randomSuffix(length = 4): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function generateListingSlug(type: string, lga: string, state: string): string {
  const typeSlug  = TYPE_SLUGS[type] ?? slugify(type);
  const lgaSlug   = slugify(lga);
  const stateSlug = slugify(state);
  const suffix    = randomSuffix();

  return `${typeSlug}-${lgaSlug}-${stateSlug}-${suffix}`;
}