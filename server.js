const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const { z } = require('zod');

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

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'gyansthali_secret_jwt_key_khairi_samastipur_2026';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.disable('x-powered-by');

// Allow inline scripts and styles and external resources
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Rate limit auth endpoints
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
}));

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }
});

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET,
    { expiresIn: '24h' }
  );
}

function auth(req, res, next) {
  try {
    let token = '';
    const h = req.headers.authorization || '';
    if (h.startsWith('Bearer ')) {
      token = h.slice(7).trim();
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// --- Health ---
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'Gyansthali International School Portal',
    email: process.env.ADMIN_EMAIL || 'gissupaul@gmail.com',
    phone: process.env.ENQUIRY_PHONE || '8002856232',
    time: new Date().toISOString()
  });
});

// --- Auth Login ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!u || !bcrypt.compareSync(password, u.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials. Default: gissupaul@gmail.com / ChangeMe!123' });
  }
  const token = createToken(u);
  res.cookie('token', token, { httpOnly: true, maxAge: 24 * 3600 * 1000 });
  res.json({
    ok: true,
    token,
    user: { id: u.id, email: u.email, role: u.role }
  });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: req.user });
});

// --- Stats Dashboard ---
app.get('/api/stats', (req, res) => {
  try {
    const students = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    const teachers = db.prepare('SELECT COUNT(*) as count FROM teachers').get().count;
    const admissions = db.prepare('SELECT COUNT(*) as count FROM admissions').get().count;
    const notices = db.prepare('SELECT COUNT(*) as count FROM notices').get().count;
    const events = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
    const contacts = (db.prepare('SELECT * FROM contacts').all() || []).length;
    const today = new Date().toISOString().slice(0, 10);
    const presentToday = db.prepare("SELECT COUNT(*) as count FROM attendance").get(today)?.count || 0;

    res.json({
      students,
      teachers,
      admissions,
      notices,
      events,
      contacts,
      presentToday
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve stats', details: err.message });
  }
});

// --- Student Management (Single + Multiple Entry, Edit, Delete) ---
app.get('/api/students', (req, res) => {
  const rows = db.prepare('SELECT * FROM students ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/students', (req, res) => {
  const s = req.body || {};
  if (!s.name) return res.status(400).json({ error: 'Student name is required' });
  const admNo = s.admission_no || ('GIS-' + String(Date.now()).slice(-4));
  const info = db.prepare(`
    INSERT INTO students(admission_no, name, class_name, section, roll_no, parent_name, parent_phone, address)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    admNo,
    s.name,
    s.class_name || s.className || '',
    s.section || 'A',
    s.roll_no || s.rollNo || '',
    s.parent_name || s.parent || '',
    s.parent_phone || s.phone || '',
    s.address || ''
  );
  const created = db.prepare('SELECT * FROM students WHERE id=?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// Bulk Multiple Students Entry
app.post('/api/students/bulk', (req, res) => {
  const list = req.body?.students || [];
  if (!Array.isArray(list) || list.length === 0) {
    return res.status(400).json({ error: 'Array of students is required' });
  }

  const createdList = [];
  for (const s of list) {
    if (!s.name) continue;
    const admNo = s.admission_no || ('GIS-' + String(Date.now()).slice(-5) + Math.floor(Math.random() * 100));
    const info = db.prepare(`
      INSERT INTO students(admission_no, name, class_name, section, roll_no, parent_name, parent_phone, address)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      admNo,
      s.name,
      s.class_name || s.className || '',
      s.section || 'A',
      s.roll_no || '',
      s.parent_name || s.parent || '',
      s.parent_phone || s.phone || '',
      s.address || ''
    );
    createdList.push(db.prepare('SELECT * FROM students WHERE id=?').get(info.lastInsertRowid));
  }
  res.status(201).json({ ok: true, count: createdList.length, students: createdList });
});

// Edit Student
app.put('/api/students/:id', (req, res) => {
  const s = req.body || {};
  if (!s.name) return res.status(400).json({ error: 'Student name is required' });
  db.prepare(`
    UPDATE students
    SET name=?, class_name=?, section=?, roll_no=?, parent_name=?, parent_phone=?, address=?
    WHERE id=?
  `).run(
    s.name,
    s.class_name || s.className || '',
    s.section || '',
    s.roll_no || '',
    s.parent_name || s.parent || '',
    s.parent_phone || s.phone || '',
    s.address || '',
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM students WHERE id=?').get(req.params.id);
  res.json(updated);
});

// Delete Single Student
app.delete('/api/students/:id', (req, res) => {
  db.prepare('DELETE FROM students WHERE id=?').run(req.params.id);
  res.status(204).end();
});

// Bulk Multiple Students Delete
app.post('/api/students/delete-multiple', (req, res) => {
  const ids = req.body?.ids || [];
  if (Array.isArray(ids)) {
    for (const id of ids) {
      db.prepare('DELETE FROM students WHERE id=?').run(id);
    }
  }
  res.json({ ok: true, deleted: ids.length });
});

// --- Teachers ---
app.get('/api/teachers', (req, res) => {
  res.json(db.prepare('SELECT * FROM teachers ORDER BY id DESC').all());
});

app.post('/api/teachers', (req, res) => {
  const t = req.body || {};
  if (!t.name) return res.status(400).json({ error: 'Teacher name is required' });
  const info = db.prepare('INSERT INTO teachers(name, subject, phone, email, photo_url) VALUES(?, ?, ?, ?, ?)')
    .run(t.name, t.subject || t.role || '', t.phone || '', t.email || '', t.photo_url || '');
  res.status(201).json(db.prepare('SELECT * FROM teachers WHERE id=?').get(info.lastInsertRowid));
});

app.delete('/api/teachers/:id', (req, res) => {
  db.prepare('DELETE FROM teachers WHERE id=?').run(req.params.id);
  res.status(204).end();
});

// --- Admissions & Application Workflow ---
// Stages: Enquiry -> Form -> Documents -> Verification -> Interview -> Approved -> Admission No.
app.get('/api/admissions', (req, res) => {
  res.json(db.prepare('SELECT * FROM admissions ORDER BY id DESC').all());
});

app.post('/api/admissions', (req, res) => {
  const raw = req.body || {};
  const student_name = raw.student_name || raw.student || '';
  const parent_name = raw.parent_name || raw.parent || '';
  const phone = raw.phone || '';
  const email = raw.email || '';
  const class_name = raw.class_name || raw.className || raw.class || '';
  const session = raw.session || '2026-27';
  const message = raw.message || '';

  if (!student_name || !parent_name || !phone) {
    return res.status(400).json({ error: 'Student name, parent name, and contact number are required' });
  }

  const info = db.prepare(`
    INSERT INTO admissions(student_name, parent_name, phone, email, class_name, session, message)
    VALUES(?, ?, ?, ?, ?, ?, ?)
  `).run(student_name, parent_name, phone, email, class_name, session, message);

  res.status(201).json({
    ok: true,
    id: info.lastInsertRowid,
    message: 'Admission enquiry received successfully'
  });
});

app.patch('/api/admissions/:id/status', (req, res) => {
  const status = String(req.body?.status || 'new').toLowerCase();
  db.prepare('UPDATE admissions SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ ok: true, status });
});

// Update Application Workflow Stage
app.patch('/api/admissions/:id/stage', (req, res) => {
  const stage = String(req.body?.stage || 'Enquiry');
  const validStages = ['Enquiry', 'Form', 'Documents', 'Verification', 'Interview', 'Approved', 'Admission No.'];
  if (!validStages.includes(stage)) {
    return res.status(400).json({ error: 'Invalid workflow stage. Must be one of: ' + validStages.join(', ') });
  }
  db.prepare('UPDATE admissions SET stage=? WHERE id=?').run(stage, req.params.id);
  res.json({ ok: true, stage });
});

// Generate Final Admission Number for Approved Student
app.post('/api/admissions/:id/generate-admission-no', (req, res) => {
  const adm = db.prepare('SELECT * FROM admissions').all().find(a => a.id === Number(req.params.id));
  if (!adm) return res.status(404).json({ error: 'Applicant not found' });

  const newAdmNo = 'GIS-' + String(Date.now()).slice(-4);
  db.prepare(`
    INSERT INTO students(admission_no, name, class_name, section, roll_no, parent_name, parent_phone, address)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)
  `).run(newAdmNo, adm.student_name, adm.class_name, 'A', '10' + (adm.id % 90), adm.parent_name, adm.phone, 'Khairi, Khanpur');

  db.prepare('UPDATE admissions SET stage=?, status=? WHERE id=?').run('Admission No.', 'admitted', req.params.id);

  res.json({ ok: true, admission_no: newAdmNo, message: `Admitted as ${newAdmNo}` });
});

app.delete('/api/admissions/:id', (req, res) => {
  db.prepare('DELETE FROM admissions WHERE id=?').run(req.params.id);
  res.status(204).end();
});

// --- Contact Enquiries Dashboard ---
app.get('/api/contacts', (req, res) => {
  res.json(db.prepare('SELECT * FROM contacts ORDER BY id DESC').all());
});

app.post('/api/contacts', (req, res) => {
  const { name, phone, email, message } = req.body || {};
  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Name, phone, and message are required' });
  }
  const info = db.prepare('INSERT INTO contacts(name, phone, email, message) VALUES(?, ?, ?, ?)')
    .run(name, phone, email || '', message);
  res.status(201).json({ ok: true, id: info.lastInsertRowid, message: 'Message sent to school office!' });
});

app.patch('/api/contacts/:id/status', (req, res) => {
  const status = String(req.body?.status || 'Responded');
  db.prepare('UPDATE contacts SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ ok: true, status });
});

app.delete('/api/contacts/:id', (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id=?').run(req.params.id);
  res.status(204).end();
});

// --- Classes & Sections ---
app.get('/api/classes', (req, res) => {
  res.json(db.prepare('SELECT * FROM classes ORDER BY id ASC').all());
});

app.post('/api/classes', (req, res) => {
  const { name, sections, total_students, teacher_incharge } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Class name required' });
  const info = db.prepare('INSERT INTO classes(name, sections, total_students, teacher_incharge) VALUES(?, ?, ?, ?)')
    .run(name, sections || 'A, B', total_students || 0, teacher_incharge || 'Faculty');
  res.status(201).json({ id: info.lastInsertRowid, message: 'Class added' });
});

// --- User Roles & Permissions (Editable) ---
app.get('/api/roles', (req, res) => {
  res.json(db.prepare('SELECT * FROM roles ORDER BY id ASC').all());
});

app.put('/api/roles/:id', (req, res) => {
  const { access_modules, description } = req.body || {};
  if (!access_modules) return res.status(400).json({ error: 'access_modules is required' });
  db.prepare('UPDATE roles SET access_modules=?, description=? WHERE id=?')
    .run(access_modules, description || '', req.params.id);
  res.json({ ok: true, message: 'Role permissions updated successfully' });
});

// --- Reports Generation (Student, Attendance, Fee Collection) ---
app.get('/api/reports/students', (req, res) => {
  const students = db.prepare('SELECT * FROM students').all();
  res.json({
    title: 'Student Enrollment Report',
    date: new Date().toISOString().slice(0, 10),
    count: students.length,
    data: students
  });
});

app.get('/api/reports/attendance', (req, res) => {
  const records = db.prepare('SELECT * FROM attendance').all();
  res.json({
    title: 'Attendance Summary Report',
    date: new Date().toISOString().slice(0, 10),
    count: records.length,
    data: records
  });
});

app.get('/api/reports/fees', (req, res) => {
  const fees = db.prepare('SELECT * FROM fees').all();
  const totalAmount = fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  res.json({
    title: 'Fee Collection Audit Report',
    date: new Date().toISOString().slice(0, 10),
    totalRecords: fees.length,
    totalAmount,
    data: fees
  });
});

// --- Notices ---
app.get('/api/notices', (req, res) => {
  res.json(db.prepare('SELECT * FROM notices WHERE published=1 ORDER BY created_at DESC').all());
});

app.post('/api/notices', (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' });
  const info = db.prepare('INSERT INTO notices(title, body, published) VALUES(?, ?, 1)').run(title, body);
  res.status(201).json({ id: info.lastInsertRowid, title, body });
});

app.delete('/api/notices/:id', (req, res) => {
  db.prepare('DELETE FROM notices WHERE id=?').run(req.params.id);
  res.status(204).end();
});

// --- Events ---
app.get('/api/events', (req, res) => {
  res.json(db.prepare('SELECT * FROM events ORDER BY date DESC').all());
});

app.post('/api/events', (req, res) => {
  const { title, date, description } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Title required' });
  const eventDate = date || new Date().toISOString().slice(0, 10);
  const info = db.prepare('INSERT INTO events(title, date, description) VALUES(?, ?, ?)').run(title, eventDate, description || '');
  res.status(201).json({ id: info.lastInsertRowid, title, date: eventDate });
});

app.delete('/api/events/:id', (req, res) => {
  db.prepare('DELETE FROM events WHERE id=?').run(req.params.id);
  res.status(204).end();
});

// --- Attendance ---
app.get('/api/attendance', (req, res) => {
  res.json(db.prepare('SELECT * FROM attendance ORDER BY date DESC').all(req.query.date));
});

app.post('/api/attendance', (req, res) => {
  const { student_id, date, status } = req.body || {};
  if (!student_id || !date || !status) return res.status(400).json({ error: 'Invalid attendance' });
  db.prepare('INSERT INTO attendance(student_id, date, status, marked_by) VALUES(?, ?, ?, 1)')
    .run(student_id, date, status);
  res.json({ ok: true });
});

// --- Fees ---
app.get('/api/fees', (req, res) => {
  res.json(db.prepare('SELECT * FROM fees ORDER BY id DESC').all());
});

app.post('/api/fees', (req, res) => {
  const f = req.body || {};
  if (!f.student_id || !f.amount) return res.status(400).json({ error: 'student_id and amount required' });
  const info = db.prepare('INSERT INTO fees(student_id, amount, due_date, status, receipt_no) VALUES(?, ?, ?, ?, ?)')
    .run(f.student_id, Number(f.amount), f.due_date || '', f.status || 'pending', f.receipt_no || ('REC-' + Date.now().toString().slice(-5)));
  res.status(201).json({ id: info.lastInsertRowid });
});

app.patch('/api/fees/:id/status', (req, res) => {
  const status = String(req.body?.status || 'paid');
  db.prepare('UPDATE fees SET status=?, paid_at=? WHERE id=?').run(status, new Date().toISOString(), req.params.id);
  res.json({ ok: true, status });
});

// --- Portal Student Lookup ---
app.get('/api/portal/student/:query', (req, res) => {
  const q = req.params.query.trim();
  const student = db.prepare('SELECT * FROM students WHERE admission_no=? OR parent_phone=?').get(q);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const attendance = db.prepare('SELECT * FROM attendance WHERE student_id=?').all(student.id);
  const fees = db.prepare('SELECT * FROM fees WHERE student_id=?').all(student.id);
  res.json({ student, attendance, fees });
});

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  maxAge: '1h'
}));

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  Gyansthali International School Portal Ready!`);
  console.log(`  Server: http://localhost:${PORT}`);
  console.log(`  Admin:  ${process.env.ADMIN_EMAIL || 'gissupaul@gmail.com'}`);
  console.log(`  Phone:  ${process.env.ENQUIRY_PHONE || '8002856232'}`);
  console.log(`=================================================`);
});
