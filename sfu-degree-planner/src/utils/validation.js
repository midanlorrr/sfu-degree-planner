// utils/validation.js

// Helper to convert semester key to a comparable number
// "2024-Fall" -> 20242, "2025-Spring" -> 20250, "2025-Summer" -> 20251
function semesterToNumber(semesterKey) {
  const [year, term] = semesterKey.split('-');
  const termValue = term === 'Spring' ? 0 : term === 'Summer' ? 1 : 2;
  return parseInt(year) * 10 + termValue;
}

// Helper to get all semesters in chronological order
function getSemestersInOrder(plan) {
  return Object.keys(plan).sort((a, b) => semesterToNumber(a) - semesterToNumber(b));
}

// Calculate total credits earned before a given semester
function getCreditsBeforeSemester(semesterKey, plan, courses) {
  const targetNum = semesterToNumber(semesterKey);
  let totalCredits = 0;
  
  for (const [semester, courseIds] of Object.entries(plan)) {
    if (semesterToNumber(semester) < targetNum) {
      courseIds.forEach(courseId => {
        const course = courses.find(c => c.id === courseId);
        if (course) totalCredits += course.credits;
      });
    }
  }
  
  return totalCredits;
}

// Check if all prereqs for a course are satisfied before a semester
function arePrereqsSatisfied(courseId, semesterKey, plan, courses) {
  const course = courses.find(c => c.id === courseId);
  if (!course) return false;
  
  const prereqs = course.prereqs;
  if (prereqs.length === 0) return true;
  
  const targetNum = semesterToNumber(semesterKey);
  const completedCourses = new Set();
  
  // Collect all courses completed before this semester
  for (const [semester, courseIds] of Object.entries(plan)) {
    if (semesterToNumber(semester) < targetNum) {
      courseIds.forEach(id => completedCourses.add(id));
    }
  }
  
  // Check each AND group
  for (const andGroup of prereqs) {
    // At least one course from this OR group must be completed
    const satisfied = andGroup.some(prereqId => completedCourses.has(prereqId));
    if (!satisfied) return false;
  }
  
  return true;
}

// Check if course is offered in a given semester
function isOfferedInSemester(courseId, semesterKey, courses) {
  const course = courses.find(c => c.id === courseId);
  if (!course) return false;
  
  const [year, term] = semesterKey.split('-');
  return course.offeringPattern.includes(term);
}

// Check if student has enough credits for a course
function hasEnoughCredits(courseId, semesterKey, plan, courses) {
  const course = courses.find(c => c.id === courseId);
  if (!course || course.minCredits === 0) return true;
  
  const earnedCredits = getCreditsBeforeSemester(semesterKey, plan, courses);
  return earnedCredits >= course.minCredits;
}

// Find all courses that depend on a given course
function findDependentCourses(courseId, courses) {
  const dependents = [];
  
  courses.forEach(course => {
    if (course.prereqs.length === 0) return;
    
    // Check if courseId appears in any of the prereq groups
    for (const andGroup of course.prereqs) {
      if (andGroup.includes(courseId)) {
        dependents.push(course.id);
        break;
      }
    }
  });
  
  return dependents;
}

// Find the next valid semester for a course after a given semester
function findNextValidSemester(courseId, afterSemester, plan, courses) {
  const semestersInOrder = getSemestersInOrder(plan);
  const afterNum = semesterToNumber(afterSemester);
  
  for (const semester of semestersInOrder) {
    if (semesterToNumber(semester) <= afterNum) continue;
    
    if (
      isOfferedInSemester(courseId, semester, courses) &&
      arePrereqsSatisfied(courseId, semester, plan, courses) &&
      hasEnoughCredits(courseId, semester, plan, courses)
    ) {
      return semester;
    }
  }
  
  return null; // No valid semester found
}

// Main validation and cascade function
export function validateAndCascade(courseId, sourceSemester, targetSemester, currentPlan, courses) {
  // Don't process if source and target are the same
  if (sourceSemester === targetSemester) {
    return currentPlan;
  }
  
  // Check if the move itself is valid
  if (!isOfferedInSemester(courseId, targetSemester, courses)) {
    console.log(`❌ ${courseId} is not offered in ${targetSemester}`);
    return null;
  }
  
  // Create a temporary plan with the move
  const tempPlan = { ...currentPlan };
  tempPlan[sourceSemester] = tempPlan[sourceSemester].filter(id => id !== courseId);
  tempPlan[targetSemester] = [...tempPlan[targetSemester], courseId];
  
  // Check prereqs in the temporary plan
  if (!arePrereqsSatisfied(courseId, targetSemester, tempPlan, courses)) {
    console.log(`❌ ${courseId} prereqs not satisfied in ${targetSemester}`);
    return null;
  }
  
  // Check credits in the temporary plan
  if (!hasEnoughCredits(courseId, targetSemester, tempPlan, courses)) {
    console.log(`❌ ${courseId} needs more credits for ${targetSemester}`);
    return null;
  }
  
  // Move is valid - now cascade dependent courses
  let finalPlan = { ...tempPlan };
  const processed = new Set([courseId]);
  const toProcess = findDependentCourses(courseId, courses);
  
  while (toProcess.length > 0) {
    const dependentId = toProcess.shift();
    
    if (processed.has(dependentId)) continue;
    processed.add(dependentId);
    
    // Find which semester this dependent is currently in
    let currentSemester = null;
    for (const [semester, courseIds] of Object.entries(finalPlan)) {
      if (courseIds.includes(dependentId)) {
        currentSemester = semester;
        break;
      }
    }
    
    if (!currentSemester) continue;
    
    // Check if dependent still satisfies prereqs in current position
    if (!arePrereqsSatisfied(dependentId, currentSemester, finalPlan, courses)) {
      console.log(`⚠️ ${dependentId} needs to move due to ${courseId} change`);
      
      // Find next valid semester
      const newSemester = findNextValidSemester(dependentId, targetSemester, finalPlan, courses);
      
      if (!newSemester) {
        console.log(`❌ Cannot find valid semester for ${dependentId}`);
        return null; // Cascade failed
      }
      
      // Move the dependent
      finalPlan[currentSemester] = finalPlan[currentSemester].filter(id => id !== dependentId);
      finalPlan[newSemester] = [...finalPlan[newSemester], dependentId];
      
      console.log(`✅ Moved ${dependentId} from ${currentSemester} to ${newSemester}`);
      
      // Add dependents of this course to process queue
      const nextDependents = findDependentCourses(dependentId, courses);
      toProcess.push(...nextDependents);
    }
  }
  
  return finalPlan;
}