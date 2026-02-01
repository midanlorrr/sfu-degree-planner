// components/DegreePlan.jsx
import { useState } from 'react';

function getBaseCourseId(courseId) {
  return courseId.replace(/-\d+$/, "");
}

function CourseBlock({ course, isDragging }) {
  const getBackgroundColor = () => {
    if (course.type === 'coop') return '#e3f2fd';
    if (course.type === 'elective') return '#fff3e0';
    if (course.type === 'technical-elective') return '#f3e5f5';
    return '#f0f0f0';
  };

  return (
    <div style={{ 
      padding: '10px', 
      margin: '8px 0', 
      background: getBackgroundColor(),
      borderRadius: '4px',
      cursor: 'grab',
      opacity: isDragging ? 0.5 : 1
    }}>
      <strong>{course.id}</strong>
      <div style={{ fontSize: '12px' }}>{course.name}</div>
      {course.credits > 0 && (
        <div style={{ fontSize: '11px', color: '#666' }}>{course.credits} credits</div>
      )}
    </div>
  );
}

function DraggableCourse({ courseId, course }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('courseId', courseId);
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
    >
      <CourseBlock course={course} isDragging={isDragging} />
    </div>
  );
}

function DroppableSemester({ semesterKey, term, year, courseIds, courses, onDrop }) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const courseId = e.dataTransfer.getData('courseId');
        onDrop(courseId, semesterKey);
      }}
      style={{ 
        border: isOver ? '2px solid #2196f3' : '1px solid #ccc',
        padding: '15px', 
        minWidth: '250px',
        minHeight: '400px',
        background: isOver ? '#f5f5f5' : 'white'
      }}
    >
      <h3>{term} {year}</h3>
      {courseIds.map((courseId, idx) => {
        const course = courses.find(c => c.id === getBaseCourseId(courseId));
        if (!course) return null;
        
        return (
          <DraggableCourse key={`${courseId}-${idx}`} courseId={courseId} course={course} />
        );
      })}
    </div>
  );
}

export default function DegreePlan({ plan, courses, onCourseMove, onAddPreviousSemester }) {
  const semesters = Object.keys(plan).sort((a, b) => {
    const [yearA, termA] = a.split('-');
    const [yearB, termB] = b.split('-');
    
    if (yearA !== yearB) {
      return yearA.localeCompare(yearB);
    }
    
    const termOrder = { 'Spring': 0, 'Summer': 1, 'Fall': 2 };
    return termOrder[termA] - termOrder[termB];
  });

  function handleDrop(courseId, targetSemester) {
    // Find source semester
    let sourceSemester = null;
    for (const [semester, courseIds] of Object.entries(plan)) {
      if (courseIds.includes(courseId)) {
        sourceSemester = semester;
        break;
      }
    }

    if (sourceSemester && sourceSemester !== targetSemester) {
      onCourseMove(courseId, sourceSemester, targetSemester);
    }
  }

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', overflowX: 'auto', alignItems: 'flex-start' }}>
      <button 
        onClick={onAddPreviousSemester}
        style={{
          padding: '10px 15px',
          background: '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          minWidth: '150px',
          height: 'fit-content',
          marginTop: '45px'
        }}
      >
        + Add Previous Semester
      </button>
      {semesters.map(semesterKey => {
        const [year, term] = semesterKey.split('-');
        const courseIds = plan[semesterKey];
        
        return (
          <DroppableSemester
            key={semesterKey}
            semesterKey={semesterKey}
            term={term}
            year={year}
            courseIds={courseIds}
            courses={courses}
            onDrop={handleDrop}
          />
        );
      })}
    </div>
  );
}