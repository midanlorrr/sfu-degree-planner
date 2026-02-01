import { useState } from 'react';

const fadeIn = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

function getBaseCourseId(courseId) {
  return courseId.replace(/-retake$/, "").replace(/-\d+$/, "");
}

function CourseBlock({ course, isDragging }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const getBackgroundColor = () => {
    if (course.type === 'coop') return '#e3f2fd';
    if (course.type === 'elective') return '#fff3e0';
    if (course.type === 'technical-elective') return '#f3e5f5';
    return '#f0f0f0';
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        padding: '12px', 
        margin: '8px 0', 
        background: getBackgroundColor(),
        borderRadius: '8px',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        color: '#333',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.2s ease'
      }}
    >
      <strong style={{ color: '#333' }}>{course.id}</strong>
      <div style={{ fontSize: '12px', color: '#666' }}>{course.name}</div>
      {course.credits > 0 && (
        <div style={{ fontSize: '11px', color: '#999' }}>{course.credits} credits</div>
      )}
    </div>
  );
}

function DraggableCourse({ courseId, course, isOverridden, onOverride, isFailed, isRetake, onMarkAsFailed, semesterKey }) {
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
      <CourseBlock 
        course={course} 
        courseId={courseId}
        isDragging={isDragging}
        isOverridden={isOverridden}
        onOverride={onOverride}
        isFailed={isFailed}
        isRetake={isRetake}
        onMarkAsFailed={onMarkAsFailed}
        semesterKey={semesterKey}
      />
    </div>
  );
}

function DroppableSemester({ semesterKey, term, year, courseIds, courses, onDrop, overrides, onOverride, failedCourses, onMarkAsFailed, totalCredits }) {
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
        boxShadow: isOver ? '0 8px 24px rgba(102, 126, 234, 0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        transform: isOver ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.3s ease',
        animation: 'fadeIn 0.4s ease-out'
      }}
    >
      <style>{fadeIn}</style>
      <h3 style={{ margin: '0 0 16px 0', color: '#667eea', fontSize: '18px', fontWeight: '600' }}>{term} {year}</h3>
      {courseIds.map((courseId, idx) => {
        const baseCourseId = getBaseCourseId(courseId);
        const course = courses.find(c => c.id === baseCourseId);
        if (!course) return null;
        
        const isRetake = courseId.includes('-retake');
        const isFailed = failedCourses && failedCourses[baseCourseId] && failedCourses[baseCourseId].failedSemester === semesterKey;
        
        return (
          <DraggableCourse 
            key={`${courseId}-${idx}`} 
            courseId={courseId} 
            course={course}
            isOverridden={overrides && overrides[courseId]}
            onOverride={() => onOverride(courseId, semesterKey)}
            isFailed={isFailed}
            isRetake={isRetake}
            onMarkAsFailed={onMarkAsFailed}
            semesterKey={semesterKey}
          />
        );
      })}
      <div style={{ 
        marginTop: '16px', 
        paddingTop: '12px', 
        borderTop: '2px solid rgba(102, 126, 234, 0.2)',
        fontSize: '13px',
        fontWeight: '600',
        color: '#667eea'
      }}>
        Total: {totalCredits} credits
      </div>
    </div>
  );
}

export default function DegreePlan({ plan, courses, onCourseMove, onAddPreviousSemester, onAddNextSemester, overrides, onOverride, failedCourses, onMarkAsFailed }) {
  function getCreditsUpToSemester(targetSemester) {
    let total = 0;
    for (const semester of semesters) {
      const courseIds = plan[semester] || [];
      courseIds.forEach(id => {
        // Remove any suffix like -1, -2 to find the base course
        const baseId = id.replace(/-\d+$/, '');
        const course = courses.find(c => c.id === baseId);
        if (course) total += course.credits;
      });
      if (semester === targetSemester) break;
    }
    return total;
  }
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

  function handleMarkAsFailedLocal(courseId, semesterKey) {
  onMarkAsFailed(courseId, semesterKey);
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
            overrides={overrides}
            onOverride={onOverride}
            failedCourses={failedCourses}
            onMarkAsFailed={handleMarkAsFailedLocal}
            totalCredits={getCreditsUpToSemester(semesterKey)}
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