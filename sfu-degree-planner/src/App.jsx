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
      console.log('Total courses loaded:', transformedCourses.length);
      console.log('Special courses:', transformedCourses.filter(c => c.type));
      console.log('COOP exists?', transformedCourses.find(c => c.id === 'COOP'));
      setCourses(transformedCourses);
    });
  }, []);

  function handleCourseMove(courseId, sourceSemester, targetSemester) {
    const logs = [];
    const result = validateAndCascade(courseId, sourceSemester, targetSemester, plan, courses, logs);
    
    setNotifications(logs);
    
    if (result.plan) {
      // Find the last semester with courses
      const semestersInOrder = Object.keys(result.plan).sort((a, b) => {
        const [yearA, termA] = a.split('-');
        const [yearB, termB] = b.split('-');
        if (yearA !== yearB) return yearA.localeCompare(yearB);
        const termOrder = { 'Spring': 0, 'Summer': 1, 'Fall': 2 };
        return termOrder[termA] - termOrder[termB];
      });
      
      let lastNonEmptySemester = null;
      for (let i = semestersInOrder.length - 1; i >= 0; i--) {
        if (result.plan[semestersInOrder[i]].length > 0) {
          lastNonEmptySemester = semestersInOrder[i];
          break;
        }
      }
      
      // Keep only semesters up to and including the last non-empty one
      const cleanedPlan = {};
      for (const semester of semestersInOrder) {
        cleanedPlan[semester] = result.plan[semester];
        if (semester === lastNonEmptySemester) break;
      }
      
      setPlan(cleanedPlan);
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

  function addNextSemester() {
    const semesters = Object.keys(plan).sort((a, b) => {
      const [yearA, termA] = a.split('-');
      const [yearB, termB] = b.split('-');
      if (yearA !== yearB) return yearA.localeCompare(yearB);
      const termOrder = { 'Spring': 0, 'Summer': 1, 'Fall': 2 };
      return termOrder[termA] - termOrder[termB];
    });

    const lastSemester = semesters[semesters.length - 1];
    const [year, term] = lastSemester.split('-');
    
    let newYear, newTerm;
    if (term === 'Spring') {
      newYear = year;
      newTerm = 'Summer';
    } else if (term === 'Summer') {
      newYear = year;
      newTerm = 'Fall';
    } else { // Fall
      newYear = parseInt(year) + 1;
      newTerm = 'Spring';
    }

    const newSemesterKey = `${newYear}-${newTerm}`;
    
    setPlan(prevPlan => ({
      ...prevPlan,
      [newSemesterKey]: []
    }));
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ 
        padding: '30px 40px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '600' }}>MSE Degree Planner</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
          Drag courses to rearrange your schedule
        </p>
      </div>
      
      {courses.length > 0 ? (
        <>
          <DegreePlan 
            plan={plan} 
            courses={courses} 
            onCourseMove={handleCourseMove}
            onAddPreviousSemester={addPreviousSemester}
            onAddNextSemester={addNextSemester}
          />
          
          {notifications.length > 0 && (
            <div style={{ 
              margin: '20px 40px', 
              padding: '20px', 
              background: 'white',
              color: 'black',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong style={{ fontSize: '16px' }}>Move Log</strong>
                <button onClick={() => setNotifications([])} style={{ 
                  padding: '6px 12px', 
                  fontSize: '12px',
                  cursor: 'pointer',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px'
                }}>Clear</button>
              </div>
              {notifications.map((msg, idx) => (
                <div key={idx} style={{ 
                  padding: '6px 0', 
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  borderBottom: idx < notifications.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  {msg}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px' }}>Loading courses...</p>
        </div>
      )}
    </div>
  );
}