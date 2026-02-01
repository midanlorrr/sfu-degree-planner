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
    prereqs: [["MSE 103"], ["MATH 251"]],
    minCredits: 0,
    offerings: [],
    offeringPattern: ["Spring"],
    type: "renamed"
  },
  "MSE 212": {
    id: "MSE 212",
    name: "Mechatronic Design Studio II", 
    credits: 3,
    prereqs: [["MSE 103"], ["MSE 112"]], // From MANUAL_PREREQS it's empty
    minCredits: 0,
    offerings: [],
    offeringPattern: ["Spring"], 
    type: "new-course"
  },
  "MSE 252": {
    id: "MSE 252",
    name: "Fundamentals of Digital Logic and PLCs",
    credits: 3, 
    prereqs: [], // From MANUAL_PREREQS it's empty
    minCredits: 0,
    offerings: [],
    offeringPattern: ["Spring"], 
    type: "new-course"
  },
  "MSE 222": {
    id: "MSE 222",
    name: "Kinematics and Dynamics of Rigid Bodies and Mechanisms", 
    credits: 4, 
    prereqs: [["MSE 103"], ["MATH 251"]], // From MANUAL_PREREQS it's empty
    minCredits: 0,
    offerings: [],
    offeringPattern: ["Spring"],
    type: "updated-prereqs"
  }
};