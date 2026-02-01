// App.jsx
import { useEffect, useState } from "react";
import { fetchDegreeCourses } from "./api/fetchCourses";
import { transformCourseData } from "./api/courseDataTransformer";
import { DEFAULT_PLAN } from "./data/defaultPlan";
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

  function handleCourseMove(courseId, sourceSemester, targetSemester) {
    setPlan(prevPlan => {
      const newPlan = { ...prevPlan };
      
      // Remove from source
      newPlan[sourceSemester] = newPlan[sourceSemester].filter(id => id !== courseId);
      
      // Add to target
      newPlan[targetSemester] = [...newPlan[targetSemester], courseId];
      
      return newPlan;
    });
  }

  return (
    <div>
      <h1>MSE Degree Planner</h1>
      {courses.length > 0 ? (
        <DegreePlan plan={plan} courses={courses} onCourseMove={handleCourseMove} />
      ) : (
        <p>Loading courses...</p>
      )}
    </div>
  );
}