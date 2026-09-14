const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Auto-load .env if present
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

// Try to load better-sqlite3
try {
  const Database = require('better-sqlite3');
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'school.sqlite');
  const nativeDb = new Database(dbPath);
  nativeDb.pragma('journal_mode = WAL');
  nativeDb.pragma('foreign_keys = ON');

  // Verify it executes
  nativeDb.exec(`
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'admin',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS students(id INTEGER PRIMARY KEY AUTOINCREMENT,admission_no TEXT UNIQUE,name TEXT NOT NULL,class_name TEXT,section TEXT,roll_no TEXT,parent_name TEXT,parent_phone TEXT,address TEXT,status TEXT DEFAULT 'active',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS teachers(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,subject TEXT,phone TEXT,email TEXT,photo_url TEXT,status TEXT DEFAULT 'active',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS admissions(id INTEGER PRIMARY KEY AUTOINCREMENT,student_name TEXT NOT NULL,parent_name TEXT NOT NULL,phone TEXT NOT NULL,email TEXT,class_name TEXT,session TEXT,message TEXT,status TEXT DEFAULT 'new',stage TEXT DEFAULT 'Enquiry',notes TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS attendance(id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER NOT NULL,date TEXT NOT NULL,status TEXT NOT NULL,marked_by INTEGER,UNIQUE(student_id,date),FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS fees(id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER NOT NULL,amount REAL NOT NULL,due_date TEXT,status TEXT DEFAULT 'pending',receipt_no TEXT,paid_at TEXT,FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS notices(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,body TEXT NOT NULL,published INTEGER DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,date TEXT NOT NULL,description TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS contacts(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,phone TEXT NOT NULL,email TEXT,message TEXT NOT NULL,status TEXT DEFAULT 'new',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS classes(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,sections TEXT DEFAULT 'A, B',total_students INTEGER DEFAULT 0,teacher_incharge TEXT);
    CREATE TABLE IF NOT EXISTS roles(id INTEGER PRIMARY KEY AUTOINCREMENT,role TEXT UNIQUE NOT NULL,access_modules TEXT NOT NULL,description TEXT);
  `);

  const u = nativeDb.prepare('SELECT id FROM users WHERE email=?').get(adminEmail);
  if (!u) {
    nativeDb.prepare('INSERT INTO users(email,password_hash,role) VALUES(?,?,?)').run(adminEmail, bcrypt.hashSync(adminPassword, 10), 'Super Admin');
  }

  dbInstance = nativeDb;
  console.log('[DB] Running with native SQLite backend.');
} catch (err) {
  console.warn('[DB] Native SQLite unavailable (' + err.message + '). Using persistent JSON storage engine.');

  // High-performance, zero-dependency persistent JSON store mimicking SQLite
  const jsonPath = path.join(__dirname, 'school-data.json');
  let store = {
    users: [],
    students: [],
    teachers: [],
    admissions: [],
    attendance: [],
    fees: [],
    notices: [],
    events: [],
    contacts: [],
    classes: [],
    roles: []
  };

  if (fs.existsSync(jsonPath)) {
    try {
      store = Object.assign(store, JSON.parse(fs.readFileSync(jsonPath, 'utf8')));
    } catch (e) {
      console.error('Error reading school-data.json, starting fresh:', e);
    }
  }

  function flush() {
    try {
      fs.writeFileSync(jsonPath, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving store to disk:', e);
    }
  }

  // Seed default admin
  if (!store.users.find(u => u.email === adminEmail)) {
    store.users.push({
      id: 1,
      email: adminEmail,
      password_hash: bcrypt.hashSync(adminPassword, 10),
      role: 'Super Admin',
      created_at: new Date().toISOString()
    });
  }

  // Seed students
  if (store.students.length === 0) {
    store.students = [
      { id: 1, admission_no: 'GIS-001', name: 'Aman Kumar', class_name: 'Class VIII', section: 'A', roll_no: '101', parent_name: 'Ramesh Kumar', parent_phone: schoolPhone, address: 'Khairi, Khanpur', status: 'active', created_at: new Date().toISOString() },
      { id: 2, admission_no: 'GIS-002', name: 'Priya Kumari', class_name: 'Class VIII', section: 'A', roll_no: '102', parent_name: 'Suresh Kumar', parent_phone: schoolPhone, address: 'Khanpur, Samastipur', status: 'active', created_at: new Date().toISOString() },
      { id: 3, admission_no: 'GIS-003', name: 'Rahul Raj', class_name: 'Class V', section: 'B', roll_no: '105', parent_name: 'Manoj Raj', parent_phone: schoolPhone, address: 'Samastipur', status: 'active', created_at: new Date().toISOString() }
    ];
  }

  // Seed teachers
  if (store.teachers.length === 0) {
    store.teachers = [
      { id: 1, name: 'Academic Team', subject: 'Administration & Direction', phone: schoolPhone, email: adminEmail, status: 'active', created_at: new Date().toISOString() },
      { id: 2, name: 'Teaching Faculty', subject: 'Science & Mathematics', phone: schoolPhone, email: adminEmail, status: 'active', created_at: new Date().toISOString() },
      { id: 3, name: 'Activity Mentors', subject: 'Sports & Cultural Activities', phone: schoolPhone, email: adminEmail, status: 'active', created_at: new Date().toISOString() }
    ];
  }

  // Seed notices
  if (store.notices.length === 0) {
    store.notices = [
      { id: 1, title: 'Admissions Open for Session 2026-27', body: 'Admissions enquiry is now open for Nursery to Class X. Submit your online form or visit the school office.', published: 1, created_at: new Date().toISOString() },
      { id: 2, title: 'Annual Sports & Cultural Meet', body: 'Participation forms are available with class teachers. All students are encouraged to participate.', published: 1, created_at: new Date().toISOString() }
    ];
  }

  // Seed events
  if (store.events.length === 0) {
    store.events = [
      { id: 1, title: 'Republic Day Celebration', date: '2026-01-26', description: 'Flag hoisting and student march-past.', created_at: new Date().toISOString() },
      { id: 2, title: 'New Session Admissions Enquiry', date: '2026-04-01', description: 'Commencement of session 2026-27.', created_at: new Date().toISOString() }
    ];
  }

  // Seed fees
  if (store.fees.length === 0) {
    store.fees = [
      { id: 1, student_id: 1, amount: 5000, due_date: '2026-04-10', status: 'pending', receipt_no: 'REC-1001', paid_at: null }
    ];
  }

  // Seed attendance
  if (store.attendance.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    store.attendance = [
      { id: 1, student_id: 1, date: today, status: 'present', marked_by: 1 },
      { id: 2, student_id: 2, date: today, status: 'present', marked_by: 1 },
      { id: 3, student_id: 3, date: today, status: 'absent', marked_by: 1 }
    ];
  }

  // Seed classes
  if (store.classes.length === 0) {
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

  // Seed roles
  if (store.roles.length === 0) {
    store.roles = [
      { id: 1, role: 'Super Admin', access_modules: 'All modules', description: 'Complete system access, database management, user permissions.' },
      { id: 2, role: 'Principal', access_modules: 'Academic, admissions, reports', description: 'Supervises admissions, faculty, results, curriculum.' },
      { id: 3, role: 'Teacher', access_modules: 'Attendance, marks, timetable', description: 'Records student attendance, enters exam marks, reviews schedule.' },
      { id: 4, role: 'Accountant', access_modules: 'Fees & receipts', description: 'Manages student fee payments, invoices, receipts, and audits.' },
      { id: 5, role: 'Reception', access_modules: 'Enquiries & admissions', description: 'Handles phone calls, parent inquiries, and visitor registrations.' }
    ];
  }

  flush();

  // Simulated Database Object
  dbInstance = {
    _store: store,
    _flush: flush,
    pragma: () => {},
    exec: () => {},
    prepare: function (sql) {
      const trimmed = sql.trim();
      return {
        run: (...params) => {
          if (trimmed.startsWith('INSERT INTO students')) {
            const id = (store.students.length ? Math.max(...store.students.map(s => s.id)) : 0) + 1;
            const [admission_no, name, class_name, section, roll_no, parent_name, parent_phone, address] = params;
            const item = { id, admission_no: admission_no || ('GIS-' + String(100 + id)), name, class_name, section, roll_no, parent_name, parent_phone, address, status: 'active', created_at: new Date().toISOString() };
            store.students.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (trimmed.startsWith('UPDATE students')) {
            const [name, class_name, section, roll_no, parent_name, parent_phone, address, id] = params;
            const s = store.students.find(x => x.id === Number(id));
            if (s) {
              Object.assign(s, { name, class_name, section, roll_no, parent_name, parent_phone, address });
              flush();
            }
            return { changes: s ? 1 : 0 };
          }
          if (trimmed.startsWith('DELETE FROM students')) {
            const [id] = params;
            store.students = store.students.filter(x => x.id !== Number(id));
            flush();
            return { changes: 1 };
          }
          if (trimmed.startsWith('INSERT INTO teachers')) {
            const id = (store.teachers.length ? Math.max(...store.teachers.map(t => t.id)) : 0) + 1;
            const [name, subject, phone, email, photo_url] = params;
            const item = { id, name, subject, phone, email, photo_url, status: 'active', created_at: new Date().toISOString() };
            store.teachers.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (trimmed.startsWith('DELETE FROM teachers')) {
            const [id] = params;
            store.teachers = store.teachers.filter(x => x.id !== Number(id));
            flush();
            return { changes: 1 };
          }
          if (trimmed.startsWith('INSERT INTO admissions')) {
            const id = (store.admissions.length ? Math.max(...store.admissions.map(a => a.id)) : 0) + 1;
            const [student_name, parent_name, phone, email, class_name, session, message] = params;
            const item = { id, student_name, parent_name, phone, email, class_name, session, message, status: 'new', stage: 'Enquiry', notes: '', created_at: new Date().toISOString() };
            store.admissions.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (trimmed.startsWith('UPDATE admissions SET status=?')) {
            const [status, id] = params;
            const a = store.admissions.find(x => x.id === Number(id));
            if (a) { a.status = status; flush(); }
            return { changes: a ? 1 : 0 };
          }
          if (trimmed.startsWith('UPDATE admissions SET stage=?')) {
            const [stage, id] = params;
            const a = store.admissions.find(x => x.id === Number(id));
            if (a) { a.stage = stage; flush(); }
            return { changes: a ? 1 : 0 };
          }
          if (trimmed.startsWith('DELETE FROM admissions')) {
            const [id] = params;
            store.admissions = store.admissions.filter(x => x.id !== Number(id));
            flush();
            return { changes: 1 };
          }
          if (trimmed.startsWith('INSERT INTO notices')) {
            const id = (store.notices.length ? Math.max(...store.notices.map(n => n.id)) : 0) + 1;
            const [title, body] = params;
            const item = { id, title, body, published: 1, created_at: new Date().toISOString() };
            store.notices.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (trimmed.startsWith('DELETE FROM notices')) {
            const [id] = params;
            store.notices = store.notices.filter(x => x.id !== Number(id));
            flush();
            return { changes: 1 };
          }
          if (trimmed.startsWith('INSERT INTO events')) {
            const id = (store.events.length ? Math.max(...store.events.map(e => e.id)) : 0) + 1;
            const [title, date, description] = params;
            const item = { id, title, date, description, created_at: new Date().toISOString() };
            store.events.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (trimmed.startsWith('DELETE FROM events')) {
            const [id] = params;
            store.events = store.events.filter(x => x.id !== Number(id));
            flush();
            return { changes: 1 };
          }
          if (trimmed.startsWith('INSERT INTO contacts')) {
            const id = (store.contacts.length ? Math.max(...store.contacts.map(c => c.id)) : 0) + 1;
            const [name, phone, email, message] = params;
            const item = { id, name, phone, email, message, status: 'new', created_at: new Date().toISOString() };
            store.contacts.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (trimmed.startsWith('UPDATE contacts SET status=?')) {
            const [status, id] = params;
            const c = store.contacts.find(x => x.id === Number(id));
            if (c) { c.status = status; flush(); }
            return { changes: c ? 1 : 0 };
          }
          if (trimmed.startsWith('DELETE FROM contacts')) {
            const [id] = params;
            store.contacts = store.contacts.filter(x => x.id !== Number(id));
            flush();
            return { changes: 1 };
          }
          if (trimmed.startsWith('INSERT INTO attendance')) {
            const [student_id, date, status, marked_by] = params;
            const existing = store.attendance.find(a => a.student_id === Number(student_id) && a.date === date);
            if (existing) {
              existing.status = status;
              existing.marked_by = marked_by;
            } else {
              const id = (store.attendance.length ? Math.max(...store.attendance.map(a => a.id)) : 0) + 1;
              store.attendance.unshift({ id, student_id: Number(student_id), date, status, marked_by });
            }
            flush();
            return { changes: 1 };
          }
          if (trimmed.startsWith('INSERT INTO fees')) {
            const id = (store.fees.length ? Math.max(...store.fees.map(f => f.id)) : 0) + 1;
            const [student_id, amount, due_date, status, receipt_no] = params;
            const item = { id, student_id: Number(student_id), amount: Number(amount), due_date, status, receipt_no, paid_at: null };
            store.fees.unshift(item);
            flush();
            return { lastInsertRowid: id };
          }
          if (trimmed.startsWith('UPDATE fees SET status=?')) {
            const [status, paid_at, id] = params;
            const f = store.fees.find(x => x.id === Number(id));
            if (f) { f.status = status; f.paid_at = paid_at; flush(); }
            return { changes: f ? 1 : 0 };
          }
          if (trimmed.startsWith('UPDATE roles SET access_modules=?')) {
            const [access_modules, description, id] = params;
            const r = store.roles.find(x => x.id === Number(id));
            if (r) { r.access_modules = access_modules; if (description) r.description = description; flush(); }
            return { changes: r ? 1 : 0 };
          }
          if (trimmed.startsWith('INSERT INTO classes')) {
            const id = (store.classes.length ? Math.max(...store.classes.map(c => c.id)) : 0) + 1;
            const [name, sections, total_students, teacher_incharge] = params;
            const item = { id, name, sections, total_students: Number(total_students || 0), teacher_incharge };
            store.classes.push(item);
            flush();
            return { lastInsertRowid: id };
          }
          return { changes: 0 };
        },
        get: (...params) => {
          if (trimmed.includes('FROM users WHERE email=?')) {
            return store.users.find(u => u.email.toLowerCase() === String(params[0]).toLowerCase());
          }
          if (trimmed.includes('COUNT(*) as count FROM students') || trimmed.includes('COUNT(*) as c FROM students')) {
            return { count: store.students.length, c: store.students.length };
          }
          if (trimmed.includes('COUNT(*) as count FROM teachers') || trimmed.includes('COUNT(*) as c FROM teachers')) {
            return { count: store.teachers.length, c: store.teachers.length };
          }
          if (trimmed.includes('COUNT(*) as count FROM admissions') || trimmed.includes('COUNT(*) as c FROM admissions')) {
            return { count: store.admissions.length, c: store.admissions.length };
          }
          if (trimmed.includes('COUNT(*) as count FROM notices') || trimmed.includes('COUNT(*) as c FROM notices')) {
            return { count: store.notices.length, c: store.notices.length };
          }
          if (trimmed.includes('COUNT(*) as count FROM events') || trimmed.includes('COUNT(*) as c FROM events')) {
            return { count: store.events.length, c: store.events.length };
          }
          if (trimmed.includes('COUNT(*) as count FROM attendance')) {
            const [date] = params;
            const c = store.attendance.filter(a => a.date === date && (a.status || '').toLowerCase() === 'present').length;
            return { count: c };
          }
          if (trimmed.includes('FROM students WHERE id=?')) {
            return store.students.find(s => s.id === Number(params[0]));
          }
          if (trimmed.includes('FROM teachers WHERE id=?')) {
            return store.teachers.find(t => t.id === Number(params[0]));
          }
          if (trimmed.includes('FROM students WHERE admission_no=? OR parent_phone=?')) {
            const q = String(params[0]).toLowerCase();
            return store.students.find(s => (s.admission_no || '').toLowerCase() === q || (s.parent_phone || '') === q || (s.name || '').toLowerCase().includes(q));
          }
          return null;
        },
        all: (...params) => {
          if (trimmed.includes('FROM users')) return store.users;
          if (trimmed.includes('FROM students')) return store.students;
          if (trimmed.includes('FROM teachers')) return store.teachers;
          if (trimmed.includes('FROM admissions')) return store.admissions;
          if (trimmed.includes('FROM notices')) return store.notices;
          if (trimmed.includes('FROM events')) return store.events;
          if (trimmed.includes('FROM contacts')) return store.contacts;
          if (trimmed.includes('FROM classes')) return store.classes;
          if (trimmed.includes('FROM roles')) return store.roles;
          if (trimmed.includes('FROM fees')) {
            return store.fees.map(f => {
              const s = store.students.find(st => st.id === f.student_id) || {};
              return { ...f, name: s.name || 'Student', admission_no: s.admission_no || '', class_name: s.class_name || '' };
            });
          }
          if (trimmed.includes('FROM attendance')) {
            const date = params[0];
            const list = date ? store.attendance.filter(a => a.date === date) : store.attendance;
            return list.map(a => {
              const s = store.students.find(st => st.id === a.student_id) || {};
              return { ...a, name: s.name || 'Student', admission_no: s.admission_no || '', class_name: s.class_name || '' };
            });
          }
          return [];
        }
      };
    }
  };
}

module.exports = dbInstance;
