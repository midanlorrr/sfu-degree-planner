// App.jsx - add notification panel
import { useEffect, useState } from "react";
import { fetchDegreeCourses } from "./api/fetchCourses";
import { transformCourseData } from "./api/courseDataTransformer";
import { DEFAULT_PLAN } from "./data/defaultPlan";
import DegreePlan from "./components/DegreePlan";
import { validateAndCascade } from "./utils/validation";

export default function App() {
  const [courses, setCourses] = useState([]);
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDegreeCourses().then((rawData) => {
      const transformedCourses = transformCourseData(rawData);
      setCourses(transformedCourses);
    });
  }, []);

  function handleCourseMove(courseId, sourceSemester, targetSemester) {
    const logs = [];
    const result = validateAndCascade(courseId, sourceSemester, targetSemester, plan, courses, logs);
    
    setNotifications(logs);
    
    if (result.plan) {
      setPlan(result.plan);
    }
  }

  return (
    <div style={{ color: 'black' }}>
      <h1>MSE Degree Planner</h1>
      
      {notifications.length > 0 && (
        <div style={{ 
          margin: '20px', 
          padding: '15px', 
          background: '#f5f5f5', 
          border: '1px solid #ddd',
          borderRadius: '4px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Move Log:</strong>
            <button onClick={() => setNotifications([])} style={{ 
              padding: '4px 8px', 
              fontSize: '12px',
              cursor: 'pointer'
            }}>Clear</button>
          </div>
          {notifications.map((msg, idx) => (
            <div key={idx} style={{ 
              padding: '4px 0', 
              fontSize: '14px',
              fontFamily: 'monospace'
            }}>
              {msg}
            </div>
          ))}
        </div>
      )}
      
      {courses.length > 0 ? (
        <DegreePlan plan={plan} courses={courses} onCourseMove={handleCourseMove} />
      ) : (
        <p>Loading courses...</p>
      )}
    </div>
  );
}