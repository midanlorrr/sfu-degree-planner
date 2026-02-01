export default function DegreePlan({ plan, courses }) {
  const semesters = Object.keys(plan).sort(); // Sort chronologically
  
  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      {semesters.map(semesterKey => {
        const [year, term] = semesterKey.split('-');
        const courseIds = plan[semesterKey];
        
        return (
          <div key={semesterKey} style={{ border: '1px solid #ccc', padding: '15px', minWidth: '250px' }}>
            <h3>{term} {year}</h3>
            {courseIds.map(courseId => {
              const courseData = courses.find(c => c.id === courseId);
              return (
                <div key={courseId} style={{ 
                  padding: '10px', 
                  margin: '8px 0', 
                  background: '#f0f0f0',
                  borderRadius: '4px'
                }}>
                  <strong>{courseId}</strong>
                  <div style={{ fontSize: '12px' }}>{courseData?.name}</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>{courseData?.credits} credits</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}