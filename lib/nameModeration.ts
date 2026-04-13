import { BLOCKED_NAME_TERMS } from "@/lib/blockedNameTerms";

export function sanitizeEditableName(input: string) {
  return input
    .replace(/[\r\n]+/g, " ")
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿĀ-žḀ-ỿ\s-]/g, "")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-")
    .replace(/\s*-\s*/g, "-")
    .replace(/^-+/, "")
    .slice(0, 33);
}

export function normalizeNameForBlockedWordCheck(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[0@]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[^a-z]/g, "");
}

export function containsBlockedNameTerm(input: string) {
  const normalized = normalizeNameForBlockedWordCheck(input);
  return BLOCKED_NAME_TERMS.some((term) => normalized.includes(term));
}

export function isBlockedLinkedInSubmission(params: {
  submittedName: string;
  guessedName: string;
  slug: string;
}) {
  const submittedNameClean = sanitizeEditableName(params.submittedName);
  const guessedNameClean = sanitizeEditableName(params.guessedName);
  const slugNormalized = normalizeNameForBlockedWordCheck(params.slug);

  const submittedBlocked =
    submittedNameClean.length > 0 && containsBlockedNameTerm(submittedNameClean);

  const guessedBlocked =
    guessedNameClean.length > 0 && containsBlockedNameTerm(guessedNameClean);

  const slugBlocked = BLOCKED_NAME_TERMS.some((term) =>
    slugNormalized.includes(term)
  );

  return submittedBlocked || guessedBlocked || slugBlocked;
}