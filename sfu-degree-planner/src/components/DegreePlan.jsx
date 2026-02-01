// components/DegreePlan.jsx
import { useState } from 'react';

function getBaseCourseId(courseId) {
  return courseId.replace(/-\d+$/, "");
}

function CourseBlock({ course, isDragging }) {
  const getBackgroundColor = () => {
    if (course.type === 'coop') return '#e3f2fd';
    if (course.type === 'elective') return '#fff3e0';
    if (course.type === 'technical-elective') return '#ead3ee';
    return '#ecdee8';
  };

  const getCourseUrl = () => {
    if (course.type === 'coop' || course.type === 'elective' || course.type === 'technical-elective') {
      return null;
    }
    const [dept, number] = course.id.split(' ');
    return `https://www.sfu.ca/students/calendar/2026/spring/courses/${dept.toLowerCase()}/${number.toLowerCase()}.html`;
  };

  const courseUrl = getCourseUrl();

  return (
    <div style={{ 
      padding: '10px', 
      margin: '8px 0', 
      background: getBackgroundColor(),
      borderRadius: '8px',
      cursor: 'grab',
      opacity: isDragging ? 0.5 : 1,
      color: '#333',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {courseUrl ? (
        <a 
          href={courseUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: '#667eea', 
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          onClick={(e) => e.stopPropagation()}
        >
          {course.id}
        </a>
      ) : (
        <strong style={{ color: '#667eea' }}>{course.id}</strong>
      )}
      <div style={{ fontSize: '12px', color: '#666' }}>{course.name}</div>
      {course.credits > 0 && (
        <div style={{ fontSize: '11px', color: '#999' }}>{course.credits} credits</div>
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
        border: isOver ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.3)',
        padding: '20px', 
        minWidth: '280px',
        width: '280px',
        minHeight: '450px',
        background: isOver ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.9)',
        borderRadius: '12px',
        flex: '0 0 auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', color: '#667eea', fontSize: '18px', fontWeight: '600' }}>{term} {year}</h3>
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

export default function DegreePlan({ plan, courses, onCourseMove, onAddPreviousSemester, onAddNextSemester }) {
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
    <div 
      ref={(el) => {
        if (el) {
          el.addEventListener('dragover', (e) => {
            const containerRect = el.getBoundingClientRect();
            const scrollSpeed = 10;
            
            if (e.clientX < containerRect.left + 100) {
              el.scrollLeft -= scrollSpeed;
            } else if (e.clientX > containerRect.right - 100) {
              el.scrollLeft += scrollSpeed;
            }
          });
        }
      }}
      style={{ display: 'flex', gap: '20px', padding: '20px', overflowX: 'auto', alignItems: 'flex-start' }}
    >
      <button 
        onClick={onAddPreviousSemester}
        style={{
        padding: '12px 16px',
        background: 'white',
        color: '#667eea',
        border: '2px solid rgba(255,255,255,0.3)',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        minWidth: '180px',
        height: 'fit-content',
        marginTop: '45px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s'
      }}
      onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
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
      <button 
        onClick={onAddNextSemester}
        style={{
          padding: '12px 16px',
          background: 'white',
          color: '#667eea',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          minWidth: '180px',
          height: 'fit-content',
          marginTop: '45px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        + Add Next Semester
      </button>
    </div>
  );
}