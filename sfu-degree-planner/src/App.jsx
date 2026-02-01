import { useEffect, useState } from "react";
import { fetchDegreeCourses } from "./api/fetchCourses";
import { transformCourseData } from "./api/courseDataTransformer";
import { DEFAULT_PLAN } from "./data/defaultPlan"; // wherever you saved it
import DegreePlan from "./components/DegreePlan";

export default function App() {
  const [courses, setCourses] = useState([]);
  const [plan, setPlan] = useState(DEFAULT_PLAN);

  useEffect(() => {
    fetchDegreeCourses().then((rawData) => {
      const transformedCourses = transformCourseData(rawData);
      setCourses(transformedCourses);
    });
  }, []);

  return (
    <div>
      <h1>MSE Degree Planner</h1>
      {courses.length > 0 ? (
        <DegreePlan plan={plan} courses={courses} />
      ) : (
        <p>Loading courses...</p>
      )}
    </div>
  );
}