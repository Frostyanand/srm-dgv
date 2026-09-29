/**
 * SRM Digital Verification Platform (SRM DGV)
 * Master Institutional Hierarchy Seeder
 * 
 * Provisions:
 * 1. 15 Pre-configured SRM Institutional Workflow Templates
 * 2. 4 SRM Computing Departments (CTech, CIntel, NWC, DSBS)
 * 3. School of Computing Directorate (Dean, Chairperson, Associate Chairperson)
 * 4. Heads of Department (HODs)
 * 5. Academic Advisors (AAs)
 * 6. Faculty Advisors (FAs) with Section Gatekeepers
 * 7. Verified Students with linked FAs
 * 8. Cryptographic ECDSA keypairs for every account
 * 
 * Usage:
 *   node scripts/seed_srm_hierarchy.mjs
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env');
  } catch (err) {
    console.warn('Could not auto-load .env file.');
  }
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
privateKey = privateKey.replace(/^"|"$/g, '').replace(/^'|'$/g, '').replace(/\\n/g, '\n');
const masterKey = process.env.MASTER_PRIVATE_KEY_ENCRYPTION_KEY;

if (!projectId || !clientEmail || !privateKey || !masterKey) {
  console.error('\n❌ ERROR: Firebase credentials or MASTER_PRIVATE_KEY_ENCRYPTION_KEY missing from .env!');
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

const DEFAULT_DEMO_PASSWORD = 'SRM#2026Demo';

// 1. 15 College Workflow Templates
const WORKFLOW_TEMPLATES = [
  {
    id: 'od_ml_application',
    name: 'On-Duty (OD) / Medical Leave (ML) Application',
    category: 'Academic',
    description: 'Attendance duty leave for hackathons, paper presentations, symposiums, or certified medical leave.',
    approverRoles: ['FA', 'AA'],
    requiresFA: true
  },
  {
    id: 'bonafide_noc',
    name: 'Bonafide & NOC Certificate Request',
    category: 'Administrative',
    description: 'Official clearance certificate for passport, foreign visa, national competition, or bank loans.',
    approverRoles: ['FA', 'AA', 'HOD'],
    requiresFA: true
  },
  {
    id: 'hackathon_permission',
    name: 'Hackathon Organization Permission (Student Club)',
    category: 'Events',
    description: 'Sanction for student technical clubs to organize inter-college 24h/36h hackathons and code jams.',
    approverRoles: ['FA', 'AA', 'HOD', 'Dean'],
    requiresFA: true
  },
  {
    id: 'overnight_lab_access',
    name: 'Overnight Campus & Lab Access Permission',
    category: 'Campus Facilities',
    description: 'Security clearance for student development teams working overnight in Tech Park computing labs.',
    approverRoles: ['FA', 'AA', 'HOD'],
    requiresFA: true
  },
  {
    id: 'venue_auditorium_booking',
    name: 'Auditorium & Seminar Hall Booking Request',
    category: 'Campus Facilities',
    description: 'Reservation of TP Ganesan Auditorium, Mini Hall, or School of Computing smart seminar rooms.',
    approverRoles: ['FA', 'HOD', 'Chairperson'],
    requiresFA: true
  },
  {
    id: 'canteen_food_approval',
    name: 'Canteen / Campus Food Stall Approval',
    category: 'Campus Facilities',
    description: 'Health, hygiene, and logistics permit for catering meals or setting up food counters during club fests.',
    approverRoles: ['FA', 'AA', 'HOD'],
    requiresFA: true
  },
  {
    id: 'sponsorship_mou',
    name: 'Corporate Sponsorship & Industry MoU Approval',
    category: 'Administrative',
    description: 'Legal and financial vetting of corporate sponsorship contracts and branding tie-ups for college events.',
    approverRoles: ['FA', 'HOD', 'Dean'],
    requiresFA: true
  },
  {
    id: 'campus_stalls',
    name: 'Promotional & Merchandise Stalls Setup',
    category: 'Campus Facilities',
    description: 'Permit for setting up registration desks, club merchandise tables, or sponsor demo kiosks in Tech Park.',
    approverRoles: ['FA', 'AA', 'HOD'],
    requiresFA: true
  },
  {
    id: 'club_general_meeting',
    name: 'Student Club General Body Meeting Permission',
    category: 'Events',
    description: 'Classroom booking and attendance sanction for student society recruitment and core committee meetings.',
    approverRoles: ['FA', 'AA'],
    requiresFA: true
  },
  {
    id: 'campus_marathon_walk',
    name: 'Campus Marathon / Awareness Walk Permission',
    category: 'Events',
    description: 'Campus security, route clearance, and ambulance arrangement for morning student rallies or walks.',
    approverRoles: ['FA', 'HOD', 'Dean'],
    requiresFA: true
  },
  {
    id: 'dj_cultural_session',
    name: 'DJ Night & Cultural Session Clearance',
    category: 'Events',
    description: 'Decibel compliance, timing limits (up to 10 PM), and crowd security permit for student DJ nights.',
    approverRoles: ['FA', 'HOD', 'Chairperson', 'Dean'],
    requiresFA: true
  },
  {
    id: 'industrial_visit',
    name: 'Industrial Visit (IV) Permission',
    category: 'Academic',
    description: 'Formal clearance and faculty escort sanction for class industrial tours to tech firms and IT parks.',
    approverRoles: ['FA', 'AA', 'HOD', 'Dean'],
    requiresFA: true
  },
  {
    id: 'elective_course_change',
    name: 'Course Elective Change / Credit Transfer Request',
    category: 'Academic',
    description: 'Student academic petition for semester elective change, audit courses, or MOOC NPTEL credit transfer.',
    approverRoles: ['FA', 'AA', 'HOD'],
    requiresFA: true
  },
  {
    id: 'grade_reevaluation',
    name: 'Grade Re-evaluation & Answer Script Review',
    category: 'Academic',
    description: 'Formal exam cell application for end-semester subject answer sheet re-assessment and mark verification.',
    approverRoles: ['FA', 'AA', 'HOD'],
    requiresFA: true
  },
  {
    id: 'project_grant_reimbursement',
    name: 'Student Innovation Project Grant / Budget Reimbursement',
    category: 'Administrative',
    description: 'Financial sanction and invoice reimbursement for student hardware prototypes, IoT sensors, and cloud bills.',
    approverRoles: ['FA', 'AA', 'HOD', 'Dean'],
    requiresFA: true
  }
];

// 2. Departments Data
const DEPARTMENTS = [
  {
    id: 'CTech',
    code: 'CTECH',
    name: 'Computing Technologies',
    schoolId: 'SOC',
    school: 'School of Computing',
    hodEmail: 'hod.ctech@srmist.edu.in',
    totalSections: 45
  },
  {
    id: 'CIntel',
    code: 'CINTEL',
    name: 'Computational Intelligence',
    schoolId: 'SOC',
    school: 'School of Computing',
    hodEmail: 'hod.cintel@srmist.edu.in',
    totalSections: 40
  },
  {
    id: 'NWC',
    code: 'NWC',
    name: 'Networking and Communications',
    schoolId: 'SOC',
    school: 'School of Computing',
    hodEmail: 'hod.nwc@srmist.edu.in',
    totalSections: 35
  },
  {
    id: 'DSBS',
    code: 'DSBS',
    name: 'Data Science and Business Systems',
    schoolId: 'SOC',
    school: 'School of Computing',
    hodEmail: 'hod.dsbs@srmist.edu.in',
    totalSections: 35
  }
];

// Helper: Provision user in Firebase Auth and Firestore with ECDSA keypair
async function provisionUser(userDef) {
  const { email, password, name, role, departmentId, designation, section, year, facultyAdvisorEmail } = userDef;

  let uid;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(uid, {
      password,
      displayName: name,
    });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const newUser = await auth.createUser({
        email,
        password,
        displayName: name,
      });
      uid = newUser.uid;
    } else {
      throw err;
    }
  }

  // Assign Custom Claim
  await auth.setCustomUserClaims(uid, {
    role,
    requiresPasswordReset: false,
  });

  // Generate ECDSA Keypair
  const { publicKey, privateKey: userPrivateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // Encrypt Private Key with Master Key
  const kek = crypto.createHash('sha256').update(masterKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);
  let encryptedKey = cipher.update(userPrivateKey, 'utf8', 'hex');
  encryptedKey += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Save in Firestore
  const docData = {
    email,
    name,
    role,
    status: 'ACTIVE',
    departmentId: departmentId || null,
    department: departmentId || null,
    designation: designation || (role === 'SIGNATORY' ? 'Signatory Authority' : role),
    section: section || null,
    year: year || null,
    school: 'School of Computing',
    publicKey,
    encryptedPrivateKey: {
      encryptedKey,
      iv: iv.toString('hex'),
      authTag,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (facultyAdvisorEmail) {
    docData.facultyAdvisorEmail = facultyAdvisorEmail;
  }

  await db.collection('users').doc(uid).set(docData, { merge: true });

  return { uid, email, name, role, designation };
}

async function main() {
  console.log(`\n================================================================`);
  console.log(`🏛️  SRM DIGITAL APPROVAL PLATFORM — INSTITUTIONAL SEEDER`);
  console.log(`================================================================`);

  // 1. Seed Workflow Templates
  console.log(`\n📋 Seeding 15 SRM Workflow Templates...`);
  for (const tpl of WORKFLOW_TEMPLATES) {
    await db.collection('workflow_templates').doc(tpl.id).set({
      ...tpl,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }, { merge: true });
    console.log(`  ✓ [Template] ${tpl.name}`);
  }

  // 2. Seed Departments
  console.log(`\n🏢 Seeding 4 School of Computing Departments...`);
  for (const dept of DEPARTMENTS) {
    await db.collection('departments').doc(dept.id).set({
      ...dept,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }, { merge: true });
    console.log(`  ✓ [Department] ${dept.name} (${dept.id})`);
  }

  // 3. User Definitions
  const USERS_TO_PROVISION = [
    // Super Administrator
    {
      email: 'superadmin@srmist.edu.in',
      password: 'SRM#SecureAdmin2026!',
      name: 'SRM Super Administrator',
      role: 'SUPER_ADMIN',
      designation: 'Chief Platform Administrator'
    },

    // School of Computing Directorate (Level 5 & 4)
    {
      email: 'dean.soc@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. Revathi Venkataraman',
      role: 'SIGNATORY',
      designation: 'Dean, School of Computing'
    },
    {
      email: 'chairperson.soc@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. C. Lakshmi',
      role: 'SIGNATORY',
      designation: 'Chairperson, School of Computing'
    },
    {
      email: 'assoc.chairperson.soc@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. M. Pushpalatha',
      role: 'SIGNATORY',
      designation: 'Associate Chairperson, School of Computing'
    },

    // 1. CTech (Computing Technologies)
    {
      email: 'hod.ctech@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. M. Murali',
      role: 'SIGNATORY',
      departmentId: 'CTech',
      designation: 'Head of Department, CTech'
    },
    {
      email: 'aa.ctech.3rd@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. A. Rajesh',
      role: 'SIGNATORY',
      departmentId: 'CTech',
      designation: 'Academic Advisor (3rd Year), CTech'
    },
    {
      email: 'fa.ctech.secA@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. S. Karthik',
      role: 'SIGNATORY',
      departmentId: 'CTech',
      section: 'Section A',
      designation: 'Faculty Advisor (Section A), CTech'
    },
    {
      email: 'fa.ctech.secB@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. P. Deepa',
      role: 'SIGNATORY',
      departmentId: 'CTech',
      section: 'Section B',
      designation: 'Faculty Advisor (Section B), CTech'
    },
    {
      email: 'dept.ctech@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'CTech Administrative Office',
      role: 'DEPARTMENT_USER',
      departmentId: 'CTech',
      designation: 'Department Office Coordinator'
    },
    {
      email: 'rahul.ctech@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Rahul Sharma',
      role: 'STUDENT',
      departmentId: 'CTech',
      section: 'Section A',
      year: '3rd Year',
      designation: 'Undergraduate Student, B.Tech CSE (CTech)',
      facultyAdvisorEmail: 'fa.ctech.secA@srmist.edu.in'
    },

    // 2. CIntel (Computational Intelligence)
    {
      email: 'hod.cintel@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. R. Annie Uthra',
      role: 'SIGNATORY',
      departmentId: 'CIntel',
      designation: 'Head of Department, CIntel'
    },
    {
      email: 'aa.cintel.3rd@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. K. Senthil',
      role: 'SIGNATORY',
      departmentId: 'CIntel',
      designation: 'Academic Advisor (3rd Year), CIntel'
    },
    {
      email: 'fa.cintel.secA@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. N. Priya',
      role: 'SIGNATORY',
      departmentId: 'CIntel',
      section: 'Section A',
      designation: 'Faculty Advisor (Section A), CIntel'
    },
    {
      email: 'priya.cintel@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Priya Venkatesh',
      role: 'STUDENT',
      departmentId: 'CIntel',
      section: 'Section A',
      year: '2nd Year',
      designation: 'Undergraduate Student, B.Tech CSE (AI & ML)',
      facultyAdvisorEmail: 'fa.cintel.secA@srmist.edu.in'
    },

    // 3. NWC (Networking and Communications)
    {
      email: 'hod.nwc@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. Annapurani Panaiyappan',
      role: 'SIGNATORY',
      departmentId: 'NWC',
      designation: 'Head of Department, NWC'
    },
    {
      email: 'aa.nwc.3rd@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. B. Baranidharan',
      role: 'SIGNATORY',
      departmentId: 'NWC',
      designation: 'Academic Advisor (3rd Year), NWC'
    },
    {
      email: 'fa.nwc.secA@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. T. Manoranjitham',
      role: 'SIGNATORY',
      departmentId: 'NWC',
      section: 'Section A',
      designation: 'Faculty Advisor (Section A), NWC'
    },
    {
      email: 'sneha.nwc@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Sneha Roy',
      role: 'STUDENT',
      departmentId: 'NWC',
      section: 'Section A',
      year: '3rd Year',
      designation: 'Undergraduate Student, B.Tech CSE (Cybersecurity & IoT)',
      facultyAdvisorEmail: 'fa.nwc.secA@srmist.edu.in'
    },

    // 4. DSBS (Data Science and Business Systems)
    {
      email: 'hod.dsbs@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. G. Vadivu',
      role: 'SIGNATORY',
      departmentId: 'DSBS',
      designation: 'Head of Department, DSBS'
    },
    {
      email: 'aa.dsbs.3rd@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. R. Rajkumar',
      role: 'SIGNATORY',
      departmentId: 'DSBS',
      designation: 'Academic Advisor (3rd Year), DSBS'
    },
    {
      email: 'fa.dsbs.secA@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Dr. S. Mohanavalli',
      role: 'SIGNATORY',
      departmentId: 'DSBS',
      section: 'Section A',
      designation: 'Faculty Advisor (Section A), DSBS'
    },
    {
      email: 'arun.dsbs@srmist.edu.in',
      password: DEFAULT_DEMO_PASSWORD,
      name: 'Arun Kumar',
      role: 'STUDENT',
      departmentId: 'DSBS',
      section: 'Section A',
      year: 'Final Year',
      designation: 'Undergraduate Student, B.Tech CSE (Data Science)',
      facultyAdvisorEmail: 'fa.dsbs.secA@srmist.edu.in'
    }
  ];

  console.log(`\n👥 Provisioning Accounts with ECDSA Keypairs...`);
  const provisioned = [];
  const emailToUid = {};

  for (const userDef of USERS_TO_PROVISION) {
    const res = await provisionUser(userDef);
    provisioned.push({ ...userDef, uid: res.uid });
    emailToUid[userDef.email] = res.uid;
    console.log(`  ✓ [${userDef.role.padEnd(15)}] ${userDef.name} (${userDef.email})`);
  }

  // Link student facultyAdvisorId in Firestore
  console.log(`\n🔗 Linking Student FA Gatekeepers in Firestore...`);
  for (const userDef of USERS_TO_PROVISION) {
    if (userDef.role === 'STUDENT' && userDef.facultyAdvisorEmail) {
      const studentUid = emailToUid[userDef.email];
      const faUid = emailToUid[userDef.facultyAdvisorEmail];
      if (studentUid && faUid) {
        await db.collection('users').doc(studentUid).update({
          facultyAdvisorId: faUid,
        });
        console.log(`  ✓ Linked ${userDef.name} → FA: ${userDef.facultyAdvisorEmail} (UID: ${faUid})`);
      }
    }
  }

  console.log(`\n================================================================`);
  console.log(`🎉 SRM INSTITUTIONAL SEEDING COMPLETE!`);
  console.log(`================================================================`);
  console.log(`\nALL DEMO USERS DEFAULT PASSWORD:  ${DEFAULT_DEMO_PASSWORD}`);
  console.log(`SUPERADMIN PASSWORD:              SRM#SecureAdmin2026!`);
  console.log(`URL:                              http://localhost:3000/login\n`);
}

main().catch(err => {
  console.error('\n❌ Seeding failed:', err);
  process.exit(1);
});
