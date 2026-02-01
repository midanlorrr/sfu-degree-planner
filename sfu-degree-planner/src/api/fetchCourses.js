const BASE_URL = "https://api.sfucourses.com/v1/rest/outlines";

// The departments we need to fetch
const DEPARTMENTS = ["mse", "math", "cmpt", "phys", "chem"];

// The exact course IDs required for your MSE degree
// (format: "DEPT NUMBER")
export const DEGREE_COURSES = [
  "CMPT 130",
  "MATH 150", "MATH 151", // one of
  "MATH 152",
  "MATH 232",
  "MATH 251",
  "MSE 101W",
  "MSE 102",
  "MSE 103",
  "MSE 112",
  "MSE 152",
  "MSE 210",
  "MSE 212",
  "MSE 220",
  "MSE 222",
  "MSE 224",
  "MSE 250",
  "MSE 251",
  "MSE 252",
  "MSE 280",
  "MSE 281",
  "MSE 300",
  "MSE 310",
  "MSE 312",
  "MSE 320",
  "MSE 321",
  "MSE 323",
  "MSE 352",
  "MSE 353",
  "MSE 381",
  "MSE 402",
  "MSE 405W",
  "MSE 410",
  "MSE 411",
  "PHYS 140",
  "PHYS 141",
  "CHEM 120", "CHEM 121", // one of
];

export async function fetchDegreeCourses() {
  try {
    // Fetch all departments in parallel
    const responses = await Promise.all(
      DEPARTMENTS.map((dept) =>
        fetch(`${BASE_URL}?dept=${dept}`).then((res) => res.json())
      )
    );

    // Flatten into one array
    const allCourses = responses.flat();

    // Filter to only the courses in our degree
    const degreeCourses = allCourses.filter((course) => {
      const courseId = `${course.dept} ${course.number}`;
      return DEGREE_COURSES.includes(courseId);
    });

    return degreeCourses;
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    throw error;
  }
}