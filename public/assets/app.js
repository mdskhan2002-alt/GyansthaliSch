// ============================================================
// Gyansthali International School - Master Enterprise Controller
// Supports 12-Step Admission Lifecycle, SIS, Payments & Roles
// Official Contact: 8002856232 | gissupaul@gmail.com
// ============================================================

const STORAGE_KEY = 'gyansthali_data_v4';
const TOKEN_KEY = 'gis_jwt_token';
const USER_KEY = 'gis_user_info';

function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
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
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; }
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

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    if (el.classList.contains('modal-overlay')) el.classList.add('hidden');
    else el.remove();
  }
}

// Navigation Tabs
function showTab(id, btn) {
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  document.querySelectorAll('.side-group button').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const titles = {
    'dashboard': 'Dashboard',
    'all-applications': 'All Applications',
    'new-applications': 'New Applications',
    'pending-verification': 'Pending Verification',
    'doc-verification': 'Document Verification',
    'merit-list': 'Merit List & Waitlist',
    'approved-admissions': 'Approved & Admission Letters',
    'enrollment-desk': 'Enrollment Desk',
    'correction-rejected': 'Corrections & Rejected',
    'students': 'Student Management',
    'parents': 'Parent Directory',
    'classes': 'Classes & Sections',
    'teachers': 'Faculty & Teachers',
    'attendance': 'QR Attendance',
    'exams': 'Exams & Marks',
    'payments-hub': 'Payments & Receipts',
    'contacts': 'Contact Enquiries Dashboard',
    'notices': 'Notices',
    'events': 'Events',
    'certificates': 'ID Cards & Certificates',
    'users': 'User Roles & Permissions',
    'reports': 'System Reports',
    'audit-logs': 'Audit Logs',
    'settings': 'Settings & Security',
    'chatbot': 'School AI Assistant'
  };

  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[id] || id;
  document.body.classList.remove('side-open');
}

// ============================================================
// 1. DASHBOARD & APPS CONTROLLERS
// ============================================================
let allApplicationsCache = [];

