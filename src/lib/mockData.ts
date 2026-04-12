export interface Job {
  id: string;
  position: string;
  location: string;
  salaryRange: string;
  experience: string;
  qualification: string;
  vacancy: number;
  gender: string;
  jobTime: string;
  responsibilities: string;
  status: "pending" | "approved" | "rejected";
  companyName: string;
  companyEmail: string;
  interviewContact: string;
  postedAt: string;
  industry: string;
  skills: string[];
  description: string;
  benefits: string[];
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  gender: string;
  dob: string;
  mobile: string;
  fatherMobile: string;
  city: string;
  presentAddress: string;
  permanentAddress: string;
  maritalStatus: string;
  languages: string;
  education: EducationEntry[];
  experiences: ExperienceEntry[];
  currentDesignation: string;
  lastSalary: string;
  expectedSalary: string;
  jobInterests: string[];
  registeredAt: string;
  resumeFileName: string;
  familyRefName: string;
  familyRefContact: string;
  friendRefName: string;
  friendRefContact: string;
  isPremium: boolean;
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  year: string;
  percentage: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  designation: string;
  from: string;
  to: string;
  description: string;
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  candidateName: string;
  position: string;
  company: string;
  location: string;
  appliedAt: string;
  status: "applied" | "shortlisted" | "rejected" | "interview";
}

export const mockJobs: Job[] = [
  {
    id: "1",
    position: "Full Stack Developer",
    location: "Mumbai",
    salaryRange: "₹8,00,000 – ₹14,00,000",
    experience: "3-5 years",
    qualification: "B.Tech / MCA",
    vacancy: 2,
    gender: "Any",
    jobTime: "Full Time",
    industry: "Technology",
    skills: ["React", "Node.js", "TypeScript", "MongoDB", "REST APIs"],
    description: "We are looking for a passionate Full Stack Developer to join our growing engineering team. You will be responsible for building and maintaining scalable web applications that serve thousands of users daily.",
    responsibilities: "Develop and maintain web applications using React and Node.js. Collaborate with cross-functional teams to define and implement new features. Ensure code quality through testing and code reviews. Participate in architecture decisions and technical planning. Mentor junior developers.",
    benefits: ["Health Insurance", "Flexible Hours", "Remote Work", "Annual Bonus", "Learning Budget"],
    status: "approved",
    companyName: "TechServe Solutions",
    companyEmail: "hr@techserve.com",
    interviewContact: "Rajesh - 9876543210",
    postedAt: "2026-03-10",
  },
  {
    id: "2",
    position: "Accounts Manager",
    location: "Delhi",
    salaryRange: "₹5,00,000 – ₹8,00,000",
    experience: "2-4 years",
    qualification: "B.Com / M.Com / CA Inter",
    vacancy: 1,
    gender: "Any",
    jobTime: "Full Time",
    industry: "Finance",
    skills: ["Tally", "GST Filing", "Financial Reporting", "Excel", "SAP"],
    description: "Seeking an experienced Accounts Manager to oversee financial operations and ensure compliance with statutory requirements.",
    responsibilities: "Manage financial records, prepare balance sheets and P&L statements. Handle GST filing and compliance. Coordinate with auditors during annual audits. Manage accounts payable and receivable.",
    benefits: ["Health Insurance", "PF", "Annual Bonus"],
    status: "approved",
    companyName: "Krishna Enterprises",
    companyEmail: "accounts@krishnaent.com",
    interviewContact: "Meera - 9988776655",
    postedAt: "2026-03-12",
  },
  {
    id: "3",
    position: "Marketing Executive",
    location: "Pune",
    salaryRange: "₹4,00,000 – ₹6,00,000",
    experience: "1-3 years",
    qualification: "MBA Marketing",
    vacancy: 3,
    gender: "Any",
    jobTime: "Full Time",
    industry: "Marketing",
    skills: ["Digital Marketing", "SEO", "Social Media", "Content Writing", "Google Analytics"],
    description: "Join our dynamic marketing team and help brands grow through innovative digital strategies.",
    responsibilities: "Plan and execute marketing campaigns across digital channels. Manage social media presence and content calendar. Analyze campaign performance and optimize for ROI.",
    benefits: ["Flexible Hours", "Team Outings", "Performance Bonus"],
    status: "approved",
    companyName: "GreenLeaf Marketing",
    companyEmail: "jobs@greenleaf.com",
    interviewContact: "Amit - 9123456789",
    postedAt: "2026-03-14",
  },
  {
    id: "4",
    position: "Customer Support Lead",
    location: "Bangalore",
    salaryRange: "₹3,50,000 – ₹5,50,000",
    experience: "2-3 years",
    qualification: "Any Graduate",
    vacancy: 2,
    gender: "Female",
    jobTime: "Shift Based",
    industry: "Customer Service",
    skills: ["Communication", "CRM Tools", "Problem Solving", "Team Leadership"],
    description: "We need a dedicated Customer Support Lead to manage our growing support team and ensure excellent customer satisfaction.",
    responsibilities: "Lead a team of support executives. Handle escalated customer issues. Develop training programs for new team members. Track and improve CSAT scores.",
    benefits: ["Health Insurance", "Night Shift Allowance", "Transport"],
    status: "approved",
    companyName: "ServiceFirst India",
    companyEmail: "hr@servicefirst.in",
    interviewContact: "Priya - 9876501234",
    postedAt: "2026-03-15",
  },
  {
    id: "5",
    position: "Graphic Designer",
    location: "Ahmedabad",
    salaryRange: "₹3,00,000 – ₹5,00,000",
    experience: "1-2 years",
    qualification: "B.Des / Diploma in Design",
    vacancy: 1,
    gender: "Any",
    jobTime: "Full Time",
    industry: "Design",
    skills: ["Figma", "Adobe Photoshop", "Illustrator", "UI/UX", "Branding"],
    description: "Creative graphic designer needed for our design studio working on diverse client projects.",
    responsibilities: "Create visual assets for marketing campaigns. Design UI elements for web and mobile applications. Maintain brand consistency across all materials.",
    benefits: ["Creative Freedom", "Flexible Hours", "Portfolio Building"],
    status: "pending",
    companyName: "DesignHub Studio",
    companyEmail: "info@designhub.co",
    interviewContact: "Kiran - 9012345678",
    postedAt: "2026-03-16",
  },
  {
    id: "6",
    position: "HR Executive",
    location: "Chennai",
    salaryRange: "₹4,00,000 – ₹6,00,000",
    experience: "2-4 years",
    qualification: "MBA HR",
    vacancy: 1,
    gender: "Any",
    jobTime: "Full Time",
    industry: "Human Resources",
    skills: ["Recruitment", "Employee Engagement", "Payroll", "HRIS", "Compliance"],
    description: "Looking for an HR Executive to manage end-to-end HR operations for our growing team.",
    responsibilities: "Handle end-to-end recruitment. Manage employee onboarding and offboarding. Administer payroll and employee benefits.",
    benefits: ["Health Insurance", "PF", "Professional Development"],
    status: "pending",
    companyName: "PeopleFirst Corp",
    companyEmail: "careers@peoplefirst.com",
    interviewContact: "Sunita - 9345678901",
    postedAt: "2026-03-16",
  },
];

