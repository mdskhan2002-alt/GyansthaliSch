// ============================================================
// Gyansthali International School - Admin & Application Controller
// School Email: gissupaul@gmail.com | Phone: 8002856232
// ============================================================

const STORAGE_KEY = 'gyansthali_data_v3';
const TOKEN_KEY = 'gis_jwt_token';
const USER_KEY = 'gis_user_info';

// Offline fallback seed data
const seedData = {
  students: [
    { id: 1, admission_no: 'GIS-001', name: 'Aman Kumar', class_name: 'Class VIII', section: 'A', roll_no: '101', parent_name: 'Ramesh Kumar', parent_phone: '8002856232', address: 'Khairi, Khanpur' },
    { id: 2, admission_no: 'GIS-002', name: 'Priya Kumari', class_name: 'Class VIII', section: 'A', roll_no: '102', parent_name: 'Suresh Kumar', parent_phone: '8002856232', address: 'Khanpur, Samastipur' },
    { id: 3, admission_no: 'GIS-003', name: 'Rahul Raj', class_name: 'Class V', section: 'B', roll_no: '105', parent_name: 'Manoj Raj', parent_phone: '8002856232', address: 'Samastipur' }
  ],
  teachers: [
    { id: 1, name: 'Academic Team', subject: 'Administration & Direction', phone: '8002856232', email: 'gissupaul@gmail.com' },
    { id: 2, name: 'Teaching Faculty', subject: 'Science & Mathematics', phone: '8002856232', email: 'gissupaul@gmail.com' },
    { id: 3, name: 'Activity Mentors', subject: 'Sports & Cultural Activities', phone: '8002856232', email: 'gissupaul@gmail.com' }
  ],
  admissions: [
    { id: 1, student_name: 'Vikram Singh', parent_name: 'Devendra Singh', phone: '8002856232', email: 'gissupaul@gmail.com', class_name: 'Class VI', session: '2026-27', message: 'Seeking admission for session 2026', stage: 'Enquiry', status: 'new', created_at: new Date().toISOString() },
    { id: 2, student_name: 'Ananya Sharma', parent_name: 'Rajesh Sharma', phone: '8002856232', email: 'gissupaul@gmail.com', class_name: 'Class I', session: '2026-27', message: 'Documents submitted for verification', stage: 'Documents', status: 'contacted', created_at: new Date().toISOString() }
  ],
  contacts: [
    { id: 1, name: 'Sanjay Kumar', phone: '8002856232', email: 'gissupaul@gmail.com', message: 'Inquiring regarding school bus timings and fees.', status: 'New', created_at: new Date().toISOString() }
  ],
  classes: [
    { id: 1, name: 'Nursery', sections: 'A, B', total_students: 35, teacher_incharge: 'Anjali Sharma' },
    { id: 2, name: 'LKG', sections: 'A, B', total_students: 40, teacher_incharge: 'Kavita Singh' },
    { id: 3, name: 'UKG', sections: 'A, B', total_students: 42, teacher_incharge: 'Neha Verma' },
    { id: 4, name: 'Class I', sections: 'A, B', total_students: 48, teacher_incharge: 'R. K. Mishra' },
    { id: 5, name: 'Class V', sections: 'A, B', total_students: 55, teacher_incharge: 'S. K. Choudhary' },
    { id: 6, name: 'Class VIII', sections: 'A, B', total_students: 62, teacher_incharge: 'P. K. Thakur' },
    { id: 7, name: 'Class X', sections: 'A, B', total_students: 58, teacher_incharge: 'Academic Team' }
  ],
  roles: [
    { id: 1, role: 'Super Admin', access_modules: 'All modules', description: 'Complete system access, database management, user permissions.' },
    { id: 2, role: 'Principal', access_modules: 'Academic, admissions, reports', description: 'Supervises admissions, faculty, results, curriculum.' },
    { id: 3, role: 'Teacher', access_modules: 'Attendance, marks, timetable', description: 'Records student attendance, enters exam marks, reviews schedule.' },
    { id: 4, role: 'Accountant', access_modules: 'Fees & receipts', description: 'Manages student fee payments, invoices, receipts, and audits.' },
    { id: 5, role: 'Reception', access_modules: 'Enquiries & admissions', description: 'Handles phone calls, parent inquiries, and visitor registrations.' }
  ],
  notices: [
    { id: 1, title: 'Admissions Open for Session 2026-27', body: 'Admissions enquiry is now open for Nursery to Class X. Contact 8002856232.', published: 1, created_at: new Date().toISOString() }
  ],
  events: [
    { id: 1, title: 'Republic Day Celebration', date: '2026-01-26', description: 'Flag hoisting and cultural performance.' }
  ],
  attendance: [
    { student_id: 1, name: 'Aman Kumar', status: 'present', date: new Date().toISOString().slice(0, 10) }
  ],
  fees: [
    { id: 1, student_id: 1, name: 'Aman Kumar', admission_no: 'GIS-001', amount: 5000, due_date: '2026-04-10', status: 'pending', receipt_no: 'REC-1001' }
  ]
};

function getLocalData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return structuredClone(seedData);
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return structuredClone(seedData);
  }
}

function saveLocalData(d) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function setToken(token, user) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch (e) {
    return null;
  }
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, offline: true, error: err.message };
  }
}

function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(window._t);
  window._t = setTimeout(() => el.style.display = 'none', 2800);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// Navigation