async function renderDashboard() {
  const m = document.getElementById('metrics');
  const r = document.getElementById('recentAdmissions');
  if (!m) return;

  const res = await api('/api/stats');
  if (res.ok && res.data) {
    const s = res.data;
    m.innerHTML = `
      <div><b>${s.students}</b><span>Students Enrolled</span></div>
      <div><b>${s.applications}</b><span>Applications Received</span></div>
      <div><b>${s.teachers}</b><span>Faculty Members</span></div>
      <div><b>${s.courses}</b><span>Courses / Grades</span></div>
    `;
  }

  const aRes = await api('/api/applications');
  if (aRes.ok && Array.isArray(aRes.data)) {
    allApplicationsCache = aRes.data;
    if (r) {
      r.innerHTML = allApplicationsCache.slice(0, 5).map(a => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #edf1f5;">
          <div>
            <b>${esc(a.applicant_name)}</b> (${esc(a.application_no)})
            <small style="display:block;color:#64748b;">Parent: ${esc(a.parent_name)} · 📞 ${esc(a.parent_phone)}</small>
          </div>
          <span class="step-pill active" style="font-size:11.5px;">${esc(a.stage)}</span>
        </div>
      `).join('') || '<p style="color:#64748b;">No applications submitted yet.</p>';
    }
  }

  renderAllApplicationsTable();
  renderNewApplications();
  renderPendingVerification();
  renderDocVerification();
  renderMeritList();
  renderApprovedAdmissions();
  renderEnrollmentDesk();
  renderCorrectionRejected();
  renderPaymentsHub();
  renderAuditLogs();
}

// All Applications Table with Search & Status Filter
function renderAllApplicationsTable() {
  const tb = document.getElementById('tableAllApps');
  if (!tb) return;

  const q = (document.getElementById('searchAllApps')?.value || '').toLowerCase();
  const filterStatus = document.getElementById('filterAppStatus')?.value || 'all';

  let list = allApplicationsCache;
  if (filterStatus !== 'all') {
    list = list.filter(a => a.status === filterStatus);
  }
  if (q) {
    list = list.filter(a => (a.applicant_name + a.application_no + a.parent_phone + a.parent_name).toLowerCase().includes(q));
  }

  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:24px;">No applications found matching criteria.</td></tr>';
    return;
  }

  tb.innerHTML = list.map(a => `
    <tr>
      <td><b>${esc(a.application_no)}</b></td>
      <td>${esc(a.applicant_name)}</td>
      <td>Class VI-VIII</td>
      <td>${esc(a.parent_name)}</td>
      <td><a href="tel:${esc(a.parent_phone)}">📞 ${esc(a.parent_phone)}</a></td>
      <td><span class="step-pill active">${esc(a.stage)}</span></td>
      <td><span class="badge badge-${a.status}">${esc(a.status)}</span></td>
      <td>
        <button class="btn btn-sm outline" onclick="viewApplicationModal(${a.id})">Inspect</button>
        <button class="btn btn-sm primary" onclick="quickAdvanceApp(${a.id}, '${a.stage}')">Advance</button>
      </td>
    </tr>
  `).join('');
}

// New Applications
function renderNewApplications() {
  const tb = document.getElementById('tableNewApps');
  if (!tb) return;

  const list = allApplicationsCache.filter(a => a.status === 'new' || a.stage === 'Form' || a.stage === 'Application');
  tb.innerHTML = list.map(a => `
    <tr>
      <td><b>${esc(a.application_no)}</b></td>
      <td>${esc(a.applicant_name)}</td>
      <td>Class Level</td>
      <td>📞 ${esc(a.parent_phone)}</td>
      <td>${esc(a.created_at ? a.created_at.slice(0, 10) : 'Recent')}</td>
      <td>
        <button class="btn btn-sm primary" onclick="quickSetAppStatus(${a.id}, 'pending_verification', 'Verification')">Send to Verification →</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:20px;">No new unverified applications.</td></tr>';
}

// Pending Verification
function renderPendingVerification() {
  const tb = document.getElementById('tablePendingVerif');
  if (!tb) return;

  const list = allApplicationsCache.filter(a => a.status === 'pending_verification' || a.stage === 'Verification');
  tb.innerHTML = list.map(a => `
    <tr>
      <td><b>${esc(a.application_no)}</b></td>
      <td>${esc(a.applicant_name)}</td>
      <td><span class="badge badge-new">3 Documents</span></td>
      <td><span class="badge badge-pending">Verification Pending</span></td>
      <td>
        <button class="btn btn-sm primary" onclick="showTab('doc-verification')">Review Docs Desk →</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:20px;">No applications currently pending verification.</td></tr>';
}

// Document Verification Desk
async function renderDocVerification() {
  const tb = document.getElementById('tableDocVerification');
  if (!tb) return;

  const res = await api('/api/applications/1'); // Fetch active docs sample
  const docs = (res.ok && res.data?.documents) ? res.data.documents : [
    { id: 1, application_no: 'APP-2026-001', document_type: 'Student Photograph', file_name: 'aman-photo.jpg', status: 'verified' },
    { id: 2, application_no: 'APP-2026-001', document_type: 'Birth Certificate', file_name: 'birth-cert.pdf', status: 'verified' },
    { id: 3, application_no: 'APP-2026-002', document_type: 'Aadhar Card', file_name: 'aadhar-doc.pdf', status: 'pending' }
  ];

  tb.innerHTML = docs.map(d => `
    <tr>
      <td><b>${esc(d.application_no)}</b></td>
      <td>Student Candidate</td>
      <td><b>${esc(d.document_type)}</b></td>
      <td><code>${esc(d.file_name)}</code></td>
      <td><span class="badge badge-${d.status === 'verified' ? 'paid' : 'pending'}">${esc(d.status)}</span></td>
      <td>
        <button class="btn btn-sm primary" onclick="verifyDocument(${d.id}, 'verified')">✓ Verify</button>
        <button class="btn btn-sm btn-danger" onclick="verifyDocument(${d.id}, 'correction_required')">⚠️ Flag Correction</button>
      </td>
    </tr>
  `).join('');
}

async function verifyDocument(id, status) {
  await api(`/api/documents/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ status }) });
  toast(`Document ${status}`);
  renderDocVerification();
}

