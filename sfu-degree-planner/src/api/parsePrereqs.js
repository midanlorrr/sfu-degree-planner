// Courses that are entry-level (high school equivalent)
// These have no in-app prereqs
const ENTRY_LEVEL_COURSES = [
  "MATH 150", "MATH 151", "CMPT 130",
  "PHYS 140", "CHEM 120", "CHEM 121",
  "MSE 101W", "MSE 102", "MSE 103",
];

// All courses that exist in your MSE degree
// Used to filter out alternatives like ENSC equivalents that aren't in your plan
const DEGREE_COURSE_IDS = [
  "CMPT 130",
  "MATH 150", "MATH 151", "MATH 152", "MATH 232", "MATH 251",
  "MSE 101W", "MSE 102", "MSE 103", "MSE 112", "MSE 152",
  "MSE 210", "MSE 212", "MSE 220", "MSE 222", "MSE 224",
  "MSE 250", "MSE 251", "MSE 252", "MSE 280", "MSE 281",
  "MSE 300", "MSE 310", "MSE 312", "MSE 320", "MSE 321",
  "MSE 323", "MSE 352", "MSE 353", "MSE 381", "MSE 402",
  "MSE 405W", "MSE 410", "MSE 411",
  "PHYS 140", "PHYS 141",
  "CHEM 120", "CHEM 121",
  // These are referenced as prereqs by degree courses but aren't in the
  // degree list themselves. We keep them so prereq chains don't break.
  "MSE 221", "MSE 223", "MATH 100",
];

// Courses whose prereq strings are too weird or ambiguous to parse reliably.
// We hardcode the correct result here.
//
// Notes on why each one is here:
// - MATH 251: has noise like "for students in life sciences" and self-references
// - MSE 402: unit-based prereq with "one of" alternatives buried inside
// - MSE 410: unit + co-op based prereq, no course chain we can model
// - MSE 411: simple, but MSE 410 prereq string is so noisy we just do both
// - MSE 310: references MSE 221 which isn't in degree list but is a real prereq
// - MSE 320: references MSE 100 and MSE 221, both outside degree but needed
// - MSE 321: references MSE 223 (API number) but degree lists it as MSE 323
// - MSE 312: references MSE 110 which isn't in degree list
const MANUAL_PREREQS = {
  "MATH 251": [["MATH 152"]],
  "MSE 402": [["MSE 102"]],
  "MSE 410": [],
  "MSE 411": [["MSE 410"]],
  "MSE 310": [["MSE 224"], ["MSE 222"], ["MSE 251"], ["MSE 280"]],
  "MSE 320": [["MSE 220"], ["MSE 224"]],
  "MSE 321": [["MATH 251"], ["MSE 323"]], // Changed to use new course number
  "MSE 312": [["MSE 320"], ["MSE 381"]],
  "MSE 212": [["MSE 103"], ["MSE 112"]],
  "MSE 252": [],
  "MSE 323": [["MSE 103"], ["MATH 251"]], // Added renamed course
  "MSE 222": [["MSE 103"], ["MATH 251"]]
};

// Regex that matches a course ID like "MSE 221" or "MSE 101W"
// [A-Z]{2,4} = 2 to 4 uppercase letters (the department)
// \s* = zero or more spaces
// \d+ = one or more digits
// [A-Z]? = an optional letter at the end (like the W in 101W)
const COURSE_ID_REGEX = /[A-Z]{2,4}\s*\d+[A-Z]?/g;

// These keywords indicate a high school or unit-based prereq
const SKIP_KEYWORDS = [
  "Pre-Calculus",
  "BC ",
  "Chemistry 12",
  "units",
  "co-op",
  "upper division",
];

