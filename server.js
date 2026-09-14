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

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'gyansthali_secret_jwt_key_khairi_samastipur_2026';

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false
}));

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 15 * 1024 * 1024 }
});

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    SECRET,
    { expiresIn: '30d' }
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

function optionalAuth(req, res, next) {
  try {
    let token = '';
    const h = req.headers.authorization || '';
    if (h.startsWith('Bearer ')) token = h.slice(7).trim();
    else if (req.cookies?.token) token = req.cookies.token;
    if (token) req.user = jwt.verify(token, SECRET);
  } catch (e) {}
  next();
}

function audit(userId, action, entity, entityId, details) {
  try {
    db.prepare('INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(userId || 1, action, entity, String(entityId || ''), details || '');
  } catch (e) {}
}

function notify(userId, title, message, type = 'system') {
  try {
    db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)')
      .run(userId, title, message, type);
  } catch (e) {}
}

// ==========================================
// 1. AUTHENTICATION & USER LIFECYCLE
// ==========================================

// Register New Applicant / User
app.post('/api/auth/register', (req, res) => {
  const { full_name, email, phone, password, role } = req.body || {};
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email address, and password are required' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE email=?').get(email.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const userRole = role || 'student';

  const info = db.prepare('INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)')
    .run(email.trim().toLowerCase(), hash, userRole, full_name.trim(), phone || '');

  const user = db.prepare('SELECT id, email, role, full_name, phone FROM users WHERE id=?').get(info.lastInsertRowid);
  const token = createToken(user);
  res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 3600 * 1000 });

  notify(user.id, 'Welcome to Gyansthali Portal', `Hello ${user.full_name}, your account has been created. You can now select a course and submit your application!`, 'system');
  audit(user.id, 'USER_REGISTER', 'User', user.id, `New account registered: ${user.email}`);

  res.status(201).json({ ok: true, token, user, message: 'Registration successful' });
});

// Universal Login (Student, Parent, Admin)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = createToken(user);
  res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 3600 * 1000 });

  audit(user.id, 'USER_LOGIN', 'User', user.id, `User logged in: ${user.email} (${user.role})`);

  res.json({
    ok: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name || 'User',
      phone: user.phone
    }
  });
});

// Change Password (Available to every user)
app.post('/api/auth/change-password', auth, (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!user || !bcrypt.compareSync(current_password, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const newHash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(newHash, req.user.id);

  notify(req.user.id, 'Password Changed', 'Your account password was updated successfully.', 'security');
  audit(req.user.id, 'CHANGE_PASSWORD', 'User', req.user.id, 'Password changed');

  res.json({ ok: true, message: 'Password updated successfully' });
});

// Update Profile
app.put('/api/auth/profile', auth, (req, res) => {
  const { full_name, phone } = req.body || {};
  if (!full_name) return res.status(400).json({ error: 'Full name is required' });

  db.prepare('UPDATE users SET full_name=?, phone=? WHERE id=?').run(full_name, phone || '', req.user.id);
  const updated = db.prepare('SELECT id, email, role, full_name, phone FROM users WHERE id=?').get(req.user.id);

  audit(req.user.id, 'UPDATE_PROFILE', 'User', req.user.id, 'Profile updated');
  res.json({ ok: true, user: updated, message: 'Profile updated successfully' });
});

// Current Authenticated Session & Notifications
app.get('/api/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, email, role, full_name, phone, is_active, created_at FROM users WHERE id=?').get(req.user.id);
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC').all(req.user.id);
  const application = db.prepare('SELECT * FROM applications WHERE user_id=?').get(req.user.id);
  const student = db.prepare('SELECT * FROM students WHERE user_id=?').get(req.user.id);

  res.json({ ok: true, user, notifications, application, student });
});

// ==========================================
// 2. COURSES CATALOG
// ==========================================
app.get('/api/courses', (req, res) => {
  res.json(db.prepare('SELECT * FROM courses ORDER BY id ASC').all());
});