// Merit List & Waitlist
function renderMeritList() {
  const tb = document.getElementById('tableMeritList');
  if (!tb) return;

  const sorted = [...allApplicationsCache].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
  tb.innerHTML = sorted.map((a, idx) => `
    <tr>
      <td><span class="step-pill active" style="padding:3px 10px;">Rank #${idx + 1}</span></td>
      <td><b>${esc(a.application_no)}</b></td>
      <td>${esc(a.applicant_name)}</td>
      <td>Class Level</td>
      <td><b>${a.percentage ? a.percentage + '%' : 'Entrance Evaluated'}</b></td>
      <td><span class="badge badge-${a.status === 'approved' ? 'paid' : 'new'}">${esc(a.status)}</span></td>
      <td>
        <button class="btn btn-sm primary" onclick="approveApplication(${a.id})">Approve for Admission →</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:20px;">No ranked candidates yet.</td></tr>';
}

async function approveApplication(id) {
  const res = await api(`/api/applications/${id}/approve-admission`, { method: 'POST' });
  if (res.ok) {
    toast('Admission approved! Provisional admission letter generated.');
    renderDashboard();
  }
}

// Approved Admissions & Letters
function renderApprovedAdmissions() {
  const tb = document.getElementById('tableApprovedAdmissions');
  if (!tb) return;

  const list = allApplicationsCache.filter(a => a.status === 'approved' || a.stage === 'Admission Approval' || a.status === 'admitted');
  tb.innerHTML = list.map(a => `
    <tr>
      <td><b>${esc(a.application_no)}</b></td>
      <td><b>${esc(a.applicant_name)}</b></td>
      <td>Class Level</td>
      <td>📞 ${esc(a.parent_phone)}</td>
      <td>
        <a class="btn btn-sm outline" href="/api/applications/${a.id}/admission-letter" target="_blank">📜 View / Print Letter</a>
      </td>
      <td>
        <button class="btn btn-sm primary" onclick="enrollApplicantDirectly(${a.id})">Complete Enrollment →</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:20px;">No approved applications waiting.</td></tr>';
}

// Enrollment Desk
function renderEnrollmentDesk() {
  const tb = document.getElementById('tableEnrollmentDesk');
  if (!tb) return;

  const list = allApplicationsCache.filter(a => a.stage === 'Fee Payment' || a.status === 'approved' || a.status === 'admitted');
  tb.innerHTML = list.map(a => `
    <tr>
      <td><b>${esc(a.application_no)}</b></td>
      <td>${esc(a.applicant_name)}</td>
      <td>Section A</td>
      <td><span class="badge badge-paid">Fee Received</span></td>
      <td>
        ${a.status === 'admitted' ? '<span class="badge badge-paid">✓ Enrolled (GIS-001)</span>' : `<button class="btn btn-sm primary" onclick="enrollApplicantDirectly(${a.id})">🎓 Issue Admission No.</button>`}
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:20px;">No students pending final enrollment.</td></tr>';
}

async function enrollApplicantDirectly(id) {
  const res = await api(`/api/applications/${id}/enroll`, { method: 'POST' });
  if (res.ok) {
    toast(`Student enrolled with ${res.data.admission_no}!`);
    renderDashboard();
    renderStudents();
  }
}

// Discrepancies, Corrections & Rejected
function renderCorrectionRejected() {
  const tb = document.getElementById('tableCorrectionRejected');
  if (!tb) return;

  const list = allApplicationsCache.filter(a => a.status === 'correction_required' || a.status === 'rejected');
  tb.innerHTML = list.map(a => `
    <tr>
      <td><b>${esc(a.application_no)}</b></td>
      <td>${esc(a.applicant_name)}</td>
      <td><span class="badge badge-${a.status === 'rejected' ? 'absent' : 'pending'}">${esc(a.status)}</span></td>
      <td><small>${esc(a.verification_remarks || 'Document re-upload needed')}</small></td>
      <td>
        <a class="btn btn-sm outline" href="https://wa.me/91${esc(a.parent_phone)}?text=Update%20regarding%20Gyansthali%20Application%20${esc(a.application_no)}" target="_blank">💬 WhatsApp</a>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:20px;">No flagged or rejected applications.</td></tr>';
}

async function quickSetAppStatus(id, status, stage) {
  await api(`/api/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  if (stage) await api(`/api/applications/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) });
  toast('Application updated');
  renderDashboard();
}

