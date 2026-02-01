// Ex. "MSE 221 (or ENSC 281 or SEE 221), MSE 222 (or ENSC 282), MSE 280 (or ENSC 380 or SEE 341)."

// These are strings that tell us the prereq is high school or unit-based
// If we detect any of these and no valid course IDs, we skip it
const SKIP_KEYWORDS = [
  "Pre-Calculus",
  "BC ",
  "Chemistry 12",
  "units",
  "co-op",
  "upper division",
];

// Regex that matches a course ID like "MSE 221" or "MSE 101W"
// [A-Z]{2,4} = 2 to 4 uppercase letters (the department)
// \s* = zero or more spaces
// \d+ = one or more digits
// [A-Z]? = an optional letter at the end (like the W in 101W)
const COURSE_ID_REGEX = /[A-Z]{2,4}\s*\d+[A-Z]?/g;

export function parsePrereqs(prereqString) {
  // If empty string, no prereqs
  if (!prereqString || prereqString.trim() === "") {
    return [];
  }

  let cleaned = prereqString;

  // Step 1: Check if this is a high school / unit-based prereq
  // If it contains skip keywords AND no valid course IDs, return empty
  const hasSkipKeyword = SKIP_KEYWORDS.some((keyword) =>
    cleaned.includes(keyword)
  );
  const hasCourseIds = COURSE_ID_REGEX.test(cleaned);
  // Reset regex lastIndex (see note below)
  COURSE_ID_REGEX.lastIndex = 0;

  if (hasSkipKeyword && !hasCourseIds) {
    return [];
  }

  // Step 2: Clean the string
  // Remove "or equivalent"
  cleaned = cleaned.replace(/or equivalent/gi, "");
  // Remove grade requirements like "with a minimum grade of C-" or "with a grade of at least B"
  cleaned = cleaned.replace(/with a (minimum )?grade of[^,.]*/gi, "");
  // Remove corequisite info (everything from "Corequisite:" onwards)
  cleaned = cleaned.replace(/Corequisite:.*/gi, "");
  // Remove "may be taken concurrently" notes
  cleaned = cleaned.replace(/[^.]*may be taken concurrently/gi, "");
  // Remove trailing period and extra whitespace
  cleaned = cleaned.replace(/\.\s*$/, "").trim();
  // Remove any leftover semicolons and normalize to commas
  cleaned = cleaned.replace(/;/g, ",");

  // Step 3: Split into AND groups
  // First split on ", and ", then split each result on ","
  const andGroups = cleaned
    .split(/, and /i)
    .flatMap((part) => part.split(","))
    .map((group) => group.trim())
    .filter((group) => group.length > 0);

  // Step 4 & 5: For each AND group, split by OR and extract course IDs
  const prereqs = andGroups
    .map((group) => {
      // Split on " or "
      const orParts = group.split(/ or /i);
      // Extract course IDs from each OR part
      const courseIds = orParts
        .map((part) => {
          const matches = part.match(COURSE_ID_REGEX);
          // Normalize any missing spaces in course IDs (e.g. "MSE221" -> "MSE 221")
          return matches
            ? matches.map((id) => id.replace(/([A-Z]+)(\d)/, "$1 $2"))
            : [];
        })
        .flat();
      return courseIds;
    })
    // Drop any groups that ended up empty (no valid course IDs found)
    .filter((group) => group.length > 0);

  return prereqs;
}