app.post('/api/courses', auth, (req, res) => {
  const { code, name, level, description, application_fee, admission_fee, seats } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Course / Class name is required' });
  const info = db.prepare('INSERT INTO courses (code, name, level, description, application_fee, admission_fee, seats) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(code || ('CRS-' + Date.now().toString().slice(-4)), name, level || 'General', description || '', application_fee || 500, admission_fee || 5000, seats || 60);
  res.status(201).json({ ok: true, id: info.lastInsertRowid, message: 'Course created' });
});

app.put('/api/courses/:id', auth, (req, res) => {
  const { name, level, application_fee, admission_fee, seats } = req.body || {};
  db.prepare('UPDATE courses SET name=?, level=?, application_fee=?, admission_fee=?, seats=? WHERE id=?')
    .run(name, level, application_fee, admission_fee, seats, req.params.id);
  res.json({ ok: true, message: 'Course updated' });
});

app.delete('/api/courses/:id', auth, (req, res) => {
  db.prepare('DELETE FROM courses WHERE id=?').run(req.params.id);
  res.status(204).end();
});

// ==========================================
// 3. APPLICATIONS & 12-STEP LIFECYCLE
// ==========================================

// Submit / Create Application
app.post('/api/applications', optionalAuth, (req, res) => {
  const b = req.body || {};
  if (!b.applicant_name || !b.parent_name || !b.parent_phone) {
    return res.status(400).json({ error: 'Applicant name, parent name, and parent phone are required' });
  }

  const userId = req.user ? req.user.id : (b.user_id || null);
  const appNo = 'APP-2026-' + String(Date.now()).slice(-4);

  const info = db.prepare(`
    INSERT INTO applications (
      application_no, user_id, course_id, applicant_name, dob, gender,
      parent_name, parent_phone, parent_email, permanent_address, previous_school,
      marks_obtained, total_marks, percentage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    appNo,
    userId,
    b.course_id || 1,
    b.applicant_name,
    b.dob || '',
    b.gender || 'Male',
    b.parent_name,
    b.parent_phone,
    b.parent_email || '',
    b.permanent_address || '',
    b.previous_school || '',
    b.marks_obtained || null,
    b.total_marks || null,
    b.percentage || null
  );

  const appItem = db.prepare('SELECT * FROM applications WHERE id=?').get(info.lastInsertRowid);

  if (userId) {
    notify(userId, 'Application Submitted', `Application ${appNo} created. Proceed to upload verification documents.`, 'admission');
    audit(userId, 'APPLICATION_CREATE', 'Application', info.lastInsertRowid, `Application ${appNo} submitted`);
  }

  res.status(201).json({ ok: true, application: appItem, application_no: appNo, message: 'Application created successfully' });
});

// Get My Application
app.get('/api/applications/my', auth, (req, res) => {
  const application = db.prepare('SELECT * FROM applications WHERE user_id=?').get(req.user.id);
  if (!application) return res.status(404).json({ error: 'No application found for this user' });

  const documents = db.prepare('SELECT * FROM application_documents WHERE application_no=?').all(application.application_no);
  const payments = db.prepare('SELECT * FROM payments WHERE application_no=?').all(application.application_no);
  const course = db.prepare('SELECT * FROM courses WHERE id=?').get(application.course_id);

  res.json({ ok: true, application, documents, payments, course });
});

// Admin Applications Query with Filters
app.get('/api/applications', (req, res) => {
  const status = req.query.status;
  const stage = req.query.stage;
  let list = db.prepare('SELECT * FROM applications ORDER BY id DESC').all();

  if (status && status !== 'all') {
    list = list.filter(a => a.status === status);
  }
  if (stage) {
    list = list.filter(a => a.stage === stage);
  }

  res.json(list);
});

// Get Application Details
app.get('/api/applications/:id', (req, res) => {
  const appItem = db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found' });

  const documents = db.prepare('SELECT * FROM application_documents WHERE application_no=?').all(appItem.application_no);
  const payments = db.prepare('SELECT * FROM payments WHERE application_no=?').all(appItem.application_no);
  const course = db.prepare('SELECT * FROM courses WHERE id=?').get(appItem.course_id);

  res.json({ application: appItem, documents, payments, course });
});

// Upload Document for Application
app.post('/api/applications/:id/documents', (req, res) => {
  const appItem = db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found' });

  const { document_type, file_name, file_url } = req.body || {};
  if (!document_type || !file_name) {
    return res.status(400).json({ error: 'Document type and file name required' });
  }

  const info = db.prepare('INSERT INTO application_documents (application_no, document_type, file_name, file_url) VALUES (?, ?, ?, ?)')
    .run(appItem.application_no, document_type, file_name, file_url || '#');

  // Update application stage to Documents if earlier
  if (appItem.stage === 'Form' || appItem.stage === 'Application') {
    db.prepare('UPDATE applications SET stage=? WHERE id=?').run('Documents', appItem.id);
  }

  res.status(201).json({ ok: true, id: info.lastInsertRowid, message: 'Document uploaded' });
});

// Verify / Reject Document (Admin)
app.patch('/api/documents/:id/verify', auth, (req, res) => {
  const { status, remarks } = req.body || {};
  db.prepare('UPDATE application_documents SET status=?, remarks=? WHERE id=?')
    .run(status || 'verified', remarks || '', req.params.id);
  audit(req.user.id, 'DOCUMENT_VERIFY', 'ApplicationDocument', req.params.id, `Status set to ${status}`);
  res.json({ ok: true, status, remarks });
});

// Update Application Status & Stage (Admin)
app.patch('/api/applications/:id/status', auth, (req, res) => {
  const { status, remarks } = req.body || {};
  db.prepare('UPDATE applications SET status=?, verification_remarks=? WHERE id=?')
    .run(status, remarks || '', req.params.id);

  const appItem = db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id);
  if (appItem?.user_id) {
    notify(appItem.user_id, 'Application Status Update', `Your application ${appItem.application_no} status changed to: ${status}. ${remarks || ''}`, 'admission');
  }

  audit(req.user.id, 'APPLICATION_STATUS', 'Application', req.params.id, `Status: ${status}`);
  res.json({ ok: true, status });
});

app.patch('/api/applications/:id/stage', auth, (req, res) => {
  const { stage } = req.body || {};
  db.prepare('UPDATE applications SET stage=? WHERE id=?').run(stage, req.params.id);
  res.json({ ok: true, stage });
});

// Pay Application Fee
app.post('/api/applications/:id/pay-application-fee', optionalAuth, (req, res) => {
  const appItem = db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found' });

  const course = db.prepare('SELECT * FROM courses WHERE id=?').get(appItem.course_id);
  const amount = course?.application_fee || 500;
  const payNo = 'PAY-APP-' + String(Date.now()).slice(-5);
  const recNo = 'REC-APP-' + String(Date.now()).slice(-5);

  db.prepare(`
    INSERT INTO payments (payment_no, user_id, application_no, type, amount, receipt_no)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(payNo, appItem.user_id, appItem.application_no, 'Application Fee', amount, recNo);

  db.prepare('UPDATE applications SET stage=?, status=? WHERE id=?').run('Verification', 'pending_verification', appItem.id);

  if (appItem.user_id) {
    notify(appItem.user_id, 'Application Fee Received', `Receipt ${recNo} issued for ₹${amount}. Your application is now in Verification stage.`, 'payment');
  }

  res.json({ ok: true, receipt_no: recNo, amount, message: 'Application fee payment recorded' });
});

// Approve Admission (Admin Step: Generates Admission Letter & Unlocks Admission Fee)
app.post('/api/applications/:id/approve-admission', auth, (req, res) => {
  const appItem = db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found' });

  db.prepare('UPDATE applications SET stage=?, status=? WHERE id=?').run('Admission Approval', 'approved', appItem.id);

  if (appItem.user_id) {
    notify(appItem.user_id, 'Admission Approved! 🎉', `Congratulations! Admission for ${appItem.applicant_name} has been approved. You can now pay the admission fee to complete enrollment.`, 'admission');
  }

  audit(req.user.id, 'ADMISSION_APPROVE', 'Application', appItem.id, 'Admission approved');
  res.json({ ok: true, message: 'Admission approved successfully' });
});

// Pay Admission Fee
app.post('/api/applications/:id/pay-admission-fee', optionalAuth, (req, res) => {
  const appItem = db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found' });

  const course = db.prepare('SELECT * FROM courses WHERE id=?').get(appItem.course_id);
  const amount = course?.admission_fee || 5000;
  const payNo = 'PAY-ADM-' + String(Date.now()).slice(-5);
  const recNo = 'REC-ADM-' + String(Date.now()).slice(-5);

  db.prepare(`
    INSERT INTO payments (payment_no, user_id, application_no, type, amount, receipt_no)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(payNo, appItem.user_id, appItem.application_no, 'Admission Fee', amount, recNo);

  db.prepare('UPDATE applications SET stage=? WHERE id=?').run('Fee Payment', appItem.id);

  if (appItem.user_id) {
    notify(appItem.user_id, 'Admission Fee Paid', `Receipt ${recNo} issued for ₹${amount}. Enrollment processing started.`, 'payment');
  }

  res.json({ ok: true, receipt_no: recNo, amount, message: 'Admission fee payment recorded' });
});

// Official Enrollment (Step 12: Generates Admission No & Student Dashboard Record)
app.post('/api/applications/:id/enroll', optionalAuth, (req, res) => {
  const appItem = db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found' });

  const course = db.prepare('SELECT * FROM courses WHERE id=?').get(appItem.course_id);
  const newAdmNo = 'GIS-' + String(Date.now()).slice(-4);
  const enrNo = 'ENR-2026-' + String(Date.now()).slice(-4);

  // Create student record
  const sInfo = db.prepare(`
    INSERT INTO students (
      admission_no, name, class_name, section, roll_no, parent_name, parent_phone, address, user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newAdmNo,
    appItem.applicant_name,
    course?.name || 'Class VIII',
    'A',
    '10' + (appItem.id % 90),
    appItem.parent_name,
    appItem.parent_phone,
    appItem.permanent_address || 'Khairi, Khanpur',
    appItem.user_id || null
  );

  // Record admission
  db.prepare('INSERT INTO admissions (application_no, student_name, course_id, remarks) VALUES (?, ?, ?, ?)')
    .run(appItem.application_no, appItem.applicant_name, appItem.course_id, `Admission confirmed with ${newAdmNo}`);

  // Record enrollment
  db.prepare('INSERT INTO enrollments (enrollment_no, student_id, course_id, session, section) VALUES (?, ?, ?, ?, ?)')
    .run(enrNo, sInfo.lastInsertRowid, appItem.course_id, '2026-27', 'A');

  // Update application
  db.prepare('UPDATE applications SET stage=?, status=? WHERE id=?').run('Enrollment', 'admitted', appItem.id);

  if (appItem.user_id) {
    notify(appItem.user_id, 'Enrollment Complete! 🎓', `Official Admission No: ${newAdmNo}. Your Student Dashboard and ID Card are now active!`, 'enrollment');
  }

  audit(req.user ? req.user.id : 1, 'ENROLL_STUDENT', 'Student', sInfo.lastInsertRowid, `Enrolled ${newAdmNo}`);

  res.json({
    ok: true,
    admission_no: newAdmNo,
    enrollment_no: enrNo,
    message: `Student officially enrolled as ${newAdmNo}`
  });
});

// Official Printable Admission Letter
app.get('/api/applications/:id/admission-letter', (req, res) => {
  const appItem = db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id);
  if (!appItem) return res.status(404).send('<h1>Application not found</h1>');

  const course = db.prepare('SELECT * FROM courses WHERE id=?').get(appItem.course_id);
  const student = db.prepare('SELECT * FROM students WHERE user_id=?').get(appItem.user_id);

  const letterHtml = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Provisional Admission Letter - ${appItem.application_no}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
        .letter-head { border-bottom: 3px double #0b4f9c; padding-bottom: 20px; text-align: center; margin-bottom: 30px; }
        .letter-head h1 { color: #0b4f9c; margin: 0; font-size: 26px; }
        .letter-head p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; background: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .highlight { background: #dcfce7; color: #15803d; font-weight: bold; padding: 4px 10px; border-radius: 4px; display: inline-block; }
        .signatures { margin-top: 80px; display: flex; justify-content: space-between; }
        .seal { width: 100px; height: 100px; border: 2px dashed #0b4f9c; border-radius: 50%; display: grid; place-items: center; color: #0b4f9c; font-size: 11px; text-align: center; margin: auto; }
      </style>
    </head>
    <body>
      <div class="letter-head">
        <h1>GYANSTHALI INTERNATIONAL SCHOOL</h1>
        <p>Khairi, Khanpur, Samastipur, Bihar - 848117 · Phone: 8002856232 · Email: gissupaul@gmail.com</p>
      </div>

      <div style="text-align:right;"><small>Date: ${new Date().toLocaleDateString('en-IN')}</small></div>
      <h2 style="text-align:center;color:#0b4f9c;margin:15px 0;">OFFICIAL PROVISIONAL ADMISSION LETTER</h2>

      <p>Dear <b>${appItem.parent_name}</b>,</p>
      <p>We are pleased to inform you that your ward, <b>${appItem.applicant_name}</b>, has been granted admission to <b>${course?.name || 'Class VIII'}</b> at Gyansthali International School for Academic Session <b>2026–2027</b>.</p>

      <div class="meta-grid">
        <div><b>Application No:</b> ${appItem.application_no}</div>
        <div><b>Admission Status:</b> <span class="highlight">APPROVED</span></div>
        <div><b>Candidate Name:</b> ${appItem.applicant_name}</div>
        <div><b>Course / Grade:</b> ${course?.name || 'Class VIII'}</div>
        <div><b>Parent / Guardian:</b> ${appItem.parent_name}</div>
        <div><b>Admission No:</b> ${student?.admission_no || 'GIS-2026-0042'}</div>
      </div>

      <p>Please complete registration and transport formalities before the commencement of classes on <b>01 April 2026</b>.</p>

      <div class="signatures">
        <div>____________________________<br><b>Admission Coordinator</b></div>
        <div class="seal">OFFICIAL<br>SEAL</div>
        <div>____________________________<br><b>Principal</b></div>
      </div>
    </body>
    </html>
  `;
  res.send(letterHtml);
});

// ==========================================
// 4. PAYMENTS & TRANSACTIONS
// ==========================================
app.get('/api/payments', (req, res) => {
  res.json(db.prepare('SELECT * FROM payments ORDER BY id DESC').all());
});

app.get('/api/payments/my', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM payments WHERE user_id=? ORDER BY id DESC').all(req.user.id));
});

// ==========================================
// 5. NOTIFICATIONS
// ==========================================
app.get('/api/notifications', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC').all(req.user.id));
});

app.patch('/api/notifications/:id/read', auth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read=1 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ==========================================
// 6. AUDIT LOGS
// ==========================================
app.get('/api/audit-logs', (req, res) => {
  res.json(db.prepare('SELECT * FROM audit_logs ORDER BY id DESC').all());
});

// ==========================================
// 7. STATS & DASHBOARD
// ==========================================
app.get('/api/stats', (req, res) => {
  const students = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  const applications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const teachers = (db.prepare('SELECT * FROM teachers').all() || []).length;
  const courses = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
  const contacts = (db.prepare('SELECT * FROM contacts').all() || []).length;

  res.json({ students, applications, teachers, courses, contacts });
});

// ==========================================
// 8. STUDENTS CRUD (Multi-entry, Edit, Delete)
// ==========================================
app.get('/api/students', (req, res) => {
  res.json(db.prepare('SELECT * FROM students ORDER BY id DESC').all());
});

app.post('/api/students', (req, res) => {
  const s = req.body || {};
  if (!s.name) return res.status(400).json({ error: 'Student name is required' });
  const admNo = s.admission_no || ('GIS-' + String(Date.now()).slice(-4));
  const info = db.prepare(`
    INSERT INTO students (admission_no, name, class_name, section, roll_no, parent_name, parent_phone, address, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    admNo,
    s.name,
    s.class_name || 'Class VIII',
    s.section || 'A',
    s.roll_no || '101',
    s.parent_name || 'Parent',
    s.parent_phone || '8002856232',
    s.address || 'Khairi, Khanpur',
    s.user_id || null
  );
  res.status(201).json(db.prepare('SELECT * FROM students WHERE id=?').get(info.lastInsertRowid));
});

app.post('/api/students/bulk', (req, res) => {
  const list = req.body?.students || [];
  const created = [];
  for (const s of list) {
    if (!s.name) continue;
    const admNo = s.admission_no || ('GIS-' + String(Date.now()).slice(-5) + Math.floor(Math.random() * 100));
    const info = db.prepare(`
      INSERT INTO students (admission_no, name, class_name, section, roll_no, parent_name, parent_phone, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(admNo, s.name, s.class_name, s.section, s.roll_no, s.parent_name, s.parent_phone, s.address);
    created.push(db.prepare('SELECT * FROM students WHERE id=?').get(info.lastInsertRowid));
  }
  res.status(201).json({ ok: true, count: created.length, students: created });
});

app.put('/api/students/:id', (req, res) => {
  const s = req.body || {};
  db.prepare(`
    UPDATE students
    SET name=?, class_name=?, section=?, roll_no=?, parent_name=?, parent_phone=?, address=?
    WHERE id=?
  `).run(s.name, s.class_name, s.section, s.roll_no, s.parent_name, s.parent_phone, s.address, req.params.id);
  res.json(db.prepare('SELECT * FROM students WHERE id=?').get(req.params.id));
});

app.delete('/api/students/:id', (req, res) => {
  db.prepare('DELETE FROM students WHERE id=?').run(req.params.id);
  res.status(204).end();
});

app.post('/api/students/delete-multiple', (req, res) => {
  const ids = req.body?.ids || [];
  ids.forEach(id => db.prepare('DELETE FROM students WHERE id=?').run(id));
  res.json({ ok: true, count: ids.length });
});

// ==========================================
// 9. CLASSES & ROLES
// ==========================================
app.get('/api/classes', (req, res) => {
  res.json(db.prepare('SELECT * FROM classes ORDER BY id ASC').all());
});

app.post('/api/classes', (req, res) => {
  const { name, sections, total_students, teacher_incharge } = req.body || {};
  const info = db.prepare('INSERT INTO classes (name, sections, total_students, teacher_incharge) VALUES (?, ?, ?, ?)')
    .run(name, sections || 'A, B', total_students || 0, teacher_incharge || 'Faculty');
  res.status(201).json({ id: info.lastInsertRowid });
});

app.get('/api/roles', (req, res) => {
  res.json(db.prepare('SELECT * FROM roles ORDER BY id ASC').all());
});

app.put('/api/roles/:id', (req, res) => {
  const { access_modules, description } = req.body || {};
  db.prepare('UPDATE roles SET access_modules=?, description=? WHERE id=?')
    .run(access_modules, description, req.params.id);
  res.json({ ok: true, message: 'Role updated' });
});

// ==========================================
// 10. CONTACTS & NOTICES & EVENTS
// ==========================================
app.get('/api/contacts', (req, res) => {
  res.json(db.prepare('SELECT * FROM contacts ORDER BY id DESC').all());
});

app.post('/api/contacts', (req, res) => {
  const { name, phone, email, message } = req.body || {};
  const info = db.prepare('INSERT INTO contacts (name, phone, email, message) VALUES (?, ?, ?, ?)')
    .run(name, phone, email || '', message);
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

app.patch('/api/contacts/:id/status', (req, res) => {
  db.prepare('UPDATE contacts SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/contacts/:id', (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id=?').run(req.params.id);
  res.status(204).end();
});

app.get('/api/notices', (req, res) => {
  res.json(db.prepare('SELECT * FROM notices WHERE published=1 ORDER BY created_at DESC').all());
});

app.post('/api/notices', (req, res) => {
  const { title, body } = req.body || {};
  const info = db.prepare('INSERT INTO notices (title, body, published) VALUES (?, ?, 1)').run(title, body);
  res.status(201).json({ id: info.lastInsertRowid });
});

app.delete('/api/notices/:id', (req, res) => {
  db.prepare('DELETE FROM notices WHERE id=?').run(req.params.id);
  res.status(204).end();
});

app.get('/api/events', (req, res) => {
  res.json(db.prepare('SELECT * FROM events ORDER BY date DESC').all());
});

app.post('/api/events', (req, res) => {
  const { title, date, description } = req.body || {};
  const info = db.prepare('INSERT INTO events (title, date, description) VALUES (?, ?, ?)')
    .run(title, date || new Date().toISOString().slice(0, 10), description || '');
  res.status(201).json({ id: info.lastInsertRowid });
});

app.delete('/api/events/:id', (req, res) => {
  db.prepare('DELETE FROM events WHERE id=?').run(req.params.id);
  res.status(204).end();
});

// ==========================================
// 11. REPORTS GENERATION
// ==========================================
app.get('/api/reports/admissions', (req, res) => {
  const apps = db.prepare('SELECT * FROM applications ORDER BY id DESC').all();
  res.json({ title: 'Admissions & Funnel Report', date: new Date().toISOString().slice(0, 10), count: apps.length, data: apps });
});

app.get('/api/reports/students', (req, res) => {
  const students = db.prepare('SELECT * FROM students ORDER BY id DESC').all();
  res.json({ title: 'Student Enrollment Report', date: new Date().toISOString().slice(0, 10), count: students.length, data: students });
});

app.get('/api/reports/payments', (req, res) => {
  const payments = db.prepare('SELECT * FROM payments ORDER BY id DESC').all();
  const total = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  res.json({ title: 'Fee Transactions Audit', date: new Date().toISOString().slice(0, 10), total, count: payments.length, data: payments });
});

// ==========================================
// STATIC FRONTEND & SERVER LAUNCH
// ==========================================
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  maxAge: '1h'
}));

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`  Gyansthali International School Portal Ready!`);
  console.log(`  Full 12-Step Lifecycle & Enterprise Admission System`);
  console.log(`  URL:   http://localhost:${PORT}`);
  console.log(`  Admin: ${process.env.ADMIN_EMAIL || 'gissupaul@gmail.com'}`);
  console.log(`  Phone: ${process.env.ENQUIRY_PHONE || '8002856232'}`);
  console.log(`===================================================`);
});