function quickAdvanceApp(id, currentStage) {
  const stages = ['Application', 'Form', 'Documents', 'Verification', 'Selection', 'Admission Approval', 'Fee Payment', 'Enrollment'];
  const idx = stages.indexOf(currentStage);
  if (idx < stages.length - 1) {
    quickSetAppStatus(id, 'in_progress', stages[idx + 1]);
  }
}

function viewApplicationModal(id) {
  const a = allApplicationsCache.find(x => x.id === id);
  if (!a) return;
  alert(`Application ${a.application_no}\nApplicant: ${a.applicant_name}\nParent: ${a.parent_name}\nPhone: ${a.parent_phone}\nAddress: ${a.permanent_address}\nStage: ${a.stage}`);
}

// ============================================================
// 2. PAYMENTS HUB & AUDIT LOGS
// ============================================================
async function renderPaymentsHub() {
  const tb = document.getElementById('tablePaymentsHub');
  if (!tb) return;

  const res = await api('/api/payments');
  const payments = (res.ok && Array.isArray(res.data)) ? res.data : [];

  tb.innerHTML = payments.map(p => `
    <tr>
      <td><b>${esc(p.payment_no)}</b></td>
      <td><code>${esc(p.receipt_no)}</code></td>
      <td>${esc(p.application_no || 'Student Record')}</td>
      <td>${esc(p.type)}</td>
      <td><b>₹${Number(p.amount).toLocaleString('en-IN')}</b></td>
      <td>${esc(p.payment_method)}</td>
      <td><span class="badge badge-paid">${esc(p.status)}</span></td>
      <td><small>${esc(p.paid_at ? p.paid_at.slice(0, 10) : 'Recent')}</small></td>
    </tr>
  `).join('') || '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:20px;">No payments recorded.</td></tr>';
}