export function parsePrereqs(prereqString, courseId) {
  // Return empty for entry-level courses
  if (ENTRY_LEVEL_COURSES.includes(courseId)) {
    return [];
  }

  // Return hardcoded result for manually overridden courses
  if (MANUAL_PREREQS[courseId] !== undefined) {
    return MANUAL_PREREQS[courseId];
  }

  // If empty string, no prereqs
  if (!prereqString || prereqString.trim() === "") {
    return [];
  }

  let cleaned = prereqString;

  // Check if this is a high school / unit-based prereq
  // If it contains skip keywords AND no valid course IDs, return empty
  const hasSkipKeyword = SKIP_KEYWORDS.some((keyword) =>
    cleaned.includes(keyword)
  );
  const hasCourseIds = COURSE_ID_REGEX.test(cleaned);
  COURSE_ID_REGEX.lastIndex = 0;

  if (hasSkipKeyword && !hasCourseIds) {
    return [];
  }

  // --- BARE NUMBER INHERITANCE ---
  // Replace bare numbers like "151" with the full course ID like "MATH 151"
  // by finding the last department code that appeared before each bare number.
  // Example: "MATH 150 or 151 or 155" -> "MATH 150 or MATH 151 or MATH 155"
  let lastDept = null;
  cleaned = cleaned.replace(/([A-Z]{2,4})\s*(\d+[A-Z]?)|(?<![A-Z])(\d+[A-Z]?)(?!\d)/g, (match, dept, num, bareNum) => {
    if (dept) {
      // This is a full course ID like "MATH 150" - remember the department
      lastDept = dept;
      return match; // return unchanged
    }
    if (bareNum && lastDept) {
      // This is a bare number like "151" - prepend the last department
      return `${lastDept} ${bareNum}`;
    }
    return match;
  });

  // --- CLEANING STEP ---
  // Remove "or equivalent"
  cleaned = cleaned.replace(/or equivalent/gi, "");
  // Remove grade requirements
  cleaned = cleaned.replace(/with a (minimum )?grade of[^,.]*/gi, "");
  // Remove "both with..." style grade notes
  cleaned = cleaned.replace(/both with[^,.]*/gi, "");
  // Remove corequisite info
  cleaned = cleaned.replace(/Corequisite:.*/gi, "");
  // Remove "may be taken concurrently" and any preceding text in that sentence
  cleaned = cleaned.replace(/[^.]*may be taken concurrently/gi, "");
  // Remove "Must not be taken concurrently" notes
  cleaned = cleaned.replace(/Must not be taken concurrently[^.]*/gi, "");
  // Remove "either" keyword
  cleaned = cleaned.replace(/either /gi, "");
  // Remove "(previously ...)" style notes
  cleaned = cleaned.replace(/\(previously[^)]*\)/gi, "");
  // Remove "Also, ..." and everything after (catches noise like life sciences notes)
  cleaned = cleaned.replace(/Also,.*/gi, "");
  // Remove "Recommended: ..." and everything after
  cleaned = cleaned.replace(/Recommended:.*/gi, "");
  // Replace semicolons with commas
  cleaned = cleaned.replace(/;/g, ",");
  // Remove trailing period and extra whitespace
  cleaned = cleaned.replace(/\.\s*$/, "").trim();

  // --- SPLIT INTO AND GROUPS ---
  // Split on periods, commas, or the word "and"
  const andGroups = cleaned
    .split(/[.,]|\band\b/i)
    .map((group) => group.trim())
    .filter((group) => group.length > 0);

  // --- SPLIT EACH GROUP BY OR, THEN EXTRACT COURSE IDs ---
  const prereqs = andGroups
    .map((group) => {
      const orParts = group.split(/ or /i);
      const courseIds = orParts
        .map((part) => {
          const matches = part.match(COURSE_ID_REGEX);
          return matches
            ? matches.map((id) => id.replace(/([A-Z]+)(\d)/, "$1 $2"))
            : [];
        })
        .flat();
      return courseIds;
    })
    .filter((group) => group.length > 0);

  // --- FILTER TO DEGREE COURSES ONLY ---
  // Remove any course IDs that aren't in our degree or known prereq chain.
  // Then drop any groups that end up empty after filtering.
  const filtered = prereqs
    .map((group) => group.filter((id) => DEGREE_COURSE_IDS.includes(id)))
    .filter((group) => group.length > 0);

  return filtered;
}