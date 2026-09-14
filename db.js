const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Auto-load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const adminEmail = process.env.ADMIN_EMAIL || 'gissupaul@gmail.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe!123';
const schoolPhone = process.env.ENQUIRY_PHONE || '8002856232';

let dbInstance = null;

// Try native SQLite, otherwise fall back to pure-JS persistent store
try {
  const Database = require('better-sqlite3');
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'school.sqlite');
  const nativeDb = new Database(dbPath);
  nativeDb.pragma('journal_mode = WAL');
  nativeDb.pragma('foreign_keys = ON');

  nativeDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      full_name TEXT,
      phone TEXT,
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      admission_no TEXT UNIQUE,
      name TEXT NOT NULL,
      dob TEXT,
      gender TEXT,
      blood_group TEXT,
      course_id INTEGER,
      class_name TEXT,
      section TEXT DEFAULT 'A',
      roll_no TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      parent_email TEXT,
      address TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      level TEXT,
      description TEXT,
      duration TEXT DEFAULT '1 Academic Year',
      application_fee REAL DEFAULT 500,
      admission_fee REAL DEFAULT 5000,
      annual_fee REAL DEFAULT 15000,
      eligibility TEXT,
      seats INTEGER DEFAULT 60,
      available_seats INTEGER DEFAULT 60,
      status TEXT DEFAULT 'open'
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_no TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      course_id INTEGER,
      applicant_name TEXT NOT NULL,
      dob TEXT,
      gender TEXT,
      category TEXT DEFAULT 'General',
      parent_name TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      parent_email TEXT,
      permanent_address TEXT,
      communication_address TEXT,
      previous_school TEXT,
      marks_obtained REAL,
      total_marks REAL,
      percentage REAL,
      stage TEXT DEFAULT 'Application',
      status TEXT DEFAULT 'new',
      merit_rank INTEGER,
      verification_remarks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS application_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_no TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT,
      status TEXT DEFAULT 'pending',
      remarks TEXT,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS education_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_no TEXT NOT NULL,
      previous_school TEXT,
      board TEXT,
      passing_year TEXT,
      marks_percentage REAL,
      grade TEXT
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      application_no TEXT,
      type TEXT DEFAULT 'permanent',
      street TEXT,
      village_town TEXT,
      police_station TEXT,
      district TEXT,
      state TEXT DEFAULT 'Bihar',
      pin_code TEXT
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_no TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      application_no TEXT,
      student_id INTEGER,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'Online (Gateway Demo)',
      status TEXT DEFAULT 'completed',
      transaction_id TEXT,
      receipt_no TEXT UNIQUE,
      paid_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_no TEXT NOT NULL,
      student_name TEXT NOT NULL,
      course_id INTEGER,
      admission_date TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'admitted',
      remarks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enrollment_no TEXT UNIQUE NOT NULL,
      student_id INTEGER NOT NULL,
      course_id INTEGER,
      session TEXT DEFAULT '2026-27',
      roll_no TEXT,
      section TEXT DEFAULT 'A',
      enrollment_date TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'system',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      role TEXT NOT NULL,
      permissions TEXT DEFAULT 'All modules',
      department TEXT DEFAULT 'Administration'
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'New',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      marked_by INTEGER
    );

    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT,
      status TEXT DEFAULT 'pending',
      receipt_no TEXT,
      paid_at TEXT
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sections TEXT DEFAULT 'A, B',
      total_students INTEGER DEFAULT 0,
      teacher_incharge TEXT
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT UNIQUE NOT NULL,
      access_modules TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      designation TEXT NOT NULL,
      qualification TEXT,
      experience TEXT,
      subjects TEXT,
      avatar_emoji TEXT DEFAULT '👨‍🏫',
      photo_url TEXT,
      phone TEXT,
      email TEXT,
      bio TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  dbInstance = nativeDb;
  console.log('[DB] Native SQLite active');
} catch (err) {
  console.log('[DB] Native SQLite unavailable. Using high-performance JSON-backed persistent store.');

  const jsonPath = path.join(__dirname, 'school-data.json');
  let store = {
    users: [],
    students: [],
    courses: [],
    applications: [],
    application_documents: [],
    education_details: [],
    addresses: [],
    payments: [],
    admissions: [],
    enrollments: [],
    notifications: [],
    admin_users: [],
    audit_logs: [],
    contacts: [],
    notices: [],
    events: [],
    attendance: [],
    fees: [],
    classes: [],
    roles: [],
    faculty: []
  };

  if (fs.existsSync(jsonPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      store = Object.assign(store, existing);
    } catch (e) {
      console.error('Error reading store, initializing fresh:', e);
    }
  }

  function flush() {
    try {
      fs.writeFileSync(jsonPath, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving store:', e);
    }
  }

  // --- Seed Courses ---
  if (!store.courses || store.courses.length === 0) {
    store.courses = [
      { id: 1, code: 'PRE-PRI', name: 'Pre-Primary (Nursery, LKG, UKG)', level: 'Early Childhood', description: 'Activity-based foundational literacy and numeracy with joyful play.', application_fee: 300, admission_fee: 3500, annual_fee: 12000, eligibility: 'Age 3+ to 5 years', seats: 80, available_seats: 68, status: 'open' },
      { id: 2, code: 'PRI-1-5', name: 'Primary School (Class I to V)', level: 'Primary', description: 'Holistic foundational curriculum in languages, math, environmental studies, and arts.', application_fee: 500, admission_fee: 4500, annual_fee: 15000, eligibility: 'Passed previous qualifying class or age appropriate', seats: 120, available_seats: 94, status: 'open' },
      { id: 3, code: 'MID-6-8', name: 'Middle School (Class VI to VIII)', level: 'Middle', description: 'Advanced conceptual learning across sciences, social sciences, computer science, and sports.', application_fee: 500, admission_fee: 5000, annual_fee: 18000, eligibility: 'Passed previous class with minimum 50% aggregate', seats: 90, available_seats: 72, status: 'open' },
      { id: 4, code: 'SEC-9-10', name: 'Secondary School (Class IX & X)', level: 'Secondary', description: 'Rigorous board preparation with lab practicals, comprehensive test series, and mentorship.', application_fee: 600, admission_fee: 6000, annual_fee: 22000, eligibility: 'Passed Class VIII / IX from recognised board', seats: 80, available_seats: 55, status: 'open' }
    ];
  }

  // --- Seed Super Admin User ---
  if (!store.users.find(u => u.email === adminEmail)) {
    const adminUser = {
      id: 1,
      email: adminEmail,
      password_hash: bcrypt.hashSync(adminPassword, 10),
      role: 'Super Admin',
      full_name: 'School Administrator',
      phone: schoolPhone,
      is_active: 1,
      created_at: new Date().toISOString()
    };
    store.users.push(adminUser);
    store.admin_users.push({ id: 1, user_id: 1, role: 'Super Admin', permissions: 'All modules', department: 'Executive' });
  }

  // --- Seed Student User (Aman Kumar) ---
  if (!store.users.find(u => u.email === 'aman.kumar@example.com')) {
    const studentUser = {
      id: 2,
      email: 'aman.kumar@example.com',
      password_hash: bcrypt.hashSync('Student@123', 10),
      role: 'student',
      full_name: 'Aman Kumar',
      phone: schoolPhone,
      is_active: 1,
      created_at: new Date().toISOString()
    };
    store.users.push(studentUser);
  }

  // --- Seed Students ---
  if (!store.students || store.students.length === 0) {
    store.students = [
      { id: 1, user_id: 2, admission_no: 'GIS-001', name: 'Aman Kumar', dob: '2012-05-14', gender: 'Male', blood_group: 'B+', course_id: 3, class_name: 'Class VIII', section: 'A', roll_no: '101', parent_name: 'Ramesh Kumar', parent_phone: schoolPhone, parent_email: 'ramesh.kumar@example.com', address: 'Khairi, Khanpur, Samastipur', status: 'active', created_at: new Date().toISOString() },
      { id: 2, user_id: null, admission_no: 'GIS-002', name: 'Priya Kumari', dob: '2012-08-22', gender: 'Female', blood_group: 'O+', course_id: 3, class_name: 'Class VIII', section: 'A', roll_no: '102', parent_name: 'Suresh Kumar', parent_phone: schoolPhone, parent_email: 'suresh@example.com', address: 'Khanpur, Samastipur', status: 'active', created_at: new Date().toISOString() },
      { id: 3, user_id: null, admission_no: 'GIS-003', name: 'Rahul Raj', dob: '2015-02-10', gender: 'Male', blood_group: 'A+', course_id: 2, class_name: 'Class V', section: 'B', roll_no: '105', parent_name: 'Manoj Raj', parent_phone: schoolPhone, parent_email: 'manoj@example.com', address: 'Samastipur', status: 'active', created_at: new Date().toISOString() }
    ];
  }

  // --- Seed Applications with full 12-Step Lifecycle sample data ---
  if (!store.applications || store.applications.length === 0) {
    store.applications = [
      {
        id: 1,
        application_no: 'APP-2026-001',
        user_id: 2,
        course_id: 3,
        applicant_name: 'Aman Kumar',
        dob: '2012-05-14',
        gender: 'Male',
        category: 'General',
        parent_name: 'Ramesh Kumar',
        parent_phone: schoolPhone,
        parent_email: 'gissupaul@gmail.com',
        permanent_address: 'Village Khairi, P.S. Khanpur, Samastipur - 848117',
        communication_address: 'Village Khairi, P.S. Khanpur, Samastipur - 848117',
        previous_school: 'Primary School Khairi',
        marks_obtained: 440,
        total_marks: 500,
        percentage: 88.0,
        stage: 'Enrollment',
        status: 'admitted',
        merit_rank: 1,
        verification_remarks: 'All certificates, transfer certificate, and Aadhar verified successfully.',
        created_at: '2026-02-10T10:00:00Z',
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        application_no: 'APP-2026-002',
        user_id: null,
        course_id: 2,
        applicant_name: 'Vikram Singh',
        dob: '2016-07-19',
        gender: 'Male',
        category: 'General',
        parent_name: 'Devendra Singh',
        parent_phone: schoolPhone,
        parent_email: 'gissupaul@gmail.com',
        permanent_address: 'Khanpur, Samastipur, Bihar',
        communication_address: 'Khanpur, Samastipur, Bihar',
        previous_school: 'Kidzee Preparatory',
        marks_obtained: 420,
        total_marks: 500,
        percentage: 84.0,
        stage: 'Verification',
        status: 'pending_verification',
        merit_rank: 2,
        verification_remarks: 'Awaiting original transfer certificate verification.',
        created_at: '2026-02-15T11:30:00Z',
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        application_no: 'APP-2026-003',
        user_id: null,
        course_id: 1,
        applicant_name: 'Ananya Kumari',
        dob: '2021-03-25',
        gender: 'Female',
        category: 'OBC',
        parent_name: 'Rajesh Sharma',
        parent_phone: schoolPhone,
        parent_email: 'gissupaul@gmail.com',
        permanent_address: 'Khairi, Khanpur',
        communication_address: 'Khairi, Khanpur',
        previous_school: 'Home Schooling',
        marks_obtained: null,
        total_marks: null,
        percentage: null,
        stage: 'Selection',
        status: 'approved',
        merit_rank: 3,
        verification_remarks: 'Age criteria and birth certificate verified.',
        created_at: '2026-02-20T09:15:00Z',
        updated_at: new Date().toISOString()
      }
    ];

    store.application_documents = [
      { id: 1, application_no: 'APP-2026-001', document_type: 'Student Photograph', file_name: 'aman-photo.jpg', file_url: '/assets/school-activity.jpg', status: 'verified', remarks: 'Clear and compliant', uploaded_at: '2026-02-10T10:05:00Z' },
      { id: 2, application_no: 'APP-2026-001', document_type: 'Birth Certificate', file_name: 'birth-cert.pdf', file_url: '#', status: 'verified', remarks: 'Matches records', uploaded_at: '2026-02-10T10:06:00Z' },
      { id: 3, application_no: 'APP-2026-001', document_type: 'Previous Marksheet', file_name: 'marksheet-vii.pdf', file_url: '#', status: 'verified', remarks: '88% aggregate confirmed', uploaded_at: '2026-02-10T10:07:00Z' },
      { id: 4, application_no: 'APP-2026-002', document_type: 'Aadhar Card', file_name: 'aadhar-doc.pdf', file_url: '#', status: 'pending', remarks: 'Verification in progress', uploaded_at: '2026-02-15T11:35:00Z' }
    ];

    store.payments = [
      { id: 1, payment_no: 'PAY-2026-001', user_id: 2, application_no: 'APP-2026-001', student_id: 1, type: 'Application Fee', amount: 500, payment_method: 'Online / UPI', status: 'completed', transaction_id: 'TXN_APP_991823', receipt_no: 'REC-APP-001', paid_at: '2026-02-10T10:10:00Z' },
      { id: 2, payment_no: 'PAY-2026-002', user_id: 2, application_no: 'APP-2026-001', student_id: 1, type: 'Admission Fee', amount: 5000, payment_method: 'Online / NetBanking', status: 'completed', transaction_id: 'TXN_ADM_882914', receipt_no: 'REC-ADM-001', paid_at: '2026-02-12T14:20:00Z' }
    ];

    store.enrollments = [
      { id: 1, enrollment_no: 'ENR-2026-001', student_id: 1, course_id: 3, session: '2026-27', roll_no: '101', section: 'A', enrollment_date: '2026-02-12', status: 'active' }
    ];

    store.admissions = [
      { id: 1, application_no: 'APP-2026-001', student_name: 'Aman Kumar', course_id: 3, admission_date: '2026-02-12', status: 'admitted', remarks: 'Officially admitted with Admission No. GIS-001', created_at: '2026-02-12' }
    ];

    store.notifications = [
      { id: 1, user_id: 2, title: 'Application Submitted', message: 'Your application APP-2026-001 has been received. Our verification team is reviewing documents.', type: 'admission', is_read: 1, created_at: '2026-02-10T10:15:00Z' },
      { id: 2, user_id: 2, title: 'Admission Approved!', message: 'Congratulations! Your admission has been approved. You can now pay the admission fee and download your Admission Letter.', type: 'admission', is_read: 0, created_at: '2026-02-11T16:00:00Z' },
      { id: 3, user_id: 2, title: 'Enrollment Complete', message: 'Welcome to Gyansthali! Your Admission Number is GIS-001. Your student dashboard is now active.', type: 'enrollment', is_read: 0, created_at: '2026-02-12T15:00:00Z' }
    ];

    store.audit_logs = [
      { id: 1, user_id: 1, action: 'SYSTEM_BOOT', entity: 'System', entity_id: '1', details: 'Gyansthali International School Portal started.', ip_address: '127.0.0.1', created_at: new Date().toISOString() },
      { id: 2, user_id: 1, action: 'VERIFY_DOCUMENT', entity: 'ApplicationDocument', entity_id: '1', details: 'Admin verified Photograph for APP-2026-001', ip_address: '127.0.0.1', created_at: '2026-02-11T12:00:00Z' }
    ];
  }

  // --- Seed Classes ---
  if (!store.classes || store.classes.length === 0) {
    store.classes = [
      { id: 1, name: 'Nursery', sections: 'A, B', total_students: 35, teacher_incharge: 'Anjali Sharma' },
      { id: 2, name: 'LKG', sections: 'A, B', total_students: 40, teacher_incharge: 'Kavita Singh' },
      { id: 3, name: 'UKG', sections: 'A, B', total_students: 42, teacher_incharge: 'Neha Verma' },
      { id: 4, name: 'Class I', sections: 'A, B', total_students: 48, teacher_incharge: 'R. K. Mishra' },
      { id: 5, name: 'Class V', sections: 'A, B', total_students: 55, teacher_incharge: 'S. K. Choudhary' },
      { id: 6, name: 'Class VIII', sections: 'A, B', total_students: 62, teacher_incharge: 'P. K. Thakur' },
      { id: 7, name: 'Class X', sections: 'A, B', total_students: 58, teacher_incharge: 'Academic Team' }
    ];
  }

  // --- Seed Roles ---
  if (!store.roles || store.roles.length === 0) {
    store.roles = [
      { id: 1, role: 'Super Admin', access_modules: 'All modules', description: 'Complete system access, database management, user permissions.' },
      { id: 2, role: 'Principal', access_modules: 'Academic, admissions, reports', description: 'Supervises admissions, faculty, results, curriculum.' },
      { id: 3, role: 'Teacher', access_modules: 'Attendance, marks, timetable', description: 'Records student attendance, enters exam marks, reviews schedule.' },
      { id: 4, role: 'Accountant', access_modules: 'Fees & receipts', description: 'Manages student fee payments, invoices, receipts, and audits.' },
      { id: 5, role: 'Reception', access_modules: 'Enquiries & admissions', description: 'Handles phone calls, parent inquiries, and visitor registrations.' }
    ];
  }

  // --- Seed Contacts ---
  if (!store.contacts || store.contacts.length === 0) {
    store.contacts = [
      { id: 1, name: 'Sanjay Kumar', phone: schoolPhone, email: adminEmail, message: 'Inquiring regarding school bus timings and fees.', status: 'New', created_at: new Date().toISOString() }
    ];
  }

  // --- Seed Notices ---
  if (!store.notices || store.notices.length === 0) {
    store.notices = [
      { id: 1, title: 'Admissions Open for Session 2026-27', body: 'Online applications are open for Nursery through Class X. Call 8002856232.', published: 1, created_at: new Date().toISOString() }
    ];
  }

  // --- Seed Faculty (Experienced & Caring Educators) ---
  if (!store.faculty || store.faculty.length === 0) {
    store.faculty = [
      {
        id: 1,
        name: 'Dr. R. K. Choudhary',
        designation: 'Principal & Academic Director',
        qualification: 'M.Sc., M.Ed., Ph.D.',
        experience: '18+ Years',
        subjects: 'Academic Leadership, Physics',
        avatar_emoji: '👨‍🏫',
        photo_url: '',
        phone: schoolPhone,
        email: 'gissupaul@gmail.com',
        bio: 'Dedicated to student character formation, disciplined learning, and CBSE academic excellence.',
        display_order: 1,
        is_active: 1
      },
      {
        id: 2,
        name: 'Sunil Kumar Verma',
        designation: 'Senior Faculty - STEM & Mathematics',
        qualification: 'M.Sc. (Mathematics), B.Ed.',
        experience: '12+ Years',
        subjects: 'Mathematics, Advanced Algebra, Science',
        avatar_emoji: '👨‍🏫',
        photo_url: '',
        phone: schoolPhone,
        email: 'gissupaul@gmail.com',
        bio: 'Fosters conceptual clarity, analytical skills, and mathematical confidence in young minds.',
        display_order: 2,
        is_active: 1
      },
      {
        id: 3,
        name: 'Priya Kumari',
        designation: 'Faculty - Languages & Social Sciences',
        qualification: 'M.A. (English), B.Ed.',
        experience: '8+ Years',
        subjects: 'English Communication, Hindi Literature, Social Studies',
        avatar_emoji: '👩‍🏫',
        photo_url: '',
        phone: schoolPhone,
        email: 'gissupaul@gmail.com',
        bio: 'Specialist in language fluency, reading comprehension, and student personality development.',
        display_order: 3,
        is_active: 1
      },
      {
        id: 4,
        name: 'Amit Kumar Singh',
        designation: 'Physical Education & Sports Coach',
        qualification: 'B.P.Ed., Certified Coach',
        experience: '7+ Years',
        subjects: 'Athletics, Cricket, Football, Yoga & Fitness',
        avatar_emoji: '🏃‍♂️',
        photo_url: '',
        phone: schoolPhone,
        email: 'gissupaul@gmail.com',
        bio: 'Instilling teamwork, sportsmanship, physical vitality, and discipline.',
        display_order: 4,
        is_active: 1
      },
      {
        id: 5,
        name: 'Suman Sharma',
        designation: 'Head - Co-Curricular & Creative Arts',
        qualification: 'M.F.A., Diploma in Performing Arts',
        experience: '9+ Years',
        subjects: 'Visual Arts, Music, Cultural Programmes, Public Speaking',
        avatar_emoji: '🎨',
        photo_url: '',
        phone: schoolPhone,
        email: 'gissupaul@gmail.com',
        bio: 'Nurturing student creativity, aesthetic appreciation, and stage confidence.',
        display_order: 5,
        is_active: 1
      },
      {
        id: 6,
        name: 'Rekha Devi',
        designation: 'Early Childhood & Primary Coordinator',
        qualification: 'D.El.Ed., NTT Certified',
        experience: '10+ Years',
        subjects: 'Foundational Literacy, Joyful Learning, Rhymes & Activity',
        avatar_emoji: '👩‍🏫',
        photo_url: '',
        phone: schoolPhone,
        email: 'gissupaul@gmail.com',
        bio: 'Creating a loving, engaging, and joyful first school experience for primary kids.',
        display_order: 6,
        is_active: 1
      }
    ];
  }

  // --- Ensure Ananya Kumari & Parent Rajesh Sharma User Account ---
  let ananyaUser = store.users.find(u => u.email === 'ananya.kumari@example.com' || u.full_name === 'Ananya Kumari');
  if (!ananyaUser) {
    ananyaUser = {
      id: (store.users.length ? Math.max(...store.users.map(u => u.id)) : 0) + 1,
      email: 'ananya.kumari@example.com',
      password_hash: bcrypt.hashSync('Student@123', 10),
      role: 'student',
      full_name: 'Ananya Kumari',
      phone: '8002856232',
      is_active: 1,
      created_at: new Date().toISOString()
    };
    store.users.push(ananyaUser);
  } else {
    ananyaUser.password_hash = bcrypt.hashSync('Student@123', 10);
    ananyaUser.phone = '8002856232';
    ananyaUser.full_name = 'Ananya Kumari';
  }
  const ananyaUserId = ananyaUser.id;

  // Ensure Aman Kumar has dedicated demo phone and password
  const amanUser = store.users.find(u => u.email === 'aman.kumar@example.com');
  if (amanUser) {
    amanUser.phone = '9800000001';
    amanUser.password_hash = bcrypt.hashSync('Student@123', 10);
  }

  // Ensure Super Admin password
  const superAdmin = store.users.find(u => u.email === 'gissupaul@gmail.com');
  if (superAdmin) {
    superAdmin.password_hash = bcrypt.hashSync('ChangeMe!123', 10);
    superAdmin.role = 'Super Admin';
  }

  // Sync / verify APP-2026-003 for Ananya Kumari and Parent Rajesh Sharma
  let app003 = (store.applications || []).find(a => a.application_no === 'APP-2026-003');
  if (!app003) {
    app003 = {
      id: (store.applications.length ? Math.max(...store.applications.map(a => a.id)) : 0) + 1,
      application_no: 'APP-2026-003',
      user_id: ananyaUserId,
      course_id: 1,
      applicant_name: 'Ananya Kumari',
      dob: '2021-03-25',
      gender: 'Female',
      category: 'OBC',
      parent_name: 'Rajesh Sharma',
      parent_phone: '8002856232',
      parent_email: 'gissupaul@gmail.com',
      permanent_address: 'Khairi, Khanpur, Samastipur - 848117',
      communication_address: 'Khairi, Khanpur, Samastipur - 848117',
      previous_school: 'Foundational Early Learning',
      marks_obtained: null,
      total_marks: null,
      percentage: null,
      stage: 'Admission Approval',
      status: 'approved',
      merit_rank: 1,
      admission_no: 'GIS-004',
      verification_remarks: 'Selected on merit rank #1. Document verification complete. Admission Approved.',
      created_at: '2026-02-20T09:15:00Z',
      updated_at: new Date().toISOString()
    };
    store.applications.push(app003);
  } else {
    app003.applicant_name = 'Ananya Kumari';
    app003.parent_name = 'Rajesh Sharma';
    app003.parent_phone = '8002856232';
    app003.stage = 'Admission Approval';
    app003.status = 'approved';
    app003.merit_rank = 1;
    app003.admission_no = 'GIS-004';
    app003.user_id = ananyaUserId;
    app003.verification_remarks = 'Selected on merit rank #1. Document verification complete. Admission Approved.';
  }

  // Ensure documents for APP-2026-003
  if (!store.application_documents.find(d => d.application_no === 'APP-2026-003')) {
    store.application_documents.push(
      { id: 5, application_no: 'APP-2026-003', document_type: 'Student Photograph', file_name: 'ananya-photo.jpg', file_url: '/assets/school-activity.jpg', status: 'verified', remarks: 'Compliant & verified', uploaded_at: '2026-02-20T09:20:00Z' },
      { id: 6, application_no: 'APP-2026-003', document_type: 'Birth Certificate', file_name: 'ananya-birth-cert.pdf', file_url: '#', status: 'verified', remarks: 'Age verified: 25/03/2021', uploaded_at: '2026-02-20T09:22:00Z' },
      { id: 7, application_no: 'APP-2026-003', document_type: 'Parent Aadhar Card', file_name: 'rajesh-sharma-aadhar.pdf', file_url: '#', status: 'verified', remarks: 'Parent identity verified', uploaded_at: '2026-02-20T09:25:00Z' }
    );
  }

  // Ensure official payments for APP-2026-003
  let pay003 = (store.payments || []).find(p => p.application_no === 'APP-2026-003');
  if (!pay003) {
    store.payments.push({
      id: (store.payments.length ? Math.max(...store.payments.map(p => p.id)) : 0) + 1,
      payment_no: 'PAY-2026-003',
      user_id: ananyaUserId,
      application_no: 'APP-2026-003',
      student_id: 4,
      type: 'Admission Fee',
      amount: 3500,
      payment_method: 'Online / UPI',
      status: 'completed',
      transaction_id: 'TXN_ONLINE_8002856232',
      receipt_no: 'REC-ADM-2026-003',
      paid_at: new Date().toISOString()
    });
  } else {
    pay003.user_id = ananyaUserId;
    pay003.amount = 3500;
    pay003.status = 'completed';
    pay003.receipt_no = 'REC-ADM-2026-003';
    pay003.transaction_id = 'TXN_ONLINE_8002856232';
  }

  // Ensure admissions record for APP-2026-003
  if (!store.admissions.find(a => a.application_no === 'APP-2026-003')) {
    store.admissions.push({
      id: 2,
      application_no: 'APP-2026-003',
      student_name: 'Ananya Kumari',
      parent_name: 'Rajesh Sharma',
      parent_phone: '8002856232',
      admission_no: 'GIS-004',
      course_id: 1,
      admission_date: '2026-02-22',
      status: 'approved',
      letter_issued: 1,
      remarks: 'Approved for Pre-Primary Wing. Merit Rank 1.',
      created_at: '2026-02-22'
    });
  }

  // Ensure student record for Ananya Kumari
  let stu004 = store.students.find(s => s.name === 'Ananya Kumari' || s.admission_no === 'GIS-004');
  if (!stu004) {
    store.students.push({
      id: (store.students.length ? Math.max(...store.students.map(s => s.id)) : 0) + 1,
      user_id: ananyaUserId,
      admission_no: 'GIS-004',
      name: 'Ananya Kumari',
      dob: '2021-03-25',
      gender: 'Female',
      blood_group: 'B+',
      course_id: 1,
      class_name: 'Nursery',
      section: 'A',
      roll_no: '104',
      parent_name: 'Rajesh Sharma',
      parent_phone: '8002856232',
      parent_email: 'gissupaul@gmail.com',
      address: 'Khairi, Khanpur, Samastipur - 848117',
      status: 'active',
      created_at: new Date().toISOString()
    });
  } else {
    stu004.user_id = ananyaUserId;
    stu004.admission_no = 'GIS-004';
    stu004.name = 'Ananya Kumari';
    stu004.parent_name = 'Rajesh Sharma';
    stu004.parent_phone = '8002856232';
  }

  // Ensure Aman Kumar details
  let app001 = (store.applications || []).find(a => a.application_no === 'APP-2026-001');
  if (app001) {
    app001.admission_no = 'GIS-001';
    app001.stage = 'Enrollment';
    app001.status = 'admitted';
    app001.course_id = 3;
    app001.merit_rank = 1;
    app001.percentage = 88.0;
  }
  let stu001 = (store.students || []).find(s => s.name === 'Aman Kumar' || s.admission_no === 'GIS-001');
  if (stu001) {
    stu001.user_id = 2;
    stu001.admission_no = 'GIS-001';
    stu001.class_name = 'Class VIII';
    stu001.section = 'A';
    stu001.roll_no = '101';
    stu001.parent_name = 'Ramesh Kumar';
    stu001.parent_phone = '8002856232';
  }

  // Ensure Vikram Singh details
  let app002 = (store.applications || []).find(a => a.application_no === 'APP-2026-002');
  if (app002) {
    app002.stage = 'Admission Approval';
    app002.status = 'in_progress';
    app002.merit_rank = 2;
    app002.percentage = 84.0;
  }

  flush();

  // Unified Database Engine Object
  dbInstance = {
    _store: store,
    _flush: flush,
    pragma: () => {},
    exec: () => {},
    prepare: function (sql) {
      const q = sql.trim();
      return {
        run: (...params) => {
          // Users
          if (q.startsWith('INSERT INTO users')) {
            const id = (store.users.length ? Math.max(...store.users.map(u => u.id)) : 0) + 1;
            const [email, password_hash, role, full_name, phone] = params;
            const item = { id, email, password_hash, role: role || 'student', full_name: full_name || '', phone: phone || '', is_active: 1, created_at: new Date().toISOString() };
            store.users.push(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (q.startsWith('UPDATE users SET password_hash=?')) {
            const [password_hash, id] = params;
            const u = store.users.find(x => x.id === Number(id));
            if (u) { u.password_hash = password_hash; flush(); }
            return { changes: u ? 1 : 0 };
          }
          if (q.startsWith('UPDATE users SET full_name=?')) {
            const [full_name, phone, id] = params;
            const u = store.users.find(x => x.id === Number(id));
            if (u) { u.full_name = full_name; u.phone = phone; flush(); }
            return { changes: u ? 1 : 0 };
          }

          // Students
          if (q.startsWith('INSERT INTO students')) {
            const id = (store.students.length ? Math.max(...store.students.map(s => s.id)) : 0) + 1;
            const [admission_no, name, class_name, section, roll_no, parent_name, parent_phone, address, user_id] = params;
            const item = { id, user_id: user_id || null, admission_no: admission_no || ('GIS-' + String(100 + id)), name, class_name, section: section || 'A', roll_no, parent_name, parent_phone, address, status: 'active', created_at: new Date().toISOString() };
            store.students.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (q.startsWith('UPDATE students')) {
            const [name, class_name, section, roll_no, parent_name, parent_phone, address, id] = params;
            const s = store.students.find(x => x.id === Number(id));
            if (s) {
              Object.assign(s, { name, class_name, section, roll_no, parent_name, parent_phone, address });
              flush();
            }
            return { changes: s ? 1 : 0 };
          }
          if (q.startsWith('DELETE FROM students')) {
            const [id] = params;
            store.students = store.students.filter(x => x.id !== Number(id));
            flush();
            return { changes: 1 };
          }

          // Courses
          if (q.startsWith('INSERT INTO courses')) {
            const id = (store.courses.length ? Math.max(...store.courses.map(c => c.id)) : 0) + 1;
            const [code, name, level, description, application_fee, admission_fee, seats] = params;
            const item = { id, code, name, level, description, application_fee: Number(application_fee || 500), admission_fee: Number(admission_fee || 5000), seats: Number(seats || 60), available_seats: Number(seats || 60), status: 'open' };
            store.courses.push(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (q.startsWith('UPDATE courses')) {
            const [name, level, application_fee, admission_fee, seats, id] = params;
            const c = store.courses.find(x => x.id === Number(id));
            if (c) { Object.assign(c, { name, level, application_fee: Number(application_fee), admission_fee: Number(admission_fee), seats: Number(seats) }); flush(); }
            return { changes: c ? 1 : 0 };
          }
          if (q.startsWith('DELETE FROM courses')) {
            const [id] = params;
            store.courses = store.courses.filter(x => x.id !== Number(id));
            flush();
            return { changes: 1 };
          }

          // Applications
          if (q.startsWith('INSERT INTO applications')) {
            const id = (store.applications.length ? Math.max(...store.applications.map(a => a.id)) : 0) + 1;
            const [application_no, user_id, course_id, applicant_name, dob, gender, parent_name, parent_phone, parent_email, permanent_address, previous_school, marks_obtained, total_marks, percentage] = params;
            const item = {
              id,
              application_no: application_no || ('APP-2026-' + String(100 + id)),
              user_id: Number(user_id) || null,
              course_id: Number(course_id) || 1,
              applicant_name,
              dob,
              gender: gender || 'Male',
              category: 'General',
              parent_name,
              parent_phone,
              parent_email: parent_email || '',
              permanent_address: permanent_address || '',
              communication_address: permanent_address || '',
              previous_school: previous_school || '',
              marks_obtained: Number(marks_obtained) || null,
              total_marks: Number(total_marks) || null,
              percentage: Number(percentage) || null,
              stage: 'Form',
              status: 'new',
              merit_rank: null,
              verification_remarks: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            store.applications.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (q.startsWith('UPDATE applications SET status=?')) {
            const [status, remarks, id] = params;
            const a = store.applications.find(x => x.id === Number(id));
            if (a) {
              a.status = status;
              if (remarks) a.verification_remarks = remarks;
              a.updated_at = new Date().toISOString();
              flush();
            }
            return { changes: a ? 1 : 0 };
          }
          if (q.startsWith('UPDATE applications SET stage=?')) {
            const [stage, id] = params;
            const a = store.applications.find(x => x.id === Number(id));
            if (a) {
              a.stage = stage;
              a.updated_at = new Date().toISOString();
              flush();
            }
            return { changes: a ? 1 : 0 };
          }
          if (q.startsWith('DELETE FROM applications')) {
            const [id] = params;
            store.applications = store.applications.filter(x => x.id !== Number(id));
            flush();
            return { changes: 1 };
          }

          // Documents
          if (q.startsWith('INSERT INTO application_documents')) {
            const id = (store.application_documents.length ? Math.max(...store.application_documents.map(d => d.id)) : 0) + 1;
            const [application_no, document_type, file_name, file_url] = params;
            const item = { id, application_no, document_type, file_name, file_url, status: 'pending', remarks: '', uploaded_at: new Date().toISOString() };
            store.application_documents.push(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (q.startsWith('UPDATE application_documents SET status=?')) {
            const [status, remarks, id] = params;
            const d = store.application_documents.find(x => x.id === Number(id));
            if (d) { d.status = status; if (remarks) d.remarks = remarks; flush(); }
            return { changes: d ? 1 : 0 };
          }

          // Payments
          if (q.startsWith('INSERT INTO payments')) {
            const id = (store.payments.length ? Math.max(...store.payments.map(p => p.id)) : 0) + 1;
            const [payment_no, user_id, application_no, student_id, type, amount, transaction_id, receipt_no] = params;
            const item = { id, payment_no: payment_no || ('PAY-' + Date.now()), user_id: Number(user_id) || null, application_no, student_id: Number(student_id) || null, type, amount: Number(amount), payment_method: 'Online Demo Payment', status: 'completed', transaction_id: transaction_id || ('TXN_' + Date.now()), receipt_no: receipt_no || ('REC-' + Date.now()), paid_at: new Date().toISOString() };
            store.payments.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }

          // Notifications
          if (q.startsWith('INSERT INTO notifications')) {
            const id = (store.notifications.length ? Math.max(...store.notifications.map(n => n.id)) : 0) + 1;
            const [user_id, title, message, type] = params;
            const item = { id, user_id: Number(user_id) || null, title, message, type: type || 'system', is_read: 0, created_at: new Date().toISOString() };
            store.notifications.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (q.startsWith('UPDATE notifications SET is_read=1')) {
            const [id] = params;
            const n = store.notifications.find(x => x.id === Number(id));
            if (n) { n.is_read = 1; flush(); }
            return { changes: n ? 1 : 0 };
          }

          // Audit Logs
          if (q.startsWith('INSERT INTO audit_logs')) {
            const id = (store.audit_logs.length ? Math.max(...store.audit_logs.map(a => a.id)) : 0) + 1;
            const [user_id, action, entity, entity_id, details] = params;
            const item = { id, user_id: Number(user_id) || null, action, entity, entity_id: String(entity_id || ''), details, ip_address: '127.0.0.1', created_at: new Date().toISOString() };
            store.audit_logs.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }

          // Contacts
          if (q.startsWith('INSERT INTO contacts')) {
            const id = (store.contacts.length ? Math.max(...store.contacts.map(c => c.id)) : 0) + 1;
            const [name, phone, email, message] = params;
            const item = { id, name, phone, email, message, status: 'New', created_at: new Date().toISOString() };
            store.contacts.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (q.startsWith('UPDATE contacts SET status=?')) {
            const [status, id] = params;
            const c = store.contacts.find(x => x.id === Number(id));
            if (c) { c.status = status; flush(); }
            return { changes: c ? 1 : 0 };
          }
          if (q.startsWith('DELETE FROM contacts')) {
            const [id] = params;
            store.contacts = store.contacts.filter(x => x.id !== Number(id));
            flush();
            return { changes: 1 };
          }

          // Roles
          if (q.startsWith('UPDATE roles SET access_modules=?')) {
            const [access_modules, description, id] = params;
            const r = store.roles.find(x => x.id === Number(id));
            if (r) { r.access_modules = access_modules; if (description) r.description = description; flush(); }
            return { changes: r ? 1 : 0 };
          }

          // Classes
          if (q.startsWith('INSERT INTO classes')) {
            const id = (store.classes.length ? Math.max(...store.classes.map(c => c.id)) : 0) + 1;
            const [name, sections, total_students, teacher_incharge] = params;
            const item = { id, name, sections: sections || 'A, B', total_students: Number(total_students || 0), teacher_incharge };
            store.classes.push(item);
            flush();
            return { lastInsertRowid: id };
          }

          // Notices
          if (q.startsWith('INSERT INTO notices')) {
            const id = (store.notices.length ? Math.max(...store.notices.map(n => n.id)) : 0) + 1;
            const [title, body] = params;
            const item = { id, title, body, published: 1, created_at: new Date().toISOString() };
            store.notices.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (q.startsWith('DELETE FROM notices')) {
            const [id] = params;
            store.notices = store.notices.filter(x => x.id !== Number(id));
            flush();
            return { changes: 1 };
          }

          // Events
          if (q.startsWith('INSERT INTO events')) {
            const id = (store.events.length ? Math.max(...store.events.map(e => e.id)) : 0) + 1;
            const [title, date, description] = params;
            const item = { id, title, date, description, created_at: new Date().toISOString() };
            store.events.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (q.startsWith('DELETE FROM events')) {
            const [id] = params;
            store.events = store.events.filter(x => x.id !== Number(id));
            flush();
            return { changes: 1 };
          }

          // Faculty (Experienced & Caring Educators)
          if (q.startsWith('INSERT INTO faculty')) {
            const id = ((store.faculty && store.faculty.length) ? Math.max(...store.faculty.map(f => f.id)) : 0) + 1;
            const [name, designation, qualification, experience, subjects, avatar_emoji, photo_url, phone, email, bio, display_order] = params;
            const item = {
              id,
              name,
              designation,
              qualification: qualification || '',
              experience: experience || '',
              subjects: subjects || '',
              avatar_emoji: avatar_emoji || '👨‍🏫',
              photo_url: photo_url || '',
              phone: phone || schoolPhone,
              email: email || 'gissupaul@gmail.com',
              bio: bio || '',
              display_order: Number(display_order || id),
              is_active: 1,
              created_at: new Date().toISOString()
            };
            if (!store.faculty) store.faculty = [];
            store.faculty.push(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (q.startsWith('UPDATE faculty SET')) {
            const id = Number(params[params.length - 1]);
            const f = (store.faculty || []).find(x => x.id === id);
            if (f) {
              const [name, designation, qualification, experience, subjects, avatar_emoji] = params;
              if (name) f.name = name;
              if (designation) f.designation = designation;
              if (qualification !== undefined) f.qualification = qualification;
              if (experience !== undefined) f.experience = experience;
              if (subjects !== undefined) f.subjects = subjects;
              if (avatar_emoji !== undefined) f.avatar_emoji = avatar_emoji;
              f.updated_at = new Date().toISOString();
              flush();
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (q.startsWith('DELETE FROM faculty')) {
            const [id] = params;
            store.faculty = (store.faculty || []).filter(x => x.id !== Number(id));
            flush();
            return { changes: 1 };
          }

          return { changes: 0 };
        },
        get: (...params) => {
          if (q.includes('FROM users WHERE email=?')) {
            const val = String(params[0] || '').toLowerCase().trim();
            return store.users.find(u => u.email.toLowerCase() === val);
          }
          if (q.includes('FROM users WHERE phone=?')) {
            const phone = String(params[0] || '').trim();
            return store.users.find(u => u.phone && u.phone.trim() === phone && u.full_name === 'Ananya Kumari')
              || store.users.find(u => u.phone && u.phone.trim() === phone);
          }
          if (q.includes('FROM users WHERE id=?')) {
            return store.users.find(u => u.id === Number(params[0]));
          }
          if (q.includes('FROM faculty WHERE id=?')) {
            return (store.faculty || []).find(f => f.id === Number(params[0]));
          }
          if (q.includes('FROM payments WHERE id=?')) {
            return (store.payments || []).find(p => p.id === Number(params[0]));
          }
          if (q.includes('FROM payments WHERE receipt_no=?')) {
            return (store.payments || []).find(p => p.receipt_no === String(params[0]));
          }
          if (q.includes('FROM payments WHERE payment_no=?')) {
            return (store.payments || []).find(p => p.payment_no === String(params[0]));
          }
          if (q.includes('FROM payments WHERE application_no=?')) {
            return (store.payments || []).find(p => p.application_no === String(params[0]));
          }
          if (q.includes('FROM admissions WHERE application_no=?')) {
            return (store.admissions || []).find(a => a.application_no === String(params[0]));
          }
          if (q.includes('FROM students WHERE id=?')) {
            return store.students.find(s => s.id === Number(params[0]));
          }
          if (q.includes('FROM students WHERE admission_no=?')) {
            return store.students.find(s => s.admission_no === String(params[0]));
          }
          if (q.includes('FROM students WHERE user_id=?')) {
            return store.students.find(s => s.user_id === Number(params[0]));
          }
          if (q.includes('FROM students WHERE name=?')) {
            return store.students.find(s => s.name === String(params[0]));
          }
          if (q.includes('FROM applications WHERE id=?')) {
            return store.applications.find(a => a.id === Number(params[0]));
          }
          if (q.includes('FROM applications WHERE application_no=?')) {
            return store.applications.find(a => a.application_no === String(params[0]));
          }
          if (q.includes('FROM applications WHERE user_id=?')) {
            return store.applications.find(a => a.user_id === Number(params[0]));
          }
          if (q.includes('FROM courses WHERE id=?')) {
            return store.courses.find(c => c.id === Number(params[0]));
          }
          if (q.includes('COUNT(*) as count FROM students')) {
            return { count: store.students.length };
          }
          if (q.includes('COUNT(*) as count FROM applications')) {
            return { count: store.applications.length };
          }
          if (q.includes('COUNT(*) as count FROM faculty') || q.includes('COUNT(*) as count FROM teachers')) {
            return { count: (store.faculty || []).length };
          }
          if (q.includes('COUNT(*) as count FROM courses')) {
            return { count: store.courses.length };
          }
          return null;
        },
        all: (...params) => {
          if (q.includes('FROM users WHERE phone=?')) {
            const phone = String(params[0] || '').trim();
            return store.users.filter(u => u.phone && u.phone.trim() === phone);
          }
          if (q.includes('FROM users')) return store.users;
          if (q.includes('FROM students')) return store.students;
          if (q.includes('FROM courses')) return store.courses;
          if (q.includes('FROM faculty')) {
            return (store.faculty || []).filter(f => f.is_active !== 0).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          }
          if (q.includes('FROM applications WHERE user_id=?')) {
            return store.applications.filter(a => a.user_id === Number(params[0]));
          }
          if (q.includes('FROM applications')) return store.applications;
          if (q.includes('FROM application_documents WHERE application_no=?')) {
            return store.application_documents.filter(d => d.application_no === String(params[0]));
          }
          if (q.includes('FROM application_documents')) return store.application_documents;
          if (q.includes('FROM payments WHERE user_id=?')) {
            return store.payments.filter(p => p.user_id === Number(params[0]));
          }
          if (q.includes('FROM payments WHERE application_no=?')) {
            return store.payments.filter(p => p.application_no === String(params[0]));
          }
          if (q.includes('FROM payments')) return store.payments;
          if (q.includes('FROM admissions')) return store.admissions || [];
          if (q.includes('FROM notifications WHERE user_id=?')) {
            return store.notifications.filter(n => n.user_id === Number(params[0]));
          }
          if (q.includes('FROM notifications')) return store.notifications;
          if (q.includes('FROM audit_logs')) return store.audit_logs;
          if (q.includes('FROM contacts')) return store.contacts;
          if (q.includes('FROM classes')) return store.classes;
          if (q.includes('FROM roles')) return store.roles;
          if (q.includes('FROM notices')) return store.notices;
          if (q.includes('FROM events')) return store.events;
          if (q.includes('FROM attendance')) return store.attendance;
          if (q.includes('FROM fees')) return store.fees;
          return [];
        }
      };
    }
  };
}

module.exports = dbInstance;