async function renderAuditLogs() {
  const tb = document.getElementById('tableAuditLogs');
  if (!tb) return;

  const res = await api('/api/audit-logs');
  const logs = (res.ok && Array.isArray(res.data)) ? res.data : [];

  tb.innerHTML = logs.map(l => `
    <tr>
      <td><small>${esc(l.created_at ? l.created_at.replace('T', ' ').slice(0, 19) : 'Recent')}</small></td>
      <td>User #${esc(l.user_id)}</td>
      <td><b>${esc(l.action)}</b></td>
      <td>${esc(l.entity)}</td>
      <td><small>${esc(l.details)}</small></td>
      <td><code>${esc(l.ip_address)}</code></td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:20px;">No audit logs yet.</td></tr>';
}

// ============================================================
// 3. STUDENT MANAGEMENT (Single, Bulk, Edit, Delete)
// ============================================================
let cachedStudents = [];
let selectedStudentIds = new Set();

async function renderStudents() {
  const tb = document.getElementById('studentTable');
  if (!tb) return;

  const res = await api('/api/students');
  cachedStudents = (res.ok && Array.isArray(res.data)) ? res.data : [];

  const q = (document.getElementById('studentSearch')?.value || '').toLowerCase();
  const filtered = cachedStudents.filter(s => {
    return `${s.name} ${s.admission_no || ''} ${s.class_name || ''} ${s.parent_name || ''} ${s.parent_phone || ''}`.toLowerCase().includes(q);
  });

  if (!filtered.length) {
    tb.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#64748b;padding:24px;">No students found.</td></tr>';
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
        <td><a href="tel:${esc(s.parent_phone || '')}">📞 ${esc(s.parent_phone || '8002856232')}</a></td>
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
  if (checked) cachedStudents.forEach(s => selectedStudentIds.add(s.id));
  else selectedStudentIds.clear();
  renderStudents();
}

async function deleteSelectedStudents() {
  if (!selectedStudentIds.size) return;
  if (!confirm(`Delete ${selectedStudentIds.size} selected students?`)) return;

  const ids = Array.from(selectedStudentIds);
  await api('/api/students/delete-multiple', { method: 'POST', body: JSON.stringify({ ids }) });
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
        <h3>${isEdit ? 'Edit Student Details' : 'Add New Student'}</h3>
        <div>
          <label><small><b>Student Full Name *</b></small></label>
          <input id="modalStudentName" value="${esc(existing?.name || '')}" placeholder="Full name">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label><small><b>Admission Number</b></small></label>
            <input id="modalStudentAdm" value="${esc(existing?.admission_no || '')}" placeholder="e.g. GIS-004">
          </div>
          <div>
            <label><small><b>Roll Number</b></small></label>
            <input id="modalStudentRoll" value="${esc(existing?.roll_no || '')}" placeholder="e.g. 104">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label><small><b>Class</b></small></label>
            <input id="modalStudentClass" value="${esc(existing?.class_name || 'Class VIII')}">
          </div>
          <div>
            <label><small><b>Section</b></small></label>
            <input id="modalStudentSection" value="${esc(existing?.section || 'A')}">
          </div>
        </div>
        <div>
          <label><small><b>Parent / Guardian Name</b></small></label>
          <input id="modalStudentParent" value="${esc(existing?.parent_name || '')}">
        </div>
        <div>
          <label><small><b>Parent Contact Phone *</b></small></label>
          <input id="modalStudentPhone" value="${esc(existing?.parent_phone || '8002856232')}">
        </div>
        <div>
          <label><small><b>Address</b></small></label>
          <input id="modalStudentAddress" value="${esc(existing?.address || 'Khairi, Khanpur')}">
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

  if (!name) return alert('Name required');
  const payload = { name, admission_no: admNo, roll_no: rollNo, class_name: className, section, parent_name: parent, parent_phone: phone, address };

  if (id) {
    await api(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    toast('Student details updated');
  } else {
    await api('/api/students', { method: 'POST', body: JSON.stringify(payload) });
    toast('Student record added');
  }

  closeModal('studentModal');
  renderStudents();
  renderDashboard();
}

async function deleteStudent(id) {
  if (!confirm('Delete student record?')) return;
  await api(`/api/students/${id}`, { method: 'DELETE' });
  toast('Student deleted');
  renderStudents();
  renderDashboard();
}

function openBulkStudentModal() {
  const html = `
    <div class="modal-overlay" id="bulkStudentModal">
      <div class="modal-card" style="max-width:650px;">
        <h3>Multiple / Bulk Student Entry</h3>
        <p style="color:#64748b;font-size:13px;margin:0 0 10px;">Enter one student per line: <code>Name, Class, Section, Roll, Parent Name, Phone</code></p>
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
  if (!text) return alert('Enter student data');
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

  await api('/api/students/bulk', { method: 'POST', body: JSON.stringify({ students }) });
  toast(`Imported ${students.length} students!`);
  closeModal('bulkStudentModal');
  renderStudents();
  renderDashboard();
}

// Parent Directory
function renderParents() {
  const tb = document.getElementById('parentTable');
  if (!tb) return;

  tb.innerHTML = cachedStudents.map(s => `
    <tr>
      <td><b>${esc(s.parent_name || 'Guardian')}</b></td>
      <td>${esc(s.name)} (${esc(s.admission_no || '')})</td>
      <td>${esc(s.class_name || '—')}</td>
      <td><a href="tel:${esc(s.parent_phone || '8002856232')}">📞 ${esc(s.parent_phone || '8002856232')}</a></td>
      <td><code>1234</code></td>
      <td>
        <a class="btn btn-sm outline" href="https://wa.me/91${esc(s.parent_phone || '8002856232')}?text=Update%20from%20Gyansthali%20International%20School" target="_blank">💬 WhatsApp</a>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:20px;">No parent records linked.</td></tr>';
}

// Classes & Sections
async function renderClasses() {
  const tb = document.getElementById('classTable');
  if (!tb) return;

  const res = await api('/api/classes');
  const classes = (res.ok && Array.isArray(res.data)) ? res.data : [];

  tb.innerHTML = classes.map(c => `
    <tr>
      <td><b>${esc(c.name)}</b></td>
      <td>${esc(c.sections || 'A, B')}</td>
      <td><span class="badge badge-new">${esc(c.total_students || 0)} Students</span></td>
      <td>${esc(c.teacher_incharge || 'Faculty')}</td>
      <td>
        <button class="btn btn-sm outline" onclick="toast('Class configuration saved')">Edit</button>
      </td>
    </tr>
  `).join('');
}

function openAddClassModal() {
  const name = prompt('Class Name:');
  if (!name) return;
  const sections = prompt('Sections:', 'A, B') || 'A, B';
  const teacher = prompt('Teacher in charge:', 'Faculty Member') || 'Faculty Member';

  (async () => {
    await api('/api/classes', { method: 'POST', body: JSON.stringify({ name, sections, teacher_incharge: teacher }) });
    toast('Class added');
    renderClasses();
  })();
}

// User Roles & Permissions (Editable)
async function renderRoles() {
  const tb = document.getElementById('roleTable');
  if (!tb) return;

  const res = await api('/api/roles');
  const roles = (res.ok && Array.isArray(res.data)) ? res.data : [];

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
  if (!access_modules) return alert('Accessible modules required');

  await api(`/api/roles/${id}`, { method: 'PUT', body: JSON.stringify({ access_modules, description }) });
  toast('Permissions updated');
  closeModal('roleModal');
  renderRoles();
}

// Contact Enquiries Dashboard (Fixed)
async function renderContacts() {
  const tb = document.getElementById('contactTable');
  if (!tb) return;

  const res = await api('/api/contacts');
  const contacts = (res.ok && Array.isArray(res.data)) ? res.data : [];

  tb.innerHTML = contacts.map(c => `
    <tr>
      <td><small>${esc(c.created_at ? c.created_at.slice(0, 10) : 'Recent')}</small></td>
      <td><b>${esc(c.name)}</b></td>
      <td>
        <a href="tel:${esc(c.phone)}">📞 ${esc(c.phone)}</a><br>
        <a href="https://wa.me/91${esc(c.phone)}" target="_blank" style="font-size:12px;color:#16a34a;">💬 WhatsApp</a>
      </td>
      <td>${esc(c.email || '—')}</td>
      <td><small>${esc(c.message)}</small></td>
      <td><span class="badge badge-${c.status === 'Resolved' ? 'resolved' : 'new'}">${esc(c.status)}</span></td>
      <td>
        <button class="btn btn-sm primary" onclick="updateContactStatus(${c.id}, 'Replied')">Mark Replied</button>
        <button class="btn btn-sm btn-danger" onclick="deleteContact(${c.id})">Delete</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:20px;">No messages received.</td></tr>';
}

async function updateContactStatus(id, status) {
  await api(`/api/contacts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  toast(`Enquiry marked ${status}`);
  renderContacts();
}

async function deleteContact(id) {
  if (!confirm('Delete enquiry?')) return;
  await api(`/api/contacts/${id}`, { method: 'DELETE' });
  toast('Enquiry deleted');
  renderContacts();
}

// Reports Generation
async function generateReport(type) {
  const out = document.getElementById('reportOutput');
  if (!out) return;
  out.style.display = 'block';

  if (type === 'students') {
    const res = await api('/api/reports/students');
    const data = res.ok ? res.data : { title: 'Student Enrollment Report', count: cachedStudents.length, data: cachedStudents, date: new Date().toISOString().slice(0, 10) };
    const list = data.data || [];

    out.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
        <div>
          <h3 style="margin:0;">🎓 ${data.title}</h3>
          <small style="color:#64748b;">Generated on ${data.date} · Total Enrolled: ${list.length}</small>
        </div>
        <button class="btn btn-sm primary" onclick="printDoc('Student Enrollment Report', document.getElementById('repTable').outerHTML)">🖨️ Print / Save PDF</button>
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
    const list = res.ok ? res.data : [];
    out.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
        <h3 style="margin:0;">📱 Attendance Summary Report</h3>
        <button class="btn btn-sm primary" onclick="printDoc('Attendance Report', document.getElementById('attTable').outerHTML)">🖨️ Print / Save PDF</button>
      </div>
      <div class="table-wrap" id="attTable">
        <table>
          <thead><tr><th>Date</th><th>Student</th><th>Status</th></tr></thead>
          <tbody>
            ${list.map(a => `<tr><td>${esc(a.date)}</td><td>${esc(a.name || 'Student')}</td><td><span class="badge badge-${(a.status || '').toLowerCase()}">${esc(a.status)}</span></td></tr>`).join('') || '<tr><td colspan="3">No attendance data</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } else if (type === 'fees') {
    const res = await api('/api/reports/payments');
    const list = (res.ok && res.data?.data) ? res.data.data : [];
    out.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
        <h3 style="margin:0;">💳 Fee Collection Audit Report</h3>
        <button class="btn btn-sm primary" onclick="printDoc('Fee Collection Report', document.getElementById('feeRepTable').outerHTML)">🖨️ Print / Save PDF</button>
      </div>
      <div class="table-wrap" id="feeRepTable">
        <table>
          <thead><tr><th>Receipt</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            ${list.map(f => `<tr><td>${esc(f.receipt_no)}</td><td>${esc(f.type)}</td><td>₹${Number(f.amount).toLocaleString('en-IN')}</td><td><span class="badge badge-paid">${esc(f.status)}</span></td><td>${esc(f.paid_at ? f.paid_at.slice(0, 10) : '')}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

// Printable Handlers
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
        for outstanding performance in Academics and Co-curricular Activities during 2025–2026.
      </p>
      <div style="margin-top:60px;display:flex;justify-content:space-around;">
        <div>____________________<br>Coordinator</div>
        <div>____________________<br>Principal</div>
      </div>
    </div>
  `);
}

function backup() {
  const d = { exported_at: new Date().toISOString(), status: 'active' };
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `gyansthali-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  toast('Backup JSON downloaded');
}

function payDemo() {
  alert('Demo payment processed. Live deployment connects with Razorpay / PayU gateway.');
}

function askBot() {
  const i = document.getElementById('chatInput');
  const q = i?.value.trim();
  if (!q) return;

  const log = document.getElementById('chatLog');
  log.innerHTML += `<div class="user">${esc(q)}</div>`;

  const s = q.toLowerCase();
  let ans = 'Please contact the school admissions office at 8002856232 or email gissupaul@gmail.com.';

  if (s.includes('admission') || s.includes('apply')) {
    ans = 'Admissions 2026-27 are open from Nursery to Class X. Complete the 12-step online application on our portal!';
  } else if (s.includes('fee')) {
    ans = 'Application processing fee is ₹500. Term admission fee is ₹5,000 payable online with digital receipt generation.';
  } else if (s.includes('timing')) {
    ans = 'School timings: 8:00 AM to 2:00 PM (Monday to Saturday). Office hours: 8:00 AM to 4:00 PM.';
  } else if (s.includes('phone') || s.includes('contact')) {
    ans = 'Call +91 80028 56232 or WhatsApp +91 80028 56232.';
  }

  log.innerHTML += `<div class="bot">${ans}</div>`;
  log.scrollTop = log.scrollHeight;
  i.value = '';
}

function toggleLang() {
  toast('Language toggle: Hindi / English supported');
}

function refreshQR() {
  const qr = document.getElementById('qr');
  if (qr) {
    qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(location.origin + '/portal.html?scan=' + Date.now())}`;
  }
}

// Initialization
function init() {
  document.querySelectorAll('.side-group button[data-tab]').forEach(btn => {
    btn.onclick = () => showTab(btn.dataset.tab, btn);
  });

  renderDashboard();
  renderStudents();
  renderClasses();
  renderRoles();
  renderContacts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}