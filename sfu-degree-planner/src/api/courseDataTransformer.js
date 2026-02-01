import { parsePrereqs } from './parsePrereqs.js';

export function transformCourseData(apiCourses) {
  return apiCourses.map(course => {
    const courseId = `${course.dept} ${course.number}`;
    
    return {
      id: courseId,
      name: course.title,
      credits: parseInt(course.units, 10),
      prereqs: parsePrereqs(course.prerequisites, courseId),
      offerings: extractOfferings(course.offerings)
    };
  });
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