function showTab(id, btn) {
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  document.querySelectorAll('.side-group button').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const titles = {
    'dashboard': 'Dashboard',
    'students': 'Student Management',
    'parents': 'Parent Management',
    'classes': 'Classes & Sections',
    'teachers': 'Faculty & Teachers',
    'subjects': 'Subjects',
    'timetable': 'Timetable',
    'attendance': 'QR Attendance',
    'exams': 'Exams & Marks',
    'results': 'Results / Report Cards',
    'workflow': 'Online Application Lifecycle',
    'admissions': 'Admission Enquiries',
    'contacts': 'Contact Enquiries Dashboard',
    'fees': 'Fees & Online Payments',
    'notices': 'Notices',
    'events': 'Events',
    'gallery': 'Gallery Upload',
    'certificates': 'ID Cards & Certificates',
    'users': 'User Roles & Permissions',
    'reports': 'System Reports',
    'settings': 'Settings & Backup',
    'chatbot': 'School AI Assistant'
  };

  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[id] || id;
  document.body.classList.remove('side-open');
}

// Dashboard
async function renderDashboard() {
  const m = document.getElementById('metrics');
  const r = document.getElementById('recentAdmissions');
  if (!m) return;

  const res = await api('/api/stats');
  if (res.ok && res.data) {
    const s = res.data;
    m.innerHTML = `
      <div><b>${s.students}</b><span>Students Enrolled</span></div>
      <div><b>${s.teachers}</b><span>Faculty Members</span></div>
      <div><b>${s.admissions}</b><span>Admission Applications</span></div>
      <div><b>${s.contacts || 1}</b><span>Contact Queries</span></div>
    `;
  } else {
    const d = getLocalData();
    m.innerHTML = `
      <div><b>${(d.students || []).length}</b><span>Students Enrolled</span></div>
      <div><b>${(d.teachers || []).length}</b><span>Faculty Members</span></div>
      <div><b>${(d.admissions || []).length}</b><span>Admission Applications</span></div>
      <div><b>${(d.contacts || []).length}</b><span>Contact Queries</span></div>
    `;
  }

  const admRes = await api('/api/admissions');
  const admissions = (admRes.ok && Array.isArray(admRes.data)) ? admRes.data : (getLocalData().admissions || []);
  if (r) {
    if (admissions.length) {
      r.innerHTML = admissions.slice(0, 5).map(a => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #edf1f5;">
          <div>
            <b>${esc(a.student_name || a.student)}</b> (${esc(a.class_name || 'General')})
            <small style="display:block;color:#64748b;">Parent: ${esc(a.parent_name || a.parent)} · 📞 ${esc(a.phone)}</small>
          </div>
          <span class="step-pill active" style="font-size:11px;">${esc(a.stage || 'Enquiry')}</span>
        </div>
      `).join('');
    } else {
      r.innerHTML = '<p style="color:#64748b;">No admissions received yet.</p>';
    }
  }
}

// Student Management (Multiple Entry, Edit, Delete)
let cachedStudents = [];
let selectedStudentIds = new Set();

async function renderStudents() {
  const tb = document.getElementById('studentTable');
  if (!tb) return;

  const res = await api('/api/students');
  if (res.ok && Array.isArray(res.data)) {
    cachedStudents = res.data;
  } else {
    cachedStudents = getLocalData().students || [];
  }

  const q = (document.getElementById('studentSearch')?.value || '').toLowerCase();
  const filtered = cachedStudents.filter(s => {
    const text = `${s.name} ${s.admission_no || ''} ${s.class_name || ''} ${s.parent_name || ''} ${s.parent_phone || ''}`.toLowerCase();
    return text.includes(q);
  });

  if (!filtered.length) {
    tb.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#64748b;padding:24px;">No student records found.</td></tr>';
    return;
  }

  tb.innerHTML = filtered.map(s => {
    const isChecked = selectedStudentIds.has(s.id);
    return `
      <tr>
        <td><input type="checkbox" onchange="toggleSelectStudent(${s.id}, this.checked)" ${isChecked ? 'checked' : ''}></td>
        <td><b>${esc(s.admission_no || 'GIS-' + s.id)}</b></td>
        <td>${esc(s.name)}</td>
        <td>${esc(s.class_name || '—')} ${s.section ? `(${s.section})` : ''}</td>
        <td>${esc(s.roll_no || '—')}</td>
        <td>${esc(s.parent_name || '—')}</td>
        <td><a href="tel:${esc(s.parent_phone || '')}">${esc(s.parent_phone || '—')}</a></td>
        <td><small>${esc(s.address || '—')}</small></td>
        <td>
          <button class="btn btn-sm outline" onclick="openStudentModal(${s.id})">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteStudent(${s.id})">🗑️ Delete</button>
        </td>
      </tr>
    `;
  }).join('');

  renderParents();
}

function toggleSelectStudent(id, checked) {
  if (checked) selectedStudentIds.add(id);
  else selectedStudentIds.delete(id);

  const btn = document.getElementById('btnDeleteSelected');
  if (btn) btn.style.display = selectedStudentIds.size > 0 ? 'inline-flex' : 'none';
}

function toggleSelectAllStudents(checked) {
  if (checked) {
    cachedStudents.forEach(s => selectedStudentIds.add(s.id));
  } else {
    selectedStudentIds.clear();
  }
  renderStudents();
}

async function deleteSelectedStudents() {
  if (!selectedStudentIds.size) return;
  if (!confirm(`Are you sure you want to delete ${selectedStudentIds.size} selected students?`)) return;

  const ids = Array.from(selectedStudentIds);
  await api('/api/students/delete-multiple', {
    method: 'POST',
    body: JSON.stringify({ ids })
  });

  // Local fallback
  const d = getLocalData();
  d.students = (d.students || []).filter(s => !selectedStudentIds.has(s.id));
  saveLocalData(d);

  selectedStudentIds.clear();
  document.getElementById('btnDeleteSelected').style.display = 'none';
  toast('Selected students deleted');
  renderStudents();
  renderDashboard();
}

function openStudentModal(id = null) {
  const existing = id ? cachedStudents.find(s => s.id === id) : null;
  const isEdit = !!existing;

  const html = `
    <div class="modal-overlay" id="studentModal">
      <div class="modal-card">
        <h3>${isEdit ? 'Edit Student Record' : 'Add New Student'}</h3>
        <div>
          <label><small>Student Full Name *</small></label>
          <input id="modalStudentName" value="${esc(existing?.name || '')}" placeholder="e.g. Aman Kumar">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label><small>Admission No.</small></label>
            <input id="modalStudentAdm" value="${esc(existing?.admission_no || '')}" placeholder="e.g. GIS-004">
          </div>
          <div>
            <label><small>Roll Number</small></label>
            <input id="modalStudentRoll" value="${esc(existing?.roll_no || '')}" placeholder="e.g. 104">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label><small>Class</small></label>
            <input id="modalStudentClass" value="${esc(existing?.class_name || 'Class VIII')}" placeholder="e.g. Class VIII">
          </div>
          <div>
            <label><small>Section</small></label>
            <input id="modalStudentSection" value="${esc(existing?.section || 'A')}" placeholder="e.g. A">
          </div>
        </div>
        <div>
          <label><small>Parent / Guardian Name</small></label>
          <input id="modalStudentParent" value="${esc(existing?.parent_name || '')}" placeholder="Father or Mother name">
        </div>
        <div>
          <label><small>Parent Mobile Number *</small></label>
          <input id="modalStudentPhone" value="${esc(existing?.parent_phone || '8002856232')}" placeholder="10-digit mobile number">
        </div>
        <div>
          <label><small>Residential Address</small></label>
          <input id="modalStudentAddress" value="${esc(existing?.address || 'Khairi, Khanpur')}" placeholder="Village/Town, District">
        </div>
        <div class="modal-actions">
          <button class="btn outline" onclick="closeModal('studentModal')">Cancel</button>
          <button class="btn primary" onclick="saveStudent(${id || 'null'})">${isEdit ? 'Save Changes' : 'Add Student'}</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function saveStudent(id) {
  const name = document.getElementById('modalStudentName')?.value.trim();
  const admNo = document.getElementById('modalStudentAdm')?.value.trim();
  const rollNo = document.getElementById('modalStudentRoll')?.value.trim();
  const className = document.getElementById('modalStudentClass')?.value.trim();
  const section = document.getElementById('modalStudentSection')?.value.trim();
  const parent = document.getElementById('modalStudentParent')?.value.trim();
  const phone = document.getElementById('modalStudentPhone')?.value.trim();
  const address = document.getElementById('modalStudentAddress')?.value.trim();

  if (!name) return alert('Student name is required');

  const payload = {
    name,
    admission_no: admNo || undefined,
    roll_no: rollNo,
    class_name: className,
    section,
    parent_name: parent,
    parent_phone: phone,
    address
  };

  if (id) {
    const res = await api(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    if (!res.ok) {
      const d = getLocalData();
      const s = (d.students || []).find(x => x.id === id);
      if (s) { Object.assign(s, payload); saveLocalData(d); }
    }
    toast('Student details updated');
  } else {
    const res = await api('/api/students', { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) {
      const d = getLocalData();
      d.students = d.students || [];
      payload.id = Date.now();
      payload.admission_no = admNo || ('GIS-' + String(Date.now()).slice(-4));
      d.students.unshift(payload);
      saveLocalData(d);
    }
    toast('Student record added');
  }

  closeModal('studentModal');
  renderStudents();
  renderDashboard();
}

async function deleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student record?')) return;
  const res = await api(`/api/students/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const d = getLocalData();
    d.students = (d.students || []).filter(x => x.id !== id);
    saveLocalData(d);
  }
  toast('Student record deleted');
  renderStudents();
  renderDashboard();
}

// Bulk Multiple Students Entry Modal
function openBulkStudentModal() {
  const html = `
    <div class="modal-overlay" id="bulkStudentModal">
      <div class="modal-card" style="max-width:650px;">
        <h3>Multiple / Bulk Student Entry</h3>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;">Enter one student per line in this format:<br><code>Full Name, Class, Section, Roll, Parent Name, Phone Number</code></p>
        <textarea id="bulkStudentText" style="min-height:160px;font-family:monospace;font-size:13px;" placeholder="Sunil Kumar, Class VI, A, 110, Ashok Kumar, 8002856232&#10;Pooja Kumari, Class VII, B, 112, Mohan Kumar, 8002856232"></textarea>
        <div class="modal-actions">
          <button class="btn outline" onclick="closeModal('bulkStudentModal')">Cancel</button>
          <button class="btn primary" onclick="saveBulkStudents()">Import All Students</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function saveBulkStudents() {
  const text = document.getElementById('bulkStudentText')?.value.trim();
  if (!text) return alert('Please enter student details');

  const lines = text.split('\n');
  const students = [];

  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim());
    if (!parts[0]) continue;
    students.push({
      name: parts[0],
      class_name: parts[1] || 'Class I',
      section: parts[2] || 'A',
      roll_no: parts[3] || '',
      parent_name: parts[4] || 'Parent',
      parent_phone: parts[5] || '8002856232',
      address: 'Khairi, Khanpur'
    });
  }

  if (!students.length) return alert('No valid student entries found');

  const res = await api('/api/students/bulk', {
    method: 'POST',
    body: JSON.stringify({ students })
  });

  if (!res.ok) {
    const d = getLocalData();
    d.students = d.students || [];
    students.forEach((s, idx) => {
      s.id = Date.now() + idx;
      s.admission_no = 'GIS-' + String(s.id).slice(-4);
      d.students.unshift(s);
    });
    saveLocalData(d);
  }

  toast(`Successfully imported ${students.length} students!`);
  closeModal('bulkStudentModal');
  renderStudents();
  renderDashboard();
}

// Parent Management Dashboard
function renderParents() {
  const tb = document.getElementById('parentTable');
  if (!tb) return;

  const students = cachedStudents.length ? cachedStudents : (getLocalData().students || []);
  if (!students.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:20px;">No parent records linked.</td></tr>';
    return;
  }

  tb.innerHTML = students.map(s => `
    <tr>
      <td><b>${esc(s.parent_name || 'Guardian')}</b></td>
      <td>${esc(s.name)} (${esc(s.admission_no || '')})</td>
      <td>${esc(s.class_name || '—')}</td>
      <td><a href="tel:${esc(s.parent_phone || '8002856232')}">📞 ${esc(s.parent_phone || '8002856232')}</a></td>
      <td><code>1234</code></td>
      <td><span class="badge badge-paid">Active</span></td>
      <td>
        <a class="btn btn-sm outline" href="https://wa.me/91${esc(s.parent_phone || '8002856232')}?text=Hello%20${encodeURIComponent(s.parent_name || 'Parent')}%2C%20update%20from%20Gyansthali%20International%20School." target="_blank">💬 WhatsApp</a>
      </td>
    </tr>
  `).join('');
}

// Classes & Sections Dashboard
async function renderClasses() {
  const tb = document.getElementById('classTable');
  if (!tb) return;

  const res = await api('/api/classes');
  const classes = (res.ok && Array.isArray(res.data)) ? res.data : (getLocalData().classes || []);

  tb.innerHTML = classes.map(c => `
    <tr>
      <td><b>${esc(c.name)}</b></td>
      <td>${esc(c.sections || 'A, B')}</td>
      <td><span class="badge badge-new">${esc(c.total_students || 0)} Students</span></td>
      <td>${esc(c.teacher_incharge || 'Assigned Faculty')}</td>
      <td>
        <button class="btn btn-sm outline" onclick="toast('Class configuration saved')">Edit</button>
      </td>
    </tr>
  `).join('');
}

function openAddClassModal() {
  const name = prompt('Class Name (e.g. Class IX):');
  if (!name) return;
  const sections = prompt('Sections (e.g. A, B):', 'A, B') || 'A, B';
  const teacher = prompt('Class Teacher in charge:', 'Faculty Member') || 'Faculty Member';

  (async () => {
    await api('/api/classes', {
      method: 'POST',
      body: JSON.stringify({ name, sections, teacher_incharge: teacher })
    });
    toast('New class & sections created');
    renderClasses();
  })();
}

// Application Lifecycle Workflow
// Stages: Enquiry -> Form -> Documents -> Verification -> Interview -> Approved -> Admission No.
const WORKFLOW_STAGES = ['Enquiry', 'Form', 'Documents', 'Verification', 'Interview', 'Approved', 'Admission No.'];

async function renderWorkflow() {
  const tb = document.getElementById('workflowTable');
  if (!tb) return;

  const res = await api('/api/admissions');
  const list = (res.ok && Array.isArray(res.data)) ? res.data : (getLocalData().admissions || []);

  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:24px;">No applications in workflow.</td></tr>';
    return;
  }

  tb.innerHTML = list.map(a => {
    const currentStage = a.stage || 'Enquiry';
    const isApproved = currentStage === 'Approved';
    const isCompleted = currentStage === 'Admission No.';

    return `
      <tr>
        <td><b>${esc(a.student_name || a.student)}</b></td>
        <td>${esc(a.parent_name || a.parent)}</td>
        <td>${esc(a.class_name || 'General')}</td>
        <td>📞 ${esc(a.phone)}</td>
        <td><span class="step-pill active">${esc(currentStage)}</span></td>
        <td>
          <select onchange="updateWorkflowStage(${a.id}, this.value)" style="padding:6px;font-size:12.5px;">
            ${WORKFLOW_STAGES.map(s => `<option value="${s}" ${s === currentStage ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td>
          ${isApproved ? `<button class="btn btn-sm primary" onclick="generateAdmissionNo(${a.id})">🎓 Assign Admission No.</button>` : ''}
          ${isCompleted ? `<span class="badge badge-paid">Enrolled</span>` : ''}
          ${!isApproved && !isCompleted ? `<button class="btn btn-sm outline" onclick="advanceWorkflowStage(${a.id}, '${currentStage}')">Next Stage →</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

async function updateWorkflowStage(id, stage) {
  const res = await api(`/api/admissions/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage })
  });

  if (!res.ok) {
    const d = getLocalData();
    const a = (d.admissions || []).find(x => x.id === id);
    if (a) { a.stage = stage; saveLocalData(d); }
  }

  toast(`Application moved to: ${stage}`);
  renderWorkflow();
  renderDashboard();
}

function advanceWorkflowStage(id, currentStage) {
  const idx = WORKFLOW_STAGES.indexOf(currentStage);
  if (idx < WORKFLOW_STAGES.length - 1) {
    updateWorkflowStage(id, WORKFLOW_STAGES[idx + 1]);
  }
}

async function generateAdmissionNo(id) {
  const res = await api(`/api/admissions/${id}/generate-admission-no`, { method: 'POST' });
  if (res.ok) {
    toast(`Student officially enrolled with ${res.data.admission_no}!`);
  } else {
    // Local fallback
    const d = getLocalData();
    const a = (d.admissions || []).find(x => x.id === id);
    const newAdm = 'GIS-' + String(Date.now()).slice(-4);
    if (a) {
      a.stage = 'Admission No.';
      a.status = 'admitted';
      d.students.unshift({
        id: Date.now(),
        admission_no: newAdm,
        name: a.student_name,
        class_name: a.class_name,
        section: 'A',
        parent_name: a.parent_name,
        parent_phone: a.phone
      });
      saveLocalData(d);
    }
    toast(`Assigned ${newAdm} to ${a?.student_name}!`);
  }

  renderWorkflow();
  renderStudents();
  renderDashboard();
}

// Contact Enquiries Dashboard (Fixed)
async function renderContacts() {
  const tb = document.getElementById('contactTable');
  if (!tb) return;

  const res = await api('/api/contacts');
  const contacts = (res.ok && Array.isArray(res.data)) ? res.data : (getLocalData().contacts || []);

  if (!contacts.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:24px;">No contact inquiries received yet.</td></tr>';
    return;
  }

  tb.innerHTML = contacts.map(c => {
    const dateStr = c.created_at ? c.created_at.slice(0, 10) : 'Recent';
    const status = c.status || 'New';
    return `
      <tr>
        <td>${esc(dateStr)}</td>
        <td><b>${esc(c.name)}</b></td>
        <td>
          <a href="tel:${esc(c.phone)}">📞 ${esc(c.phone)}</a><br>
          <a href="https://wa.me/91${esc(c.phone)}" target="_blank" style="font-size:12px;color:#16a34a;">💬 WhatsApp</a>
        </td>
        <td>${esc(c.email || '—')}</td>
        <td><small>${esc(c.message)}</small></td>
        <td><span class="badge badge-${status.toLowerCase()}">${esc(status)}</span></td>
        <td>
          <button class="btn btn-sm primary" onclick="updateContactStatus(${c.id}, 'Replied')">Mark Replied</button>
          <button class="btn btn-sm btn-danger" onclick="deleteContact(${c.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateContactStatus(id, status) {
  const res = await api(`/api/contacts/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });

  if (!res.ok) {
    const d = getLocalData();
    const item = (d.contacts || []).find(x => x.id === id);
    if (item) { item.status = status; saveLocalData(d); }
  }

  toast(`Enquiry marked as ${status}`);
  renderContacts();
}

async function deleteContact(id) {
  if (!confirm('Delete this contact message?')) return;
  const res = await api(`/api/contacts/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const d = getLocalData();
    d.contacts = (d.contacts || []).filter(x => x.id !== id);
    saveLocalData(d);
  }
  toast('Enquiry deleted');
  renderContacts();
}

// User Roles & Permissions (Editable)
async function renderRoles() {
  const tb = document.getElementById('roleTable');
  if (!tb) return;

  const res = await api('/api/roles');
  const roles = (res.ok && Array.isArray(res.data)) ? res.data : (getLocalData().roles || []);

  tb.innerHTML = roles.map(r => `
    <tr>
      <td><b>${esc(r.role)}</b></td>
      <td><code>${esc(r.access_modules)}</code></td>
      <td><small>${esc(r.description || '')}</small></td>
      <td>
        <button class="btn btn-sm outline" onclick="openEditRoleModal(${r.id}, '${esc(r.role)}', '${esc(r.access_modules)}', '${esc(r.description || '')}')">✏️ Edit Access</button>
      </td>
    </tr>
  `).join('');
}

function openEditRoleModal(id, role, accessModules, description) {
  const html = `
    <div class="modal-overlay" id="roleModal">
      <div class="modal-card">
        <h3>Edit Role Permissions: ${esc(role)}</h3>
        <div>
          <label><small>Accessible Modules (comma-separated)</small></label>
          <input id="modalRoleAccess" value="${esc(accessModules)}">
        </div>
        <div>
          <label><small>Role Description</small></label>
          <input id="modalRoleDesc" value="${esc(description)}">
        </div>
        <div class="modal-actions">
          <button class="btn outline" onclick="closeModal('roleModal')">Cancel</button>
          <button class="btn primary" onclick="saveRole(${id})">Save Permissions</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function saveRole(id) {
  const access_modules = document.getElementById('modalRoleAccess')?.value.trim();
  const description = document.getElementById('modalRoleDesc')?.value.trim();

  if (!access_modules) return alert('Accessible modules cannot be empty');

  const res = await api(`/api/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ access_modules, description })
  });

  if (!res.ok) {
    const d = getLocalData();
    const r = (d.roles || []).find(x => x.id === id);
    if (r) { r.access_modules = access_modules; r.description = description; saveLocalData(d); }
  }

  toast('Role permissions updated successfully');
  closeModal('roleModal');
  renderRoles();
}

// Reports Generation (Student Report, Attendance Report, Fee Collection)
async function generateReport(type) {
  const out = document.getElementById('reportOutput');
  if (!out) return;

  out.style.display = 'block';
  out.innerHTML = '<p>Generating report from database...</p>';

  if (type === 'students') {
    const res = await api('/api/reports/students');
    const data = res.ok ? res.data : { count: cachedStudents.length, data: cachedStudents, title: 'Student Enrollment Report', date: new Date().toISOString().slice(0, 10) };
    const list = data.data || [];

    out.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
        <div>
          <h3 style="margin:0;">🎓 ${data.title}</h3>
          <small style="color:#64748b;">Generated on ${data.date} · Total Enrolled: ${list.length}</small>
        </div>
        <div>
          <button class="btn btn-sm primary" onclick="printDoc('Student Enrollment Report', document.getElementById('repTable').outerHTML)">🖨️ Print / Save PDF</button>
          <button class="btn btn-sm outline" onclick="downloadCSV('students-report.csv', 'Admission No,Name,Class,Parent,Phone\\n' + '${list.map(s => `${s.admission_no},${s.name},${s.class_name},${s.parent_name},${s.parent_phone}`).join('\\n')}')">⬇️ Export CSV</button>
        </div>
      </div>
      <div class="table-wrap" id="repTable">
        <table>
          <thead><tr><th>Admission No</th><th>Name</th><th>Class</th><th>Parent Name</th><th>Mobile</th></tr></thead>
          <tbody>
            ${list.map(s => `<tr><td>${esc(s.admission_no)}</td><td>${esc(s.name)}</td><td>${esc(s.class_name)}</td><td>${esc(s.parent_name)}</td><td>${esc(s.parent_phone)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (type === 'attendance') {
    const res = await api('/api/reports/attendance');
    const data = res.ok ? res.data : { count: 3, data: getLocalData().attendance || [], title: 'Attendance Summary Report', date: new Date().toISOString().slice(0, 10) };
    const list = data.data || [];

    out.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
        <div>
          <h3 style="margin:0;">📱 ${data.title}</h3>
          <small style="color:#64748b;">Generated on ${data.date} · Attendance Entries Logged: ${list.length}</small>
        </div>
        <div>
          <button class="btn btn-sm primary" onclick="printDoc('Attendance Summary Report', document.getElementById('repTable').outerHTML)">🖨️ Print / Save PDF</button>
          <button class="btn btn-sm outline" onclick="downloadCSV('attendance-report.csv', 'Date,Student,Status\\n' + '${list.map(a => `${a.date},${a.name || a.student},${a.status}`).join('\\n')}')">⬇️ Export CSV</button>
        </div>
      </div>
      <div class="table-wrap" id="repTable">
        <table>
          <thead><tr><th>Date</th><th>Student Name</th><th>Attendance Status</th></tr></thead>
          <tbody>
            ${list.map(a => `<tr><td>${esc(a.date)}</td><td>${esc(a.name || a.student || 'Student')}</td><td><span class="badge badge-${(a.status || '').toLowerCase()}">${esc(a.status || 'Present')}</span></td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (type === 'fees') {
    const res = await api('/api/reports/fees');
    const data = res.ok ? res.data : { totalAmount: 5000, data: getLocalData().fees || [], title: 'Fee Collection Audit Report', date: new Date().toISOString().slice(0, 10) };
    const list = data.data || [];

    out.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
        <div>
          <h3 style="margin:0;">💳 ${data.title}</h3>
          <small style="color:#64748b;">Generated on ${data.date} · Total Records: ${list.length}</small>
        </div>
        <div>
          <button class="btn btn-sm primary" onclick="printDoc('Fee Collection Report', document.getElementById('repTable').outerHTML)">🖨️ Print / Save PDF</button>
          <button class="btn btn-sm outline" onclick="downloadCSV('fee-collection-report.csv', 'Receipt,Student,Amount,Status,Due Date\\n' + '${list.map(f => `${f.receipt_no},${f.name},${f.amount},${f.status},${f.due_date}`).join('\\n')}')">⬇️ Export CSV</button>
        </div>
      </div>
      <div class="table-wrap" id="repTable">
        <table>
          <thead><tr><th>Receipt No</th><th>Student Name</th><th>Amount (₹)</th><th>Status</th><th>Due Date</th></tr></thead>
          <tbody>
            ${list.map(f => `<tr><td>${esc(f.receipt_no)}</td><td>${esc(f.name || 'Student')}</td><td>₹${Number(f.amount).toLocaleString('en-IN')}</td><td><span class="badge badge-${f.status}">${esc(f.status)}</span></td><td>${esc(f.due_date || '—')}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

function downloadCSV(filename, content) {
  const blob = new Blob([content], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  toast('CSV report downloaded');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// Attendance
async function renderAttendance() {
  const el = document.getElementById('attendanceList');
  if (!el) return;
  const today = new Date().toISOString().slice(0, 10);
  const res = await api(`/api/attendance?date=${today}`);
  const rows = (res.ok && Array.isArray(res.data)) ? res.data : (getLocalData().attendance || []);

  el.innerHTML = rows.map(a => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #edf1f5;">
      <span>👤 <b>${esc(a.name || 'Student')}</b> (${esc(a.admission_no || 'GIS')})</span>
      <span class="badge badge-${(a.status || 'present').toLowerCase()}">${esc(a.status || 'Present')}</span>
    </div>
  `).join('') || '<p style="color:#64748b;">No attendance recorded today.</p>';
}

async function markPresent() {
  const students = cachedStudents.length ? cachedStudents : (getLocalData().students || []);
  if (!students.length) return toast('No student available');
  const s = students[0];
  const today = new Date().toISOString().slice(0, 10);
  await api('/api/attendance', {
    method: 'POST',
    body: JSON.stringify({ student_id: s.id, date: today, status: 'present' })
  });
  toast(`Marked ${s.name} present`);
  renderAttendance();
  renderDashboard();
}

function refreshQR() {
  const qr = document.getElementById('qr');
  if (qr) {
    qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(location.origin + '/portal.html?attendance=' + Date.now())}`;
  }
}

// Teachers
async function renderTeachers() {
  const cards = document.getElementById('teacherCards');
  if (!cards) return;
  const res = await api('/api/teachers');
  const teachers = (res.ok && Array.isArray(res.data)) ? res.data : (getLocalData().teachers || []);

  cards.innerHTML = teachers.map(t => `
    <div class="teacher">
      <div class="teacher-photo">👨‍🏫</div>
      <h3>${esc(t.name)}</h3>
      <p><b>${esc(t.subject || 'Faculty')}</b></p>
      <p style="font-size:12px;color:#64748b;">📞 ${esc(t.phone || '8002856232')}</p>
      <div style="margin-top:10px;">
        <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${t.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function addTeacher() {
  const name = prompt('Teacher Name:');
  if (!name) return;
  const subject = prompt('Department / Subject:', 'Subject Specialist') || 'Faculty';
  const phone = prompt('Contact Number:', '8002856232') || '8002856232';

  (async () => {
    await api('/api/teachers', {
      method: 'POST',
      body: JSON.stringify({ name, subject, phone, email: 'gissupaul@gmail.com' })
    });
    toast('Teacher added');
    renderTeachers();
    renderDashboard();
  })();
}

async function deleteTeacher(id) {
  if (!confirm('Remove teacher?')) return;
  await api(`/api/teachers/${id}`, { method: 'DELETE' });
  toast('Teacher removed');
  renderTeachers();
  renderDashboard();
}

// Events & Notices
async function renderEvents() {
  const list = document.getElementById('eventList');
  const pub = document.getElementById('publicEvents');
  const res = await api('/api/events');
  const events = (res.ok && Array.isArray(res.data)) ? res.data : (getLocalData().events || []);

  if (list) {
    list.innerHTML = events.map(e => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #edf1f5;">
        <span>📅 <b>${esc(e.date)}</b> — ${esc(e.title)}</span>
        <button class="btn btn-sm btn-danger" onclick="deleteEvent(${e.id})">Delete</button>
      </div>
    `).join('') || '<p style="color:#64748b">No events scheduled.</p>';
  }

  if (pub) {
    pub.innerHTML = events.slice(0, 6).map(e => `
      <div class="event"><b>${esc(e.date)}</b> · ${esc(e.title)}</div>
    `).join('') || '<p>Events will appear here.</p>';
  }
}

async function addEvent() {
  const title = document.getElementById('eventTitle')?.value.trim();
  const date = document.getElementById('eventDate')?.value;
  if (!title) return alert('Event title required');
  await api('/api/events', { method: 'POST', body: JSON.stringify({ title, date: date || new Date().toISOString().slice(0, 10) }) });
  document.getElementById('eventTitle').value = '';
  toast('Event added');
  renderEvents();
}

async function deleteEvent(id) {
  if (!confirm('Delete event?')) return;
  await api(`/api/events/${id}`, { method: 'DELETE' });
  toast('Event deleted');
  renderEvents();
}

async function renderNotices() {
  const list = document.getElementById('noticeList');
  const txt = document.getElementById('noticeText');
  const res = await api('/api/notices');
  const notices = (res.ok && Array.isArray(res.data)) ? res.data : (getLocalData().notices || []);

  if (txt && notices.length) txt.textContent = notices[0].body || notices[0].title;
  if (list) {
    list.innerHTML = notices.map(n => `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:12px 0;border-bottom:1px solid #edf1f5;">
        <div><b>${esc(n.title)}</b><p style="margin:4px 0 0;color:#64748b;">${esc(n.body)}</p></div>
        <button class="btn btn-sm btn-danger" onclick="deleteNotice(${n.id})">Delete</button>
      </div>
    `).join('') || '<p style="color:#64748b">No active notices.</p>';
  }
}

async function publishNotice() {
  const input = document.getElementById('noticeInput');
  const text = input?.value.trim();
  if (!text) return alert('Notice text required');
  await api('/api/notices', { method: 'POST', body: JSON.stringify({ title: 'Notice', body: text }) });
  input.value = '';
  toast('Notice published');
  renderNotices();
}

async function deleteNotice(id) {
  if (!confirm('Delete notice?')) return;
  await api(`/api/notices/${id}`, { method: 'DELETE' });
  toast('Notice removed');
  renderNotices();
}

// Printables
function printDoc(title, body) {
  const w = window.open('', '_blank');
  w.document.write(`
    <html><head><title>${title}</title><style>body{font-family:Arial;padding:30px;color:#1e293b}table{width:100%;border-collapse:collapse}th,td{padding:10px;border:1px solid #cbd5e1;text-align:left}th{background:#f1f5f9}</style></head>
    <body>
      <div style="text-align:center;border-bottom:2px solid #0b4f9c;padding-bottom:15px;margin-bottom:20px;">
        <h1 style="color:#0b4f9c;margin:0;">GYANSTHALI INTERNATIONAL SCHOOL</h1>
        <p style="margin:5px 0 0;color:#64748b;">Khairi, Khanpur, Samastipur, Bihar - 848117 · Phone: 8002856232</p>
      </div>
      ${body}
    </body></html>
  `);
  w.document.close();
  w.print();
}

function printReport() {
  const s = document.getElementById('reportStudent')?.value || 'Aman Kumar — Class VIII';
  printDoc('Annual Report Card 2026', `
    <h2>Annual Progress Report Card (2025–2026)</h2>
    <p><b>Student:</b> ${esc(s)} &nbsp;|&nbsp; <b>School Phone:</b> 8002856232</p>
    <table>
      <thead><tr><th>Subject</th><th>Max Marks</th><th>Obtained</th><th>Grade</th></tr></thead>
      <tbody>
        <tr><td>English</td><td>100</td><td>85</td><td>A</td></tr>
        <tr><td>Mathematics</td><td>100</td><td>88</td><td>A</td></tr>
        <tr><td>Science</td><td>100</td><td>90</td><td>A+</td></tr>
        <tr><td>Social Science</td><td>100</td><td>82</td><td>A</td></tr>
        <tr><td>Hindi</td><td>100</td><td>86</td><td>A</td></tr>
      </tbody>
    </table>
    <p style="margin-top:20px;"><b>Overall Attendance:</b> 94% &nbsp;|&nbsp; <b>Result:</b> PASSED WITH DISTINCTION</p>
    <div style="margin-top:60px;display:flex;justify-content:space-between;">
      <div>_______________________<br>Class Teacher Signature</div>
      <div>_______________________<br>Principal Signature</div>
    </div>
  `);
}

function printID() {
  printDoc('Student Identity Card', `
    <div style="border:3px solid #0b4f9c;border-radius:16px;padding:25px;text-align:center;max-width:340px;margin:auto;">
      <div style="font-size:65px;">👨‍🎓</div>
      <h2 style="margin:5px 0;color:#0b4f9c;">Aman Kumar</h2>
      <p style="margin:4px 0;color:#334155;">Class VIII-A · Roll No: 101</p>
      <p style="margin:0;color:#64748b;">Admission No: <b>GIS-001</b></p>
      <hr style="margin:15px 0;border:0;border-top:1px solid #e2e8f0;">
      <p style="margin:3px 0;font-size:13px;">Parent: Ramesh Kumar</p>
      <p style="margin:3px 0;font-size:13px;">Emergency Contact: <b>8002856232</b></p>
    </div>
  `);
}

function printCertificate() {
  printDoc('Certificate of Merit', `
    <div style="border:8px double #0b4f9c;padding:50px 30px;text-align:center;">
      <h1 style="color:#0b4f9c;">CERTIFICATE OF MERIT</h1>
      <p style="color:#64748b;">Proudly presented to</p>
      <h1 style="color:#0f172a;text-decoration:underline;">Aman Kumar</h1>
      <p style="font-size:16px;max-width:600px;margin:auto;line-height:1.7;">
        for outstanding performance in Academics and Co-curricular Activities during the academic year 2025–2026 at Gyansthali International School.
      </p>
      <div style="margin-top:60px;display:flex;justify-content:space-around;">
        <div>____________________<br>Coordinator</div>
        <div>____________________<br>Principal</div>
      </div>
    </div>
  `);
}

function backup() {
  const d = getLocalData();
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `gyansthali-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  toast('Backup JSON downloaded');
}

function payDemo() {
  alert('Demo payment of ₹5,000 processed. Production links with Razorpay/PayU.');
}

function askBot() {
  const i = document.getElementById('chatInput');
  const q = i?.value.trim();
  if (!q) return;

  const log = document.getElementById('chatLog');
  log.innerHTML += `<div class="user">${esc(q)}</div>`;

  const s = q.toLowerCase();
  let ans = 'Please contact our school office at 8002856232 or email gissupaul@gmail.com for details.';

  if (s.includes('admission') || s.includes('apply')) {
    ans = 'Admissions for 2026-27 are open from Nursery to Class X! Apply online on the website or call 8002856232.';
  } else if (s.includes('fee')) {
    ans = 'School fees can be checked and paid through the Parent Portal or at the accounts office.';
  } else if (s.includes('timing') || s.includes('time')) {
    ans = 'School hours: 8:00 AM to 2:00 PM (Monday to Saturday). Office hours: 8:00 AM to 4:00 PM.';
  } else if (s.includes('phone') || s.includes('contact') || s.includes('email')) {
    ans = 'Call +91 80028 56232 or email gissupaul@gmail.com.';
  }

  log.innerHTML += `<div class="bot">${ans}</div>`;
  log.scrollTop = log.scrollHeight;
  i.value = '';
}

function previewUploads() {
  const c = document.getElementById('uploadPreview');
  const files = document.getElementById('galleryFile')?.files;
  if (!c || !files) return;
  c.innerHTML = '';
  [...files].forEach(f => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(f);
    c.appendChild(img);
  });
  toast(`${files.length} photos ready`);
}

function toggleLang() {
  toast('Language toggle: Hindi / English supported');
}

function init() {
  // Public admission form listener
  document.getElementById('admissionForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      student_name: f.get('student'),
      parent_name: f.get('parent'),
      phone: f.get('phone'),
      email: f.get('email') || '',
      class_name: f.get('class') || '',
      session: f.get('session') || '2026-27',
      message: f.get('message') || ''
    };
    await api('/api/admissions', { method: 'POST', body: JSON.stringify(payload) });
    e.target.reset();
    toast('Admission enquiry submitted! Our office will contact you.');
    renderDashboard();
  });

  // Public contact form listener
  document.getElementById('contactForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      name: f.get('name'),
      phone: f.get('phone'),
      email: f.get('email') || '',
      message: f.get('message')
    };
    await api('/api/contacts', { method: 'POST', body: JSON.stringify(payload) });
    e.target.reset();
    toast('Message sent to the school office!');
    renderContacts();
    renderDashboard();
  });

  // Sidebar buttons
  document.querySelectorAll('.side-group button[data-tab]').forEach(btn => {
    btn.onclick = () => showTab(btn.dataset.tab, btn);
  });

  // Initial rendering
  renderDashboard();
  renderStudents();
  renderClasses();
  renderWorkflow();
  renderContacts();
  renderRoles();
  renderTeachers();
  renderNotices();
  renderEvents();
  renderAttendance();
  refreshQR();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}