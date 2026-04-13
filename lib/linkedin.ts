export function sanitizeLinkedInInput(input: string) {
  return input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/\s+/g, "");
}

function looksLikeLinkedInSuffix(part: string) {
  return /^[a-z0-9]{9,12}$/i.test(part) && /\d/.test(part);
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseLinkedInProfileUrl(input: string) {
  const cleaned = sanitizeLinkedInInput(input);

  const linkedinProfileRegex =
    /^https:\/\/(?:www\.)?linkedin\.com\/in\/((?:[a-z0-9]|%[0-9a-f]{2})+(?:-(?:[a-z0-9]|%[0-9a-f]{2})+)*)\/?$/i;

  const match = cleaned.match(linkedinProfileRegex);

  if (!match) {
    return {
      isValid: false,
      cleanedUrl: "",
      slug: "",
      name: "",
    };
  }

  const rawSlug = match[1];
  const decodedSlug = safeDecodeURIComponent(rawSlug);
  const parts = decodedSlug.split("-").filter(Boolean);

  let nameParts = parts;

  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    if (looksLikeLinkedInSuffix(lastPart)) {
      nameParts = parts.slice(0, -1);
    }
  }

  const name = nameParts
    .map((part) =>
      part.length === 0
        ? part
        : part.charAt(0).toLocaleUpperCase() + part.slice(1).toLocaleLowerCase()
    )
    .join(" ");

  return {
    isValid: true,
    cleanedUrl: `https://linkedin.com/in/${rawSlug}/`,
    slug: rawSlug,
    name,
  };
}