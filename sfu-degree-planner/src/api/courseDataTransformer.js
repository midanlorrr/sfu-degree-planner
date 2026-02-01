import { parsePrereqs } from './parsePrereqs.js';
import { SPECIAL_COURSES } from '../data/specialCourses.js';

export function transformCourseData(apiCourses) {
  const transformedCourses = apiCourses.map(course => {
    const courseId = `${course.dept} ${course.number}`;
    
    return {
      id: courseId,
      name: course.title,
      credits: parseInt(course.units, 10),
      ...parsePrereqs(course.prerequisites, courseId),
      minCredits: parseMinCredits(course.prerequisites),
      offerings: extractOfferings(course.offerings),
      offeringPattern: extractOfferingPattern(course.offerings)
    };
  });
  
  // Add special courses (COOP, CMPL, MSE 4XX)
  const allCourses = [...transformedCourses, ...Object.values(SPECIAL_COURSES)];

  // Make coreqs bidirectional
  allCourses.forEach(course => {
    if (!course.coreqs) course.coreqs = []; // Initialize if missing
    
    if (course.coreqs.length > 0) {
      course.coreqs.forEach(coreqId => {
        const coreqCourse = allCourses.find(c => c.id === coreqId);
        if (coreqCourse) {
          if (!coreqCourse.coreqs) coreqCourse.coreqs = []; // Initialize if missing
          if (!coreqCourse.coreqs.includes(course.id)) {
            coreqCourse.coreqs.push(course.id);
          }
        }
      });
    }
  });

  // Debug: Check MSE 312 and MSE 381
  const mse312 = allCourses.find(c => c.id === 'MSE 312');
  const mse381 = allCourses.find(c => c.id === 'MSE 381');
  console.log('MSE 312 coreqs:', mse312?.coreqs);
  console.log('MSE 381 coreqs:', mse381?.coreqs);

  return allCourses;
}

function parseMinCredits(prereqString) {
  if (!prereqString) return 0;
  
  // Match patterns like "100 units" or "60 units"
  const match = prereqString.match(/(\d+)\s*units/i);
  return match ? parseInt(match[1], 10) : 0;
}

function extractOfferings(offeringsArray) {
  if (!offeringsArray || offeringsArray.length === 0) return [];
  
  // Convert "Spring 2025" -> "S2025", "Fall 2024" -> "F2024"
  return offeringsArray.map(offering => {
    const term = offering.term;
    const parts = term.split(' ');
    const season = parts[0];
    const year = parts[1];
    
    const seasonCode = season === 'Spring' ? 'S' : 
                       season === 'Fall' ? 'F' : 
                       season === 'Summer' ? 'U' : 
                       season.charAt(0);
    
    return `${seasonCode}${year}`;
  });
}

function extractOfferingPattern(offeringsArray) {
  if (!offeringsArray || offeringsArray.length === 0) return [];
  
  // Extract unique seasons from all offerings
  const seasons = new Set();
  
  offeringsArray.forEach(offering => {
    const term = offering.term;
    const season = term.split(' ')[0];
    seasons.add(season);
  });
  
  return Array.from(seasons);
}