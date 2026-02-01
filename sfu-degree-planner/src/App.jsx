import { useEffect, useState } from "react";
import { fetchDegreeCourses } from "./api/fetchCourses";
import { transformCourseData } from "./api/courseDataTransformer";

export default function App() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchDegreeCourses().then((rawData) => {
      const transformedCourses = transformCourseData(rawData);
      setCourses(transformedCourses);
      console.log("Transformed courses:", transformedCourses);
    });
  }, []);

  return (
    <div>
      <h1>Fetched {courses.length} courses</h1>
    </div>
  );
}