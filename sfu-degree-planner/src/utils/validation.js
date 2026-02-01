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

// Check if a semester is a COOP semester
function isCoopSemester(semesterKey, plan) {
  const courses = plan[semesterKey] || [];
  return courses.includes('COOP');
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
function arePrereqsSatisfied(courseId, semesterKey, plan, courses, debug = false) {
  const course = courses.find(c => c.id === courseId);
  if (!course) return false;
  
  const prereqs = course.prereqs;
  if (prereqs.length === 0) return true;
  
  const targetNum = semesterToNumber(semesterKey);
  const completedCourses = new Set();
  
  for (const [semester, courseIds] of Object.entries(plan)) {
    if (semesterToNumber(semester) < targetNum) {
      courseIds.forEach(id => completedCourses.add(id));
    }
  }
  
  if (debug) {
    console.log(`      Completed before ${semesterKey}: ${Array.from(completedCourses).join(', ')}`);
  }
  
  for (const andGroup of prereqs) {
    const satisfied = andGroup.some(prereqId => completedCourses.has(prereqId));
    if (!satisfied) {
      if (debug) {
        console.log(`      Missing: need one of [${andGroup.join(', ')}]`);
      }
      return false;
    }
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

function extendPlanIfNeeded(plan, untilSemester) {
  const semesters = getSemestersInOrder(plan);
  const lastSemester = semesters[semesters.length - 1];
  const [lastYear, lastTerm] = lastSemester.split('-');
  
  const extendedPlan = { ...plan };
  let currentYear = parseInt(lastYear);
  let currentTerm = lastTerm;
  
  // Keep adding semesters until we reach or pass the target
  while (semesterToNumber(`${currentYear}-${currentTerm}`) < semesterToNumber(untilSemester)) {
    // Advance to next semester
    if (currentTerm === 'Spring') currentTerm = 'Summer';
    else if (currentTerm === 'Summer') currentTerm = 'Fall';
    else if (currentTerm === 'Fall') {
      currentTerm = 'Spring';
      currentYear++;
    }
    
    const newSemesterKey = `${currentYear}-${currentTerm}`;
    if (!extendedPlan[newSemesterKey]) {
      extendedPlan[newSemesterKey] = [];
    }
  }
  
  return extendedPlan;
}

// Find the next valid semester for a course after a given semester
function findNextValidSemester(courseId, afterSemester, plan, courses) {
  const [afterYear] = afterSemester.split('-');
  const extendedPlan = extendPlanIfNeeded(plan, `${parseInt(afterYear) + 3}-Fall`);
  
  const semestersInOrder = getSemestersInOrder(extendedPlan);
  const afterNum = semesterToNumber(afterSemester);
  
  const course = courses.find(c => c.id === courseId);
  
  if (!course) {
    console.log(`⚠️ Course ${courseId} not found in course data`);
    return null;
  }
  
  console.log(`\n🔍 Finding semester for ${courseId} after ${afterSemester}`);
  console.log(`   Prereqs: ${JSON.stringify(course.prereqs)}`);
  console.log(`   Offering pattern: ${JSON.stringify(course.offeringPattern)}`);
  
  for (const semester of semestersInOrder) {
    if (semesterToNumber(semester) <= afterNum) continue;
    
    if (isCoopSemester(semester, extendedPlan)) {
      console.log(`   ❌ ${semester} - COOP semester`);
      continue;
    }
    
    const offered = isOfferedInSemester(courseId, semester, courses);
    const prereqsOk = arePrereqsSatisfied(courseId, semester, extendedPlan, courses, true);
    const creditsOk = hasEnoughCredits(courseId, semester, extendedPlan, courses);
    
    console.log(`   Checking ${semester}: offered=${offered}, prereqs=${prereqsOk}, credits=${creditsOk}`);
    
    if (offered && prereqsOk && creditsOk) {
      console.log(`   ✅ Found valid semester: ${semester}`);
      return semester;
    }
  }
  
  console.log(`   ❌ No valid semester found`);
  return null;
}

// utils/validation.js - complete validateAndCascade function

export function validateAndCascade(courseId, sourceSemester, targetSemester, currentPlan, courses, logs = []) {
  if (sourceSemester === targetSemester) {
    return { plan: currentPlan, logs };
  }
  
  // Extend plan to have room for cascades
  let workingPlan = extendPlanIfNeeded(currentPlan, `${new Date().getFullYear() + 10}-Fall`);
  
  // Special handling for COOP moves
  if (courseId === 'COOP') {
    logs.push(`✅ Moving COOP from ${sourceSemester} to ${targetSemester}`);
    
    workingPlan[sourceSemester] = workingPlan[sourceSemester].filter(id => id !== 'COOP');
    const displacedCourses = workingPlan[targetSemester].filter(id => id !== 'COOP');
    workingPlan[targetSemester] = ['COOP'];
    
    for (const displacedId of displacedCourses) {
      logs.push(`⚠️ ${displacedId} displaced by COOP in ${targetSemester}`);
      
      const newSemester = findNextValidSemester(displacedId, targetSemester, workingPlan, courses);
      
      if (!newSemester) {
        logs.push(`❌ Cannot find valid semester for displaced ${displacedId}`);
        return { plan: null, logs };
      }
      
      workingPlan[newSemester] = [...workingPlan[newSemester], displacedId];
      logs.push(`✅ Moved ${displacedId} to ${newSemester}`);
      
      const dependents = findDependentCourses(displacedId, courses);
      for (const depId of dependents) {
        let depCurrentSemester = null;
        for (const [semester, courseIds] of Object.entries(workingPlan)) {
          if (courseIds.includes(depId)) {
            depCurrentSemester = semester;
            break;
          }
        }
        
        if (depCurrentSemester && !arePrereqsSatisfied(depId, depCurrentSemester, workingPlan, courses)) {
          const depNewSemester = findNextValidSemester(depId, newSemester, workingPlan, courses);
          if (!depNewSemester) {
            logs.push(`❌ Cannot cascade ${depId}`);
            return { plan: null, logs };
          }
          
          workingPlan[depCurrentSemester] = workingPlan[depCurrentSemester].filter(id => id !== depId);
          workingPlan[depNewSemester] = [...workingPlan[depNewSemester], depId];
          logs.push(`✅ Cascaded ${depId} from ${depCurrentSemester} to ${depNewSemester}`);
        }
      }
    }
    
    return { plan: workingPlan, logs };
  }
  
  // Regular course move
  if (isCoopSemester(targetSemester, workingPlan)) {
    logs.push(`❌ Cannot move ${courseId} to ${targetSemester} - it's a COOP semester`);
    return { plan: null, logs };
  }
  
  if (!isOfferedInSemester(courseId, targetSemester, courses)) {
    logs.push(`❌ ${courseId} is not offered in ${targetSemester}`);
    return { plan: null, logs };
  }
  
  workingPlan[sourceSemester] = workingPlan[sourceSemester].filter(id => id !== courseId);
  workingPlan[targetSemester] = [...workingPlan[targetSemester], courseId];
  
  if (!arePrereqsSatisfied(courseId, targetSemester, workingPlan, courses)) {
    logs.push(`❌ ${courseId} prereqs not satisfied in ${targetSemester}`);
    return { plan: null, logs };
  }
  
  if (!hasEnoughCredits(courseId, targetSemester, workingPlan, courses)) {
    logs.push(`❌ ${courseId} needs more credits for ${targetSemester}`);
    return { plan: null, logs };
  }
  
  logs.push(`✅ Moving ${courseId} from ${sourceSemester} to ${targetSemester}`);
  
  const processed = new Set([courseId]);
  const toProcess = findDependentCourses(courseId, courses);
  
  while (toProcess.length > 0) {
    const dependentId = toProcess.shift();
    
    if (processed.has(dependentId)) continue;
    processed.add(dependentId);
    
    let currentSemester = null;
    for (const [semester, courseIds] of Object.entries(workingPlan)) {
      if (courseIds.includes(dependentId)) {
        currentSemester = semester;
        break;
      }
    }
    
    if (!currentSemester) continue;
    
    if (!arePrereqsSatisfied(dependentId, currentSemester, workingPlan, courses)) {
      logs.push(`⚠️ ${dependentId} needs to move due to ${courseId} change`);
      
      const newSemester = findNextValidSemester(dependentId, targetSemester, workingPlan, courses);
      
      if (!newSemester) {
        logs.push(`❌ Cannot find valid semester for ${dependentId}`);
        return { plan: null, logs };
      }
      
      workingPlan[currentSemester] = workingPlan[currentSemester].filter(id => id !== dependentId);
      workingPlan[newSemester] = [...workingPlan[newSemester], dependentId];
      
      logs.push(`✅ Moved ${dependentId} from ${currentSemester} to ${newSemester}`);
      
      const nextDependents = findDependentCourses(dependentId, courses);
      toProcess.push(...nextDependents);
    }
  }
  
  return { plan: workingPlan, logs };
}