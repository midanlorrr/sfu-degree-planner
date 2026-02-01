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

  function addPreviousSemester() {
    const semesters = Object.keys(plan).sort((a, b) => {
      const [yearA, termA] = a.split('-');
      const [yearB, termB] = b.split('-');
      if (yearA !== yearB) return yearA.localeCompare(yearB);
      const termOrder = { 'Spring': 0, 'Summer': 1, 'Fall': 2 };
      return termOrder[termA] - termOrder[termB];
    });

    const firstSemester = semesters[0];
    const [year, term] = firstSemester.split('-');
    
    let newYear, newTerm;
    if (term === 'Spring') {
      newYear = parseInt(year) - 1;
      newTerm = 'Fall';
    } else if (term === 'Summer') {
      newYear = year;
      newTerm = 'Spring';
    } else { // Fall
      newYear = year;
      newTerm = 'Summer';
    }

    const newSemesterKey = `${newYear}-${newTerm}`;
    
    setPlan(prevPlan => ({
      [newSemesterKey]: [],
      ...prevPlan
    }));
  }

  return (
    <div style={{ color: 'black' }}>
      <h1>MSE Degree Planner</h1>
      
      {courses.length > 0 ? (
        <>
          <DegreePlan 
            plan={plan} 
            courses={courses} 
            onCourseMove={handleCourseMove}
            onAddPreviousSemester={addPreviousSemester}
          />
          
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
        </>
      ) : (
        <p>Loading courses...</p>
      )}
    </div>
  );
}