export const mockCandidate: Candidate = {
  id: "c1",
  fullName: "Arjun Sharma",
  email: "arjun@example.com",
  gender: "Male",
  dob: "1995-06-15",
  mobile: "9876543210",
  fatherMobile: "9876543211",
  city: "Mumbai",
  presentAddress: "402, Harmony Apartments, Andheri West, Mumbai 400058",
  permanentAddress: "25, Sector 12, Dwarka, New Delhi 110075",
  maritalStatus: "Single",
  languages: "English, Hindi, Gujarati",
  education: [
    { id: "e1", degree: "B.Tech Computer Science", institution: "IIT Bombay", year: "2017", percentage: "8.5 CGPA" },
    { id: "e2", degree: "HSC (Science)", institution: "DPS New Delhi", year: "2013", percentage: "92%" },
  ],
  experiences: [
    { id: "x1", company: "Infosys Ltd", designation: "Software Developer", from: "2022-01", to: "Present", description: "Building enterprise web applications using React and Java Spring Boot." },
    { id: "x2", company: "TCS", designation: "Junior Developer", from: "2017-07", to: "2021-12", description: "Worked on banking automation projects and internal tools." },
  ],
  currentDesignation: "Software Developer",
  lastSalary: "₹7,00,000",
  expectedSalary: "₹10,00,000",
  jobInterests: ["Technology", "Engineering"],
  registeredAt: "2026-03-01",
  resumeFileName: "Arjun_Sharma_Resume.pdf",
  familyRefName: "Vikram Sharma",
  familyRefContact: "9876543212",
  friendRefName: "Rohit Gupta",
  friendRefContact: "9876543213",
  isPremium: false,
};

export const mockCandidates: Candidate[] = [
  mockCandidate,
  {
    id: "c2",
    fullName: "Radha Patel",
    email: "radha@example.com",
    gender: "Female",
    dob: "1998-02-20",
    mobile: "9123456789",
    fatherMobile: "9123456780",
    city: "Delhi",
    presentAddress: "12, Green Park, New Delhi",
    permanentAddress: "12, Green Park, New Delhi",
    maritalStatus: "Single",
    languages: "English, Hindi",
    education: [
      { id: "e3", degree: "MBA Marketing", institution: "IIM Ahmedabad", year: "2022", percentage: "7.8 CGPA" },
    ],
    experiences: [
      { id: "x3", company: "Ogilvy India", designation: "Marketing Associate", from: "2022-06", to: "Present", description: "Managing digital campaigns for FMCG clients." },
    ],
    currentDesignation: "Marketing Associate",
    lastSalary: "₹4,50,000",
    expectedSalary: "₹6,00,000",
    jobInterests: ["Marketing", "Sales"],
    registeredAt: "2026-03-05",
    resumeFileName: "Radha_Patel_Resume.pdf",
    familyRefName: "Jayesh Patel",
    familyRefContact: "9123456781",
    friendRefName: "Sneha Reddy",
    friendRefContact: "9123456782",
    isPremium: false,
  },
];

export const mockApplications: Application[] = [
  {
    id: "a1",
    candidateId: "c1",
    jobId: "1",
    candidateName: "Arjun Sharma",
    position: "Full Stack Developer",
    company: "TechServe Solutions",
    location: "Mumbai",
    appliedAt: "2026-03-11",
    status: "shortlisted",
  },
  {
    id: "a2",
    candidateId: "c1",
    jobId: "3",
    candidateName: "Arjun Sharma",
    position: "Marketing Executive",
    company: "GreenLeaf Marketing",
    location: "Pune",
    appliedAt: "2026-03-14",
    status: "applied",
  },
  {
    id: "a3",
    candidateId: "c1",
    jobId: "4",
    candidateName: "Arjun Sharma",
    position: "Customer Support Lead",
    company: "ServiceFirst India",
    location: "Bangalore",
    appliedAt: "2026-03-15",
    status: "interview",
  },
  {
    id: "a4",
    candidateId: "c1",
    jobId: "2",
    candidateName: "Arjun Sharma",
    position: "Accounts Manager",
    company: "Krishna Enterprises",
    location: "Delhi",
    appliedAt: "2026-03-13",
    status: "rejected",
  },
];
