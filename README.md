# Gyansthali International School — Production Portal Starter

**School:** Gyansthali International School  
**Address:** Khairi, Khanpur, Samastipur, Bihar - 848117  
**Email:** gissupaul@gmail.com  
**Enquiry Phone:** +91 80028 56232  
**School Office:** 8002856232  
**Facebook:** https://www.facebook.com/gissamastipur  
**Instagram:** https://www.instagram.com/gissamastipur  

The school is officially located at Khairi, Khanpur, Samastipur, Bihar, offering modern education from pre-primary through secondary grades.

---

## 🌟 Modules & Features Included

### 1. Student Management
- **Single Student Entry**: Comprehensive modal form with Name, Admission No., Class, Section, Roll No., Parent Name, Phone, and Address.
- **Multiple / Bulk Entry**: Add multiple students simultaneously by typing or pasting comma-separated lines.
- **Interactive Editing**: Instant modal edit for any student record with live updates across tables and reports.
- **Deletion**: Single record deletion and bulk multiple deletion with checkbox selections.
- **Live Search**: Instant filtering by student name, roll number, class, or parent contact.

### 2. Parent Management
- Direct overview of parent-student links.
- Verified mobile numbers and parent portal credentials (PIN `1234`).
- Direct WhatsApp and phone call triggers.

### 3. Classes & Sections Dashboard
- Class roster overview (Nursery, LKG, UKG, Class I to Class X).
- Section allocation (A, B) and total student enrollment count per class.
- Dedicated Class Teacher in charge assignment.

### 4. Online Application Lifecycle Workflow
Complete multi-stage admission funnel:
```
1. Enquiry ➔ 2. Form ➔ 3. Documents ➔ 4. Verification ➔ 5. Interview ➔ 6. Approved ➔ 7. Admission No.
```
- Stage tracking with status indicators.
- One-click advancement to next stage.
- Automatic admission number generation (e.g. `GIS-1004`) and student record creation upon approval.

### 5. Contact Enquiries Dashboard
- Real-time intake of inquiries submitted via the public website contact form.
- View sender name, phone number (with one-click call and WhatsApp action), email, and message.
- Status updates: `New` ➔ `Replied` ➔ `Resolved`.

### 6. User Roles & Permissions (Fully Editable)
Configurable role-based access matrix:
| Role | Default Accessible Modules | Description |
|---|---|---|
| **Super Admin** | `All modules` | Complete system access, database management, user permissions. |
| **Principal** | `Academic, admissions, reports` | Supervises admissions, faculty, results, curriculum. |
| **Teacher** | `Attendance, marks, timetable` | Records student attendance, enters exam marks, reviews schedule. |
| **Accountant** | `Fees & receipts` | Manages student fee payments, invoices, receipts, and audits. |
| **Reception** | `Enquiries & admissions` | Handles phone calls, parent inquiries, and visitor registrations. |

*Admins can edit accessible modules and descriptions for each role directly from the dashboard.*

### 7. Reports Generation
- **Student Enrollment Report**: Complete enrollment breakdown with printable layout and CSV export.
- **Attendance Summary Report**: Daily and monthly attendance logs with CSV export.
- **Fee Collection Audit Report**: Audit of paid vs pending dues with CSV export.

### 8. Admin Authentication
- Secure JWT authentication with bcrypt password hashing.
- One-click quick login for Super Admin demonstration.

### 9. Parent & Student Portal (`/portal.html`)
- Login via Admission No. (`GIS-001`) or Mobile (`8002856232`) with PIN `1234`.
- Attendance percentage and recent check-in status.
- Term fees due and payment receipts.
- Examination marks and PDF report card downloads.
- Active circulars and school announcements.

---

## 🚀 Quick Start Guide

```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start
```

Visit: **http://localhost:3000**

### Default Credentials

| Portal | Username / ID | Password / PIN |
|---|---|---|
| **Admin Portal** | `gissupaul@gmail.com` | `ChangeMe!123` |
| **Parent Portal** | `GIS-001` or `8002856232` | `1234` |
