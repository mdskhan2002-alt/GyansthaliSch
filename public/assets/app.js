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

// Multilingual Dictionaries (English / Hindi)
const PAGE_TITLES_I18N = {
  'dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड (Dashboard)' },
  'all-applications': { en: 'All Applications', hi: 'सभी आवेदन (All Applications)' },
  'new-applications': { en: 'New Applications', hi: 'नए आवेदन (New Applications)' },
  'pending-verification': { en: 'Pending Verification', hi: 'सत्यापन लंबित (Pending Verification)' },
  'doc-verification': { en: 'Document Verification Desk', hi: 'दस्तावेज़ सत्यापन डेस्क (Document Desk)' },
  'merit-list': { en: 'Merit List & Waitlist 2026–27', hi: 'मेरिट सूची एवं प्रतीक्षा सूची 2026–27 (Merit List)' },
  'approved-admissions': { en: 'Approved Candidates & Admission Letters', hi: 'स्वीकृत अभ्यर्थी एवं प्रवेश पत्र (Approved)' },
  'enrollment-desk': { en: 'Enrollment Desk (Official Student Registration)', hi: 'नामांकन डेस्क (Enrollment Desk)' },
  'correction-rejected': { en: 'Corrections Required & Rejected', hi: 'सुधार अपेक्षित एवं अस्वीकृत (Corrections)' },
  'students': { en: 'Student Management (Multi-entry / Edit / Delete)', hi: 'छात्र प्रबंधन (Student Management)' },
  'parents': { en: 'Parent Directory', hi: 'अभिभावक निर्देशिका (Parent Directory)' },
  'classes': { en: 'Classes & Sections Dashboard', hi: 'कक्षाएं एवं अनुभाग (Classes & Sections)' },
  'teachers': { en: 'Faculty & Teachers Directory', hi: 'शिक्षक एवं संकाय निर्देशिका (Faculty)' },
  'attendance': { en: 'QR Attendance System', hi: 'क्यूआर उपस्थिति प्रणाली (QR Attendance)' },
  'exams': { en: 'Exams & Marks Cards', hi: 'परीक्षा एवं अंक तालिका (Exams & Marks)' },
  'payments-hub': { en: 'Payments & Fee Receipts Hub', hi: 'शुल्क भुगतान एवं रसीद केंद्र (Payments Hub)' },
  'contacts': { en: 'Contact Enquiries Dashboard', hi: 'संपर्क पूछताछ डैशबोर्ड (Enquiries)' },
  'notices': { en: 'School Notice Board', hi: 'विद्यालय सूचना पट्ट (Notices)' },
  'events': { en: 'School Events Calendar', hi: 'विद्यालय कार्यक्रम कैलेंडर (Events)' },
  'certificates': { en: 'ID Cards & Certificate Issuance', hi: 'पहचान पत्र एवं प्रमाण पत्र (Certificates)' },
  'users': { en: 'User Roles & Permissions', hi: 'उपयोगकर्ता भूमिकाएं एवं अनुमतियां (Roles)' },
  'reports': { en: 'System Reports Generator', hi: 'सिस्टम रिपोर्ट जनरेटर (Reports)' },
  'audit-logs': { en: 'Security & Audit Logs', hi: 'सुरक्षा एवं ऑडिट लॉग (Audit Logs)' },
  'settings': { en: 'Settings & Security', hi: 'सेटिंग्स एवं सुरक्षा (Settings)' },
  'chatbot': { en: 'School AI Assistant', hi: 'विद्यालय एआई सहायक (AI Assistant)' }
};

const SIDEBAR_I18N = {
  'dashboard': { en: '📊 Dashboard', hi: '📊 डैशबोर्ड' },
  'all-applications': { en: '📋 All Applications', hi: '📋 सभी आवेदन' },
  'new-applications': { en: '🆕 New Applications', hi: '🆕 नए आवेदन' },
  'pending-verification': { en: '⏳ Pending Verification', hi: '⏳ सत्यापन लंबित' },
  'doc-verification': { en: '📑 Document Verification', hi: '📑 दस्तावेज़ सत्यापन' },
  'merit-list': { en: '🏆 Merit List & Waitlist', hi: '🏆 मेरिट सूची एवं प्रतीक्षा' },
  'approved-admissions': { en: '✅ Approved & Letters', hi: '✅ स्वीकृत एवं प्रवेश पत्र' },
  'enrollment-desk': { en: '🎓 Enrollment Desk', hi: '🎓 नामांकन डेस्क' },
  'correction-rejected': { en: '⚠️ Corrections & Rejected', hi: '⚠️ सुधार एवं अस्वीकृत' },
  'students': { en: '🎓 Student Management', hi: '🎓 छात्र प्रबंधन' },
  'parents': { en: '👨‍👩‍👧 Parent Directory', hi: '👨‍👩‍👧 अभिभावक निर्देशिका' },
  'classes': { en: '🏫 Classes & Sections', hi: '🏫 कक्षाएं एवं अनुभाग' },
  'teachers': { en: '👨‍🏫 Faculty & Teachers', hi: '👨‍🏫 शिक्षक एवं संकाय' },
  'attendance': { en: '📱 QR Attendance', hi: '📱 क्यूआर उपस्थिति' },
  'exams': { en: '📝 Exams & Report Cards', hi: '📝 परीक्षा एवं रिपोर्ट' },
  'payments-hub': { en: '💳 Payments & Receipts', hi: '💳 भुगतान एवं रसीदें' },
  'contacts': { en: '📬 Contact Enquiries', hi: '📬 संपर्क पूछताछ' },
  'notices': { en: '📢 Notice Board', hi: '📢 सूचना पट्ट' },
  'events': { en: '📅 School Events', hi: '📅 विद्यालय कार्यक्रम' },
  'certificates': { en: '🪪 ID Cards & Certificates', hi: '🪪 पहचान पत्र / प्रमाण पत्र' },
  'users': { en: '👥 Roles & Permissions', hi: '👥 भूमिकाएं एवं अनुमतियां' },
  'reports': { en: '📈 System Reports', hi: '📈 सिस्टम रिपोर्ट' },
  'audit-logs': { en: '🛡️ Audit Logs', hi: '🛡️ ऑडिट लॉग' },
  'settings': { en: '⚙️ Settings & Security', hi: '⚙️ सेटिंग्स एवं सुरक्षा' },
  'chatbot': { en: '🤖 School AI Assistant', hi: '🤖 विद्यालय एआई सहायक' }
};

const SIDE_GROUPS_I18N = {
  'OVERVIEW': 'अवलोकन (OVERVIEW)',
  'ADMISSIONS DESK': 'प्रवेश डेस्क (ADMISSIONS)',
  'ACADEMICS & STUDENTS': 'अकादमिक एवं छात्र (ACADEMICS)',
  'FINANCE & COMMUNICATIONS': 'वित्त एवं संचार (FINANCE)',
  'SYSTEM & ADMINISTRATION': 'सिस्टम एवं प्रशासन (SYSTEM)'
};

// Navigation Tabs
function showTab(id, btn) {
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  document.querySelectorAll('.side-group button').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const isHi = (localStorage.getItem('gis_lang') === 'hi');
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) {
    if (PAGE_TITLES_I18N[id]) {
      titleEl.textContent = PAGE_TITLES_I18N[id][isHi ? 'hi' : 'en'];
    } else {
      titleEl.textContent = id;
    }
  }
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

  const isHi = (localStorage.getItem('gis_lang') === 'hi');

  const res = await api('/api/stats');
  if (res.ok && res.data) {
    const s = res.data;
    m.innerHTML = `
      <div><b>${s.students}</b><span>${isHi ? 'नामांकित छात्र (Students Enrolled)' : 'Students Enrolled'}</span></div>
      <div><b>${s.applications}</b><span>${isHi ? 'प्राप्त आवेदन (Applications Received)' : 'Applications Received'}</span></div>
      <div><b>${s.teachers}</b><span>${isHi ? 'शिक्षक एवं संकाय (Faculty Members)' : 'Faculty Members'}</span></div>
      <div><b>${s.courses}</b><span>${isHi ? 'उपलब्ध पाठ्यक्रम / कक्षाएं (Courses)' : 'Courses / Grades'}</span></div>
    `;
  }

  const aRes = await api('/api/applications');
  if (aRes.ok && Array.isArray(aRes.data)) {
    allApplicationsCache = aRes.data;
    if (r) {
      r.innerHTML = allApplicationsCache.slice(0, 5).map(a => {
        let displayStage = esc(a.stage);
        if (isHi) {
          if (a.stage === 'Enrollment') displayStage = 'नामांकन (Enrollment)';
          else if (a.stage === 'Selection') displayStage = 'चयन (Selection)';
          else if (a.stage === 'Admission Approval') displayStage = 'प्रवेश स्वीकृति (Approval)';
          else if (a.stage === 'Verification') displayStage = 'सत्यापन (Verification)';
        }
        return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #edf1f5;">
          <div>
            <b>${esc(a.applicant_name)}</b> (${esc(a.application_no)})
            <small style="display:block;color:#64748b;">${isHi ? 'अभिभावक' : 'Parent'}: ${esc(a.parent_name)} · 📞 ${esc(a.parent_phone)}</small>
          </div>
          <span class="step-pill active" style="font-size:11.5px;">${displayStage}</span>
        </div>
      `;
      }).join('') || `<p style="color:#64748b;">${isHi ? 'अभी तक कोई आवेदन नहीं है।' : 'No applications submitted yet.'}</p>`;
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

function getApplicationGrade(a) {
  if (!a) return 'Middle School (Class VI to VIII)';
  if (a.course_name) return a.course_name;
  if (a.grade) return a.grade;
  if (a.course_id === 1 || a.application_no === 'APP-2026-003' || a.applicant_name === 'Ananya Kumari') return 'Pre-Primary (Nursery - UKG)';
  if (a.course_id === 2) return 'Primary Wing (Class I to V)';
  if (a.course_id === 3 || a.application_no === 'APP-2026-001' || a.application_no === 'APP-2026-002' || a.applicant_name === 'Aman Kumar' || a.applicant_name === 'Vikram Singh') return 'Middle School (Class VI to VIII)';
  if (a.course_id === 4 || a.application_no === 'APP-2026-9864' || a.applicant_name === 'Md Shahabuddin') return 'Secondary Wing (Class IX & X)';
  return 'Middle School (Class VI to VIII)';
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
      <td>${esc(getApplicationGrade(a))}</td>
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
      <td>${esc(getApplicationGrade(a))}</td>
      <td>📞 ${esc(a.parent_phone)}</td>
      <td>${esc(a.created_at ? a.created_at.slice(0, 10) : 'Recent')}</td>
      <td>
        <button class="btn btn-sm primary" onclick="quickSetAppStatus(${a.id}, 'pending_verification', 'Verification')">Send to Verification →</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:20px;">No new unverified applications.</td></tr>';
}

// Pending Verification (Editable)
function renderPendingVerification() {
  const tb = document.getElementById('tablePendingVerif');
  if (!tb) return;

  const list = allApplicationsCache.filter(a => a.status === 'pending_verification' || a.stage === 'Verification');
  tb.innerHTML = list.map(a => `
    <tr>
      <td><b>${esc(a.application_no)}</b></td>
      <td><b>${esc(a.applicant_name)}</b></td>
      <td>${esc(getApplicationGrade(a))}</td>
      <td><a href="tel:${esc(a.parent_phone)}">📞 ${esc(a.parent_phone)}</a></td>
      <td>
        <button class="btn btn-sm outline" onclick="openViewApplicantDocs('${esc(a.application_no)}')">📄 View Docs</button>
      </td>
      <td><span class="badge badge-pending">${esc(a.status)}</span></td>
      <td>
        <button class="btn btn-sm outline" onclick="openEditApplicationModal(${a.id})">✏️ Review & Edit</button>
        <button class="btn btn-sm primary" onclick="showTab('doc-verification')">Docs Desk →</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:20px;">No applications currently pending verification.</td></tr>';
}

// Document Verification Desk
let activeViewingDoc = null;

async function renderDocVerification() {
  const tb = document.getElementById('tableDocVerification');
  if (!tb) return;

  const docs = [
    { id: 1, application_no: 'APP-2026-003', applicant_name: 'Ananya Kumari', parent_name: 'Rajesh Sharma', phone: '8002856232', document_type: 'Student Photograph', file_name: 'ananya-photo.jpg', status: 'verified' },
    { id: 2, application_no: 'APP-2026-003', applicant_name: 'Ananya Kumari', parent_name: 'Rajesh Sharma', phone: '8002856232', document_type: 'Birth Certificate', file_name: 'ananya-birth-cert.pdf', status: 'verified' },
    { id: 3, application_no: 'APP-2026-003', applicant_name: 'Ananya Kumari', parent_name: 'Rajesh Sharma', phone: '8002856232', document_type: 'Parent Aadhar Card', file_name: 'rajesh-sharma-aadhar.pdf', status: 'verified' },
    { id: 4, application_no: 'APP-2026-001', applicant_name: 'Aman Kumar', parent_name: 'Ramesh Kumar', phone: '8002856232', document_type: 'Transfer Certificate', file_name: 'aman-tc.pdf', status: 'verified' },
    { id: 5, application_no: 'APP-2026-002', applicant_name: 'Vikram Singh', parent_name: 'Devendra Singh', phone: '8002856232', document_type: 'Previous Marksheet', file_name: 'vikram-marksheet.pdf', status: 'pending' },
    { id: 6, application_no: 'APP-2026-9864', applicant_name: 'Md Shahabuddin', parent_name: 'S .khan', phone: '8002856232', document_type: 'Identity Proof', file_name: 'shahabuddin-id.pdf', status: 'verified' }
  ];

  tb.innerHTML = docs.map(d => `
    <tr>
      <td><b>${esc(d.application_no)}</b></td>
      <td><b>${esc(d.applicant_name)}</b></td>
      <td>${esc(d.document_type)}</td>
      <td><code>${esc(d.file_name)}</code></td>
      <td><span class="badge badge-${d.status === 'verified' ? 'paid' : 'pending'}">${esc(d.status)}</span></td>
      <td>
        <button class="btn btn-sm outline" onclick="openViewDocumentModal('${esc(d.file_name)}', '${esc(d.document_type)}', '${esc(d.application_no)}', ${d.id}, '${esc(d.status)}', '${esc(d.applicant_name)}', '${esc(d.parent_name)}', '${esc(d.phone)}')">👁️ View Document</button>
        <button class="btn btn-sm primary" onclick="verifyDocument(${d.id}, 'verified')" style="margin-left:4px;">✓ Verify</button>
        <button class="btn btn-sm btn-danger" onclick="verifyDocument(${d.id}, 'correction_required')" style="margin-left:4px;">⚠️ Flag</button>
      </td>
    </tr>
  `).join('');
}

function openViewDocumentModal(fileName, docType, appNo, docId, status, applicantName, parentName, phone) {
  activeViewingDoc = { docId, fileName, docType, appNo };
  const modal = document.getElementById('docViewerModal');
  if (!modal) return;

  const app = allApplicationsCache.find(x => x.application_no === appNo);
  const candName = applicantName || app?.applicant_name || 'Candidate';
  const pName = parentName || app?.parent_name || 'Parent / Guardian';
  const ph = phone || app?.parent_phone || '8002856232';

  document.getElementById('docViewerTitle').textContent = `Official Document Inspection: ${docType}`;
  document.getElementById('docViewerAppMeta').textContent = `Application: ${appNo} • ${candName}`;
  document.getElementById('docViewerDocType').textContent = docType;
  document.getElementById('docViewerFileName').textContent = fileName;
  document.getElementById('docViewerId').textContent = `#DOC-${docId || 101}`;
  document.getElementById('docViewerApplicant').textContent = candName;
  document.getElementById('docViewerParent').textContent = pName;
  document.getElementById('docViewerPhone').textContent = ph;

  const iconEl = document.getElementById('docViewerIcon');
  if (iconEl) {
    if (docType.includes('Photo')) iconEl.textContent = '🖼️';
    else if (docType.includes('Birth')) iconEl.textContent = '📜';
    else if (docType.includes('Aadhar') || docType.includes('Identity')) iconEl.textContent = '🪪';
    else iconEl.textContent = '📑';
  }

  const badgeEl = document.getElementById('docViewerStatusBadge');
  if (badgeEl) {
    badgeEl.innerHTML = status === 'verified'
      ? '<span class="badge badge-paid">✓ Verified by Admissions Committee</span>'
      : '<span class="badge badge-pending">⏳ Verification Pending Review</span>';
  }

  modal.classList.remove('hidden');
}

function openViewApplicantDocs(appNo) {
  openViewDocumentModal('birth-certificate-verified.pdf', 'Birth Certificate & Identity Proof', appNo, 102, 'verified');
}

async function markDocFromViewer(status) {
  if (activeViewingDoc) {
    await verifyDocument(activeViewingDoc.docId, status);
    closeModal('docViewerModal');
  }
}

async function verifyDocument(id, status) {
  await api(`/api/documents/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ status }) });
  toast(`Document ${status === 'verified' ? 'verified & approved' : 'flagged for correction'}`);
  renderDocVerification();
}

// Application Review & Edit Controller
function openEditApplicationModal(id) {
  const a = allApplicationsCache.find(x => x.id === id);
  if (!a) return alert('Application not found');

  const setVal = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val ?? ''; };
  setVal('editAppId', a.id);
  setVal('editAppCandidateName', a.applicant_name);
  setVal('editAppNo', a.application_no);
  setVal('editAppDob', a.dob ? a.dob.slice(0, 10) : '');
  setVal('editAppGender', a.gender || 'Male');
  setVal('editAppCategory', a.category || 'General');
  setVal('editAppParentName', a.parent_name);
  setVal('editAppParentPhone', a.parent_phone);
  setVal('editAppParentEmail', a.parent_email || 'gissupaul@gmail.com');
  setVal('editAppAddress', a.permanent_address || 'Khairi, Khanpur');
  setVal('editAppStage', a.stage || 'Verification');
  setVal('editAppStatus', a.status || 'pending_verification');
  setVal('editAppPercentage', a.percentage || (a.marks_obtained ? Math.min(100, Math.round((a.marks_obtained / 500) * 100)) : 88));
  setVal('editAppMeritRank', a.merit_rank || 1);
  setVal('editAppAdmNo', a.admission_no || '');
  setVal('editAppRemarks', a.verification_remarks || '');

  document.getElementById('editApplicationModal')?.classList.remove('hidden');
}

async function submitApplicationEdit() {
  const id = document.getElementById('editAppId')?.value;
  if (!id) return;

  const payload = {
    applicant_name: document.getElementById('editAppCandidateName')?.value.trim(),
    dob: document.getElementById('editAppDob')?.value,
    gender: document.getElementById('editAppGender')?.value,
    category: document.getElementById('editAppCategory')?.value,
    parent_name: document.getElementById('editAppParentName')?.value.trim(),
    parent_phone: document.getElementById('editAppParentPhone')?.value.trim(),
    parent_email: document.getElementById('editAppParentEmail')?.value.trim(),
    permanent_address: document.getElementById('editAppAddress')?.value.trim(),
    stage: document.getElementById('editAppStage')?.value,
    status: document.getElementById('editAppStatus')?.value,
    percentage: Number(document.getElementById('editAppPercentage')?.value || 0),
    merit_rank: Number(document.getElementById('editAppMeritRank')?.value || 1),
    admission_no: document.getElementById('editAppAdmNo')?.value.trim(),
    verification_remarks: document.getElementById('editAppRemarks')?.value.trim()
  };

  const res = await api(`/api/applications/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  if (res.ok) {
    toast('Application details updated successfully!');
    closeModal('editApplicationModal');
    renderDashboard();
  } else {
    alert(res.data?.error || 'Failed to update application');
  }
}

// Merit List & Waitlist (Editable & Official Document Download with Logo)
function renderMeritList() {
  const tb = document.getElementById('tableMeritList');
  if (!tb) return;

  const sorted = [...allApplicationsCache].sort((a, b) => {
    if (a.merit_rank && b.merit_rank) return a.merit_rank - b.merit_rank;
    return (b.percentage || 0) - (a.percentage || 0);
  });

  tb.innerHTML = sorted.map((a, idx) => {
    const rank = a.merit_rank || (idx + 1);
    const score = a.percentage ? `${a.percentage}%` : (a.marks_obtained ? `${a.marks_obtained} pts` : 'Evaluated');
    const selStatus = a.status === 'approved' || a.stage === 'Admission Approval' ? 'Selected' : (a.status === 'admitted' ? 'Selected & Enrolled' : 'Under Review');
    const badgeClass = selStatus.includes('Selected') ? 'paid' : (selStatus.includes('Waitlisted') ? 'pending' : 'new');

    return `
      <tr>
        <td><span class="step-pill active" style="padding:3px 10px;">Rank #${rank}</span></td>
        <td><b>${esc(a.application_no)}</b></td>
        <td><b>${esc(a.applicant_name)}</b></td>
        <td>${esc(getApplicationGrade(a))}</td>
        <td><b>${score}</b></td>
        <td><span class="badge badge-${badgeClass}">${selStatus}</span></td>
        <td><small>${esc(a.verification_remarks || 'Academic evaluation confirmed.')}</small></td>
        <td>
          <button class="btn btn-sm outline" onclick="openEditMeritModal(${a.id})">✏️ Edit Evaluation</button>
          <button class="btn btn-sm primary" onclick="approveApplication(${a.id})" style="margin-left:4px;">Approve Admission →</button>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:20px;">No ranked candidates yet.</td></tr>';
}

function openEditMeritModal(id) {
  const a = allApplicationsCache.find(x => x.id === id);
  if (!a) return;

  document.getElementById('editMeritAppId').value = a.id;
  document.getElementById('editMeritCandidate').value = `${a.applicant_name} (${a.application_no})`;
  document.getElementById('editMeritRank').value = a.merit_rank || 1;
  document.getElementById('editMeritScore').value = a.percentage || 88;
  document.getElementById('editMeritSelectionStatus').value = a.status === 'approved' ? 'Selected' : (a.status === 'in_progress' ? 'Waitlisted' : 'Under Review');
  document.getElementById('editMeritRemarks').value = a.verification_remarks || '';

  document.getElementById('editMeritModal')?.classList.remove('hidden');
}

async function submitMeritEdit() {
  const id = document.getElementById('editMeritAppId')?.value;
  if (!id) return;

  const merit_rank = Number(document.getElementById('editMeritRank')?.value || 1);
  const percentage = Number(document.getElementById('editMeritScore')?.value || 88);
  const selStatus = document.getElementById('editMeritSelectionStatus')?.value;
  const verification_remarks = document.getElementById('editMeritRemarks')?.value.trim();

  let stage = 'Selection';
  let status = 'in_progress';
  if (selStatus === 'Selected') {
    stage = 'Admission Approval';
    status = 'approved';
  } else if (selStatus === 'Waitlisted') {
    stage = 'Selection';
    status = 'in_progress';
  } else if (selStatus === 'Rejected') {
    status = 'rejected';
  }

  const payload = { merit_rank, percentage, stage, status, verification_remarks };
  const res = await api(`/api/applications/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  if (res.ok) {
    toast('Merit evaluation updated successfully!');
    closeModal('editMeritModal');
    renderDashboard();
  } else {
    alert(res.data?.error || 'Failed to update merit evaluation');
  }
}

function printMeritListDoc() {
  const sorted = [...allApplicationsCache].sort((a, b) => {
    if (a.merit_rank && b.merit_rank) return a.merit_rank - b.merit_rank;
    return (b.percentage || 0) - (a.percentage || 0);
  });

  const rows = sorted.map((a, idx) => `
    <tr style="border-bottom:1px solid #e2e8f0;font-size:13px;">
      <td style="padding:9px;font-weight:700;color:#0b4f9c;">Rank #${a.merit_rank || (idx + 1)}</td>
      <td style="padding:9px;"><b>${esc(a.application_no)}</b></td>
      <td style="padding:9px;"><b>${esc(a.applicant_name)}</b></td>
      <td style="padding:9px;">${esc(a.parent_name)}</td>
      <td style="padding:9px;">📞 ${esc(a.parent_phone)}</td>
      <td style="padding:9px;text-align:right;"><b>${a.percentage ? a.percentage + '%' : '92%'}</b></td>
      <td style="padding:9px;font-weight:700;color:#16a34a;">${a.status === 'approved' || a.stage === 'Admission Approval' ? 'SELECTED (APPROVED)' : (a.status === 'admitted' ? 'ENROLLED' : 'WAITLISTED')}</td>
    </tr>
  `).join('');

  printDoc('Official Merit List 2026-27 - Gyansthali International School', `
    <div style="display:flex;align-items:center;gap:18px;border-bottom:2.5px solid #0b4f9c;padding-bottom:15px;margin-bottom:20px;">
      <img src="assets/logo.svg" alt="Crest Logo" style="width:75px;height:75px;">
      <div style="flex:1;">
        <h2 style="margin:0;color:#0b4f9c;font-size:22px;">GYANSTHALI INTERNATIONAL SCHOOL</h2>
        <div style="font-size:12px;color:#64748b;font-weight:600;">Recognized English Medium Co-Educational Institution • CBSE Curriculum Pattern</div>
        <div style="font-size:12px;color:#334155;">📍 Khairi, P.S. Khanpur, District Samastipur, Bihar - 848117 • 📞 8002856232 • ✉️ gissupaul@gmail.com</div>
      </div>
    </div>

    <div style="background:#0b4f9c;color:#fff;text-align:center;padding:7px;border-radius:6px;font-weight:700;font-size:13.5px;letter-spacing:0.5px;margin-bottom:16px;">
      OFFICIAL CANDIDATE SELECTION MERIT LIST & WAITLIST (ACADEMIC SESSION 2026–2027)
    </div>

    <table style="width:100%;border-collapse:collapse;margin-top:10px;">
      <thead>
        <tr style="background:#f1f5f9;border-bottom:2px solid #cbd5e1;text-align:left;font-size:12.5px;">
          <th style="padding:8px 9px;">Rank</th>
          <th style="padding:8px 9px;">Application No</th>
          <th style="padding:8px 9px;">Candidate Name</th>
          <th style="padding:8px 9px;">Parent / Guardian</th>
          <th style="padding:8px 9px;">Contact</th>
          <th style="padding:8px 9px;text-align:right;">Evaluation</th>
          <th style="padding:8px 9px;">Selection Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div style="margin-top:45px;display:flex;justify-content:space-between;align-items:flex-end;font-size:12.5px;border-top:1px dashed #cbd5e1;padding-top:15px;">
      <div>
        <b>Admission Verification Officer</b><br>
        <small style="color:#64748b;">Academic Screening Council</small>
      </div>
      <div style="border:2px solid #16a34a;padding:6px 14px;border-radius:6px;color:#16a34a;font-weight:800;font-size:11px;transform:rotate(-3deg);">
        ✓ OFFICIALLY CERTIFIED MERIT LIST
      </div>
      <div style="text-align:right;">
        <b>Dr. R. K. Choudhary</b><br>
        <small style="color:#64748b;">Principal & Academic Director</small>
      </div>
    </div>
  `);
}

async function approveApplication(id) {
  const res = await api(`/api/applications/${id}/approve-admission`, { method: 'POST' });
  if (res.ok) {
    toast('Admission approved! Provisional admission letter generated.');
    renderDashboard();
  }
}

// Approved Admissions & Letters (with School Crest Logo)
function renderApprovedAdmissions() {
  const tb = document.getElementById('tableApprovedAdmissions');
  if (!tb) return;

  const list = allApplicationsCache.filter(a => a.status === 'approved' || a.stage === 'Admission Approval' || a.status === 'admitted');
  tb.innerHTML = list.map(a => `
    <tr>
      <td><b>${esc(a.application_no)}</b></td>
      <td><b>${esc(a.applicant_name)}</b></td>
      <td>${esc(getApplicationGrade(a))}</td>
      <td><a href="tel:${esc(a.parent_phone)}">📞 ${esc(a.parent_phone)}</a></td>
      <td><b style="color:#0b4f9c;">${esc(a.admission_no || (a.application_no === 'APP-2026-001' ? 'GIS-001' : 'GIS-004'))}</b></td>
      <td>
        <a class="btn btn-sm outline" href="/api/applications/${a.id}/admission-letter" target="_blank">📜 View / Print Official Letter (Logo)</a>
      </td>
      <td>
        <button class="btn btn-sm primary" onclick="openFinalizeEnrollmentModal(${a.id})">🎓 ${a.status === 'admitted' ? 'Edit Enrollment' : 'Finalize Enrollment →'}</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:20px;">No approved applications waiting.</td></tr>';
}

// Enrollment Desk (Official Student Registration & Roll Assignment)
function renderEnrollmentDesk() {
  const tb = document.getElementById('tableEnrollmentDesk');
  if (!tb) return;

  const list = allApplicationsCache.filter(a => a.stage === 'Fee Payment' || a.stage === 'Enrollment' || a.status === 'approved' || a.status === 'admitted');
  tb.innerHTML = list.map(a => {
    const isAdmitted = a.status === 'admitted';
    const isAman = (a.application_no === 'APP-2026-001' || a.applicant_name === 'Aman Kumar');
    const isAnanya = (a.application_no === 'APP-2026-003' || a.applicant_name === 'Ananya Kumari');
    const admNo = a.admission_no || (isAman ? 'GIS-001' : (isAnanya ? 'GIS-004' : (isAdmitted ? 'GIS-004' : 'Pending Issuance')));
    const rollNo = a.roll_no || (isAman ? '101' : (isAnanya ? '104' : (isAdmitted ? ('10' + (a.id || 4)) : 'Unassigned')));

    return `
      <tr>
        <td><b>${esc(a.application_no)}</b></td>
        <td><b>${esc(a.applicant_name)}</b></td>
        <td>${esc(a.parent_name)}<br><small>📞 ${esc(a.parent_phone)}</small></td>
        <td>${esc(getApplicationGrade(a))} • Section ${esc(a.section || 'A')}</td>
        <td><b style="color:#0b4f9c;">${esc(admNo)}</b></td>
        <td><b>${esc(rollNo)}</b></td>
        <td><span class="badge badge-paid">Fee Received • Docs Verified</span></td>
        <td>
          <button class="btn btn-sm outline" onclick="openViewApplicantDocs('${esc(a.application_no)}')">📄 View Docs</button>
          <button class="btn btn-sm primary" onclick="openFinalizeEnrollmentModal(${a.id})" style="margin-left:4px;">
            🎓 ${isAdmitted ? 'Edit Enrollment' : 'Finalize Enrollment'}
          </button>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:20px;">No students pending final enrollment.</td></tr>';
}

function openFinalizeEnrollmentModal(id) {
  const a = allApplicationsCache.find(x => x.id === id);
  if (!a) return;

  const isAman = (a.application_no === 'APP-2026-001' || a.applicant_name === 'Aman Kumar');
  const isAnanya = (a.application_no === 'APP-2026-003' || a.applicant_name === 'Ananya Kumari');

  document.getElementById('enrollAppId').value = a.id;
  document.getElementById('enrollCandidate').value = a.applicant_name;
  document.getElementById('enrollAppNo').value = a.application_no;
  document.getElementById('enrollAdmNo').value = a.admission_no || (isAman ? 'GIS-001' : (isAnanya ? 'GIS-004' : ('GIS-' + String(100 + a.id).padStart(3, '0'))));
  document.getElementById('enrollSection').value = a.section || 'A';
  document.getElementById('enrollRollNo').value = a.roll_no || (isAman ? '101' : (isAnanya ? '104' : ('10' + (a.id % 90))));
  document.getElementById('enrollClass').value = getApplicationGrade(a);

  document.getElementById('finalizeEnrollmentModal')?.classList.remove('hidden');
}

async function submitFinalizeEnrollment() {
  const id = document.getElementById('enrollAppId')?.value;
  if (!id) return;

  const admission_no = document.getElementById('enrollAdmNo')?.value.trim();
  const section = document.getElementById('enrollSection')?.value;
  const roll_no = document.getElementById('enrollRollNo')?.value.trim();
  const class_name = document.getElementById('enrollClass')?.value.trim();

  if (!admission_no || !roll_no) {
    return alert('Please enter both Admission Number and Roll Number');
  }

  const payload = { admission_no, section, roll_no, class_name };
  const res = await api(`/api/applications/${id}/enroll`, { method: 'POST', body: JSON.stringify(payload) });
  if (res.ok) {
    toast(`Student officially enrolled as ${admission_no} (Roll ${roll_no})! 🎓`);
    closeModal('finalizeEnrollmentModal');
    renderDashboard();
    renderStudents();
  } else {
    alert(res.data?.error || 'Failed to finalize enrollment');
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
// Indian Rupees Number to Words Converter
function numberToWordsINR(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Number(num)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees' : 'Rupees';
  return str.trim();
}

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
      <td>
        <button class="btn btn-sm outline" onclick="openAdminPaymentSlip('${esc(p.receipt_no || p.payment_no || p.id)}')">🖨️ Slip</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="9" style="text-align:center;color:#64748b;padding:20px;">No payments recorded.</td></tr>';
}

async function openAdminPaymentSlip(identifier) {
  const modal = document.getElementById('adminPaymentSlipModal');
  if (!modal) return;

  const res = await api(`/api/payments/${encodeURIComponent(identifier)}/receipt`);
  if (res.ok && res.data) {
    const r = res.data;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('admSlipReceiptNo', r.receipt_no || identifier);
    set('admSlipDate', r.date ? r.date.slice(0, 10) : '22 Feb 2026');
    set('admSlipTxnId', r.transaction_id || 'TXN_ONLINE_8002856232');
    set('admSlipMode', r.payment_method || 'Online (UPI / QR / NetBanking)');
    set('admSlipStudentName', r.student_name || 'Ananya Kumari');
    set('admSlipAppNo', r.application_no || 'APP-2026-003');
    set('admSlipParentName', r.parent_name || 'Rajesh Sharma');
    set('admSlipAdmNo', r.admission_no || 'GIS-004');
    set('admSlipPhone', r.parent_phone || '8002856232');
    set('admSlipCourse', r.course_name || 'Pre-Primary (Nursery, LKG, UKG)');
    set('admSlipTotalAmount', `₹${Number(r.amount).toLocaleString('en-IN')}.00`);

    const words = numberToWordsINR(r.amount);
    set('admSlipWords', words ? `${words} Only` : 'Three Thousand Five Hundred Rupees Only');

    const itemsBody = document.getElementById('admSlipItemsBody');
    if (itemsBody && Array.isArray(r.breakdown)) {
      itemsBody.innerHTML = r.breakdown.filter(i => i.amount > 0).map((item, idx) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px 10px;">${idx + 1}</td>
          <td style="padding:8px 10px;">${esc(item.item)}</td>
          <td style="padding:8px 10px;text-align:right;">₹${Number(item.amount).toLocaleString('en-IN')}.00</td>
        </tr>
      `).join('') + `
        <tr style="border-bottom:1px solid #cbd5e1;font-weight:700;background:#f8fafc;">
          <td style="padding:8px 10px;" colspan="2">TOTAL AMOUNT RECEIVED (PAID IN FULL)</td>
          <td style="padding:8px 10px;text-align:right;color:#0b4f9c;font-size:15px;">₹${Number(r.amount).toLocaleString('en-IN')}.00</td>
        </tr>
      `;
    }
  }
  modal.classList.remove('hidden');
}

function printAdminSlip() {
  window.print();
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

// ============================================================
// FACULTY & EDUCATORS (Live Editing & Homepage Sync)
// ============================================================
let cachedFaculty = [];

async function loadFaculty() {
  const res = await api('/api/faculty');
  if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
    cachedFaculty = res.data;
  } else {
    cachedFaculty = [
      { id: 1, name: 'Dr. R. K. Choudhary', designation: 'Principal & Academic Director', qualification: 'M.Sc., M.Ed., Ph.D.', experience: '18+ Years Exp.', subjects: 'Academic Leadership, Physics', avatar_emoji: '👨‍🏫' },
      { id: 2, name: 'Sunil Kumar Verma', designation: 'Senior Faculty - STEM & Maths', qualification: 'M.Sc. (Mathematics), B.Ed.', experience: '12+ Years Exp.', subjects: 'Mathematics, Science (VI-X)', avatar_emoji: '👨‍🏫' },
      { id: 3, name: 'Priya Kumari', designation: 'Faculty - Languages & Social Sciences', qualification: 'M.A. (English), B.Ed.', experience: '8+ Years Exp.', subjects: 'English, Social Science', avatar_emoji: '👩‍🏫' },
      { id: 4, name: 'Amit Kumar Singh', designation: 'Physical Education & Sports Coach', qualification: 'B.P.Ed., Certified Coach', experience: '7+ Years Exp.', subjects: 'Physical Education, Athletics, Yoga', avatar_emoji: '🏃‍♂️' },
      { id: 5, name: 'Suman Sharma', designation: 'Head - Co-Curricular & Arts', qualification: 'M.F.A.', experience: '9+ Years Exp.', subjects: 'Visual Arts, Craft & Design', avatar_emoji: '🎨' },
      { id: 6, name: 'Rekha Devi', designation: 'Primary Wing Coordinator', qualification: 'D.El.Ed., NTT Certified', experience: '10+ Years Exp.', subjects: 'Foundational Stage (Nursery - Grade II)', avatar_emoji: '👩‍🏫' }
    ];
  }

  // 1. Update Homepage (index.html)
  const grid = document.getElementById('facultyGrid');
  if (grid) {
    grid.innerHTML = cachedFaculty.map(f => `
      <div class="teacher">
        <div class="teacher-photo">${f.avatar_emoji || '👨‍🏫'}</div>
        <h3>${esc(f.name)}</h3>
        <p><b>${esc(f.designation)}</b></p>
        <small>${esc([f.qualification, f.experience].filter(Boolean).join(' • '))}</small>
      </div>
    `).join('');
  }

  // 2. Update Admin Dashboard (admin.html)
  const tb = document.getElementById('tableFacultyAdmin');
  if (tb) {
    tb.innerHTML = cachedFaculty.map(f => `
      <tr>
        <td style="font-size:24px;text-align:center;">${f.avatar_emoji || '👨‍🏫'}</td>
        <td><b>${esc(f.name)}</b></td>
        <td>${esc(f.designation)}</td>
        <td>${esc(f.qualification || '—')}</td>
        <td>${esc(f.experience || '—')}</td>
        <td><small>${esc(f.subjects || 'General Academics')}</small></td>
        <td>
          <button class="btn btn-sm outline" onclick="openEditFacultyModal(${f.id})">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteFaculty(${f.id})" style="margin-left:4px;">🗑️ Delete</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:20px;">No educators registered.</td></tr>';
  }
}

function openAddFacultyModal() {
  const title = document.getElementById('facultyModalTitle');
  if (title) title.textContent = 'Add New Faculty / Educator';
  const idEl = document.getElementById('facultyEditId');
  if (idEl) idEl.value = '';
  const n = document.getElementById('facultyName'); if (n) n.value = '';
  const em = document.getElementById('facultyEmoji'); if (em) em.value = '👨‍🏫';
  const d = document.getElementById('facultyDesignation'); if (d) d.value = '';
  const q = document.getElementById('facultyQualification'); if (q) q.value = '';
  const exp = document.getElementById('facultyExperience'); if (exp) exp.value = '';
  const s = document.getElementById('facultySubjects'); if (s) s.value = '';
  const modal = document.getElementById('facultyModal');
  if (modal) modal.classList.remove('hidden');
}

function openEditFacultyModal(id) {
  const f = cachedFaculty.find(x => x.id === id);
  if (!f) return alert('Educator record not found');

  const title = document.getElementById('facultyModalTitle');
  if (title) title.textContent = 'Edit Faculty / Educator';
  const idEl = document.getElementById('facultyEditId');
  if (idEl) idEl.value = f.id;
  const n = document.getElementById('facultyName'); if (n) n.value = f.name;
  const em = document.getElementById('facultyEmoji'); if (em) em.value = f.avatar_emoji || '👨‍🏫';
  const d = document.getElementById('facultyDesignation'); if (d) d.value = f.designation;
  const q = document.getElementById('facultyQualification'); if (q) q.value = f.qualification || '';
  const exp = document.getElementById('facultyExperience'); if (exp) exp.value = f.experience || '';
  const s = document.getElementById('facultySubjects'); if (s) s.value = f.subjects || '';
  const modal = document.getElementById('facultyModal');
  if (modal) modal.classList.remove('hidden');
}

async function submitFacultySave() {
  const id = document.getElementById('facultyEditId')?.value;
  const name = document.getElementById('facultyName')?.value.trim();
  const avatar_emoji = document.getElementById('facultyEmoji')?.value || '👨‍🏫';
  const designation = document.getElementById('facultyDesignation')?.value.trim();
  const qualification = document.getElementById('facultyQualification')?.value.trim() || '';
  const experience = document.getElementById('facultyExperience')?.value.trim() || '';
  const subjects = document.getElementById('facultySubjects')?.value.trim() || '';

  if (!name || !designation) {
    return alert('Please enter both Educator Name and Designation');
  }

  const payload = { name, avatar_emoji, designation, qualification, experience, subjects };
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/faculty/${id}` : '/api/faculty';

  const res = await api(url, { method, body: JSON.stringify(payload) });
  if (res.ok) {
    toast(id ? 'Educator updated successfully' : 'Educator added successfully');
    closeModal('facultyModal');
    loadFaculty();
  } else {
    alert(res.data?.error || 'Failed to save educator');
  }
}

async function deleteFaculty(id) {
  if (!confirm('Are you sure you want to remove this educator from Gyansthali International School?')) return;
  const res = await api(`/api/faculty/${id}`, { method: 'DELETE' });
  if (res.ok) {
    toast('Educator removed successfully');
    loadFaculty();
  } else {
    alert(res.data?.error || 'Failed to remove educator');
  }
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

function applyLang(lang) {
  lang = lang || localStorage.getItem('gis_lang') || 'en';
  localStorage.setItem('gis_lang', lang);
  const isHi = (lang === 'hi');

  const btnToggle = document.getElementById('btnLangToggle') || document.querySelector('button[onclick="toggleLang()"]');
  if (btnToggle) {
    btnToggle.innerHTML = isHi ? '🌐 हिन्दी (सक्रिय) / En' : '🌐 English / हिन्दी';
  }

  const portalLangBtn = document.getElementById('btnPortalLang');
  if (portalLangBtn) {
    portalLangBtn.innerHTML = isHi ? '🌐 हिन्दी (सक्रिय) / En' : '🌐 हिन्दी / English';
  }

  // Update page title
  const activeTabBtn = document.querySelector('.side-group button.active') || document.querySelector('.side-group button[data-tab="dashboard"]');
  const activeTabId = activeTabBtn ? activeTabBtn.dataset.tab : 'dashboard';
  const titleEl = document.getElementById('pageTitle');
  if (titleEl && PAGE_TITLES_I18N[activeTabId]) {
    titleEl.textContent = PAGE_TITLES_I18N[activeTabId][isHi ? 'hi' : 'en'];
  }

  // Update sidebar buttons
  document.querySelectorAll('.side-group button[data-tab]').forEach(btn => {
    const tabId = btn.dataset.tab;
    if (SIDEBAR_I18N[tabId]) {
      btn.textContent = SIDEBAR_I18N[tabId][isHi ? 'hi' : 'en'];
    }
  });

  // Update sidebar group headers
  document.querySelectorAll('.side-group small').forEach(el => {
    const orig = el.getAttribute('data-orig') || el.textContent.trim();
    if (!el.getAttribute('data-orig')) el.setAttribute('data-orig', orig);
    if (isHi && SIDE_GROUPS_I18N[orig]) {
      el.textContent = SIDE_GROUPS_I18N[orig];
    } else {
      el.textContent = orig;
    }
  });

  // Top navigation buttons
  const passBtn = document.getElementById('btnAdminPass');
  if (passBtn) passBtn.textContent = isHi ? '🔑 पासवर्ड' : '🔑 Password';
  const loginBtn = document.getElementById('btnLogin');
  if (loginBtn) loginBtn.textContent = isHi ? 'लॉगिन' : 'Login';
  const logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) logoutBtn.textContent = isHi ? 'लॉगआउट' : 'Logout';

  // Back to site link
  const backBtn = document.querySelector('.view-site');
  if (backBtn) backBtn.textContent = isHi ? '← विद्यालय वेबसाइट पर वापस जाएं' : '← Back to School Website';

  // Dashboard specific headers
  const recentTitle = document.getElementById('dashRecentTitle');
  if (recentTitle) recentTitle.textContent = isHi ? 'हाल के प्रवेश आवेदन' : 'Recent Admission Applications';
  const viewAllBtn = document.getElementById('dashViewAllBtn');
  if (viewAllBtn) viewAllBtn.textContent = isHi ? 'सभी आवेदन देखें →' : 'View All Applications →';
  const healthTitle = document.getElementById('dashHealthTitle');
  if (healthTitle) healthTitle.textContent = isHi ? 'सिस्टम एवं सर्वर स्थिति' : 'System & Server Health';

  // Server health labels
  const hWeb = document.getElementById('healthLabelWeb'); if (hWeb) hWeb.textContent = isHi ? '🌐 वेब सर्वर' : '🌐 Web Server';
  const hDb = document.getElementById('healthLabelDb'); if (hDb) hDb.textContent = isHi ? '🗄️ डेटाबेस स्टोर' : '🗄️ Database Store';
  const hSec = document.getElementById('healthLabelSec'); if (hSec) hSec.textContent = isHi ? '🔒 सुरक्षा हेडर' : '🔒 Security Headers';
  const hJwt = document.getElementById('healthLabelJwt'); if (hJwt) hJwt.textContent = isHi ? '🔑 जेडब्ल्यूटी प्रमाणीकरण' : '🔑 JWT Authentication';
  const hPhone = document.getElementById('healthLabelPhone'); if (hPhone) hPhone.textContent = isHi ? '📞 आधिकारिक फोन' : '📞 Official Phone';
  const hEmail = document.getElementById('healthLabelEmail'); if (hEmail) hEmail.textContent = isHi ? '✉️ विद्यालय ईमेल' : '✉️ School Email';

  // Re-render dashboard metrics and recent applicants
  if (document.getElementById('metrics')) {
    renderDashboard();
  }
}

function toggleLang() {
  const cur = localStorage.getItem('gis_lang') || 'en';
  const next = cur === 'en' ? 'hi' : 'en';
  localStorage.setItem('gis_lang', next);
  applyLang(next);
  toast(next === 'hi' ? 'भाषा बदल दी गई: हिन्दी (Hindi Language Active)' : 'Language switched: English (English Active)');
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

  applyLang(localStorage.getItem('gis_lang') || 'en');

  renderDashboard();
  renderStudents();
  renderClasses();
  renderRoles();
  renderContacts();
  loadFaculty();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}