export const SPECIAL_COURSES = {
  "COOP": {
    id: "COOP",
    name: "Co-op Work Term",
    credits: 0,
    prereqs: [],
    minCredits: 0,
    offerings: [],
    offeringPattern: ["Fall", "Spring", "Summer"],
    type: "coop"
  },
  "CMPL": {
    id: "CMPL",
    name: "Complementary Elective",
    credits: 3,
    prereqs: [],
    minCredits: 0,
    offerings: [],
    offeringPattern: ["Fall", "Spring", "Summer"],
    type: "elective"
  },
  "MSE 4XX": {
    id: "MSE 4XX",
    name: "Technical Elective",
    credits: 3,
    prereqs: [],
    minCredits: 100,
    offerings: [],
    offeringPattern: ["Fall", "Spring", "Summer"],
    type: "technical-elective"
  },
  "MSE 323": {
    id: "MSE 323",
    name: "Introduction to Fluid Mechanics",
    credits: 4,
    prereqs: [["PHYS 140"], ["MATH 251"]],
    minCredits: 0,
    offerings: [],
    offeringPattern: ["Spring"],
    type: "renamed"
  }
};