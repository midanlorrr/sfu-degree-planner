import { useEffect, useState } from "react";
import { fetchDegreeCourses } from "./api/fetchCourses";
import { parsePrereqs } from "./api/parsePrereqs";

export default function App() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchDegreeCourses().then((data) => {
      setCourses(data);
      // Test the parser on every course
      data.forEach((course) => {
        const id = `${course.dept} ${course.number}`;
        const parsed = parsePrereqs(course.prerequisites);
        console.log(`${id}: ${JSON.stringify(parsed)}`);
      });
    });
  }, []);

  return (
    <div>
      <h1>Fetched {courses.length} courses</h1>
    </div>
  );
}