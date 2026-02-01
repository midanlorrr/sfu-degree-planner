// App.jsx - update the handleCourseMove function
import { useEffect, useState } from "react";
import { fetchDegreeCourses } from "./api/fetchCourses";
import { transformCourseData } from "./api/courseDataTransformer";
import { DEFAULT_PLAN } from "./data/defaultPlan";
import DegreePlan from "./components/DegreePlan";
import { validateAndCascade } from "./utils/validation";

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
    console.log(`\n🔄 Attempting to move ${courseId} from ${sourceSemester} to ${targetSemester}`);
    
    const newPlan = validateAndCascade(courseId, sourceSemester, targetSemester, plan, courses);
    
    if (newPlan) {
      console.log('✅ Move successful with cascades applied');
      setPlan(newPlan);
    } else {
      console.log('❌ Move blocked - invalid');
      alert(`Cannot move ${courseId} to ${targetSemester}. Check console for details.`);
    }
  }

  return (
    <div style={{ color: 'black' }}>
      <h1>MSE Degree Planner</h1>
      {courses.length > 0 ? (
        <DegreePlan plan={plan} courses={courses} onCourseMove={handleCourseMove} />
      ) : (
        <p>Loading courses...</p>
      )}
    </div>
  );
}