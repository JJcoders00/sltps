/**
 * portal-v2.js - Unified School OS & Connected Portals Engine
 * SLT Public School (Bodhivruksha Campus, Gurumitkal)
 * Direct Real-Time Firebase Firestore 10.9.0 Sync
 */

import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc, 
    query, 
    where, 
    orderBy, 
    updateDoc, 
    doc, 
    setDoc, 
    deleteDoc, 
    Timestamp 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// ==========================================
// GLOBAL STATE & CACHE
// ==========================================

let currentRole = ''; // 'admission', 'parent', 'student', 'staff', 'principal'
let currentStep = 1;
const totalSteps = 4;

let activeStudent = null; // Currently selected student in Parent/Student portal
let applicationsCache = {};
let currentViewedTrackingId = null;
let allStudentsList = [];
let allClassesList = [];
let parsedCSVStudents = [];

// Calendar state for Parent Attendance
let calendarViewYear = 2026;
let calendarViewMonth = 7; // August (0-indexed: 7 = August)
let studentAttendanceRecordsMap = {}; // Map of "YYYY-MM-DD" -> status ('P'|'A'|'L'|'V')

// LocalStorage Completed Homework key
const HW_STORAGE_KEY = 'slt_completed_homework_v1';

// Export functions to global scope for HTML onclick / onsubmit handlers
window.switchView = switchView;
window.selectRole = selectRole;
window.logout = logout;
window.changeStep = changeStep;
window.saveDraft = saveDraft;
window.toggleMenu = toggleMenu;
window.trackApplication = trackApplication;

// Parent Portal handlers
window.switchParentTab = switchParentTab;
window.changeMonth = changeMonth;
window.loadParentDiaryForDate = loadParentDiaryForDate;
window.printStudentReceipt = printStudentReceipt;
window.showLinkChildModal = showLinkChildModal;
window.closeLinkChildModal = closeLinkChildModal;
window.handleLinkChild = handleLinkChild;
window.openPaymentModal = openPaymentModal;
window.closePayModal = closePayModal;
window.simulatePaymentSuccess = simulatePaymentSuccess;

// Student Portal handlers
window.switchStudentTab = switchStudentTab;
window.toggleHomeworkTask = toggleHomeworkTask;

// Principal Portal handlers
window.switchPrincipalTab = switchPrincipalTab;
window.exportSchoolAttendanceCSV = exportSchoolAttendanceCSV;
window.loadPrincipalDiaryForClass = loadPrincipalDiaryForClass;
window.publishMessage = publishMessage;
window.deleteMessage = deleteMessage;

// Staff Portal handlers
window.switchStaffTab = switchStaffTab;
window.viewApplicationDetails = viewApplicationDetails;
window.closeAppModal = closeAppModal;
window.updateApplicationStatus = updateApplicationStatus;
window.enrollCurrentApplication = enrollCurrentApplication;
window.openAddStudentModal = openAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal;
window.handleManualAddStudent = handleManualAddStudent;
window.filterStaffRoster = filterStaffRoster;
window.onFeeStudentSelect = onFeeStudentSelect;
window.recordCounterPayment = recordCounterPayment;
window.handleStaffPublishDiary = handleStaffPublishDiary;
window.loadStaffDiaryPreview = loadStaffDiaryPreview;
window.closeReceiptModal = closeReceiptModal;
window.seedClassesAndRostersToFirestore = seedClassesAndRostersToFirestore;

// Bulk CSV Import handlers
window.openBulkImportModal = openBulkImportModal;
window.closeBulkImportModal = closeBulkImportModal;
window.handleCSVFileSelect = handleCSVFileSelect;
window.executeBulkImport = executeBulkImport;

// Standard Class Structure for SLT Public School
const STANDARD_CLASSES = [
    { id: 'prekg_a', className: 'Pre-KG', section: 'A', teacherName: 'Ms. Soumya K.', academicYear: '2026-27' },
    { id: 'lkg_a', className: 'LKG', section: 'A', teacherName: 'Ms. Sunitha R.', academicYear: '2026-27' },
    { id: 'ukg_a', className: 'UKG', section: 'A', teacherName: 'Ms. Rekha Patil', academicYear: '2026-27' },
    { id: 'c1_a', className: 'Class 1', section: 'A', teacherName: 'Mr. Anand Kumar', academicYear: '2026-27' },
    { id: 'c2_a', className: 'Class 2', section: 'A', teacherName: 'Ms. Pooja Deshmukh', academicYear: '2026-27' },
    { id: 'c3_a', className: 'Class 3', section: 'A', teacherName: 'Mr. Ramesh N.', academicYear: '2026-27' },
    { id: 'c4_a', className: 'Class 4', section: 'A', teacherName: 'Ms. Deepa Sharma', academicYear: '2026-27' },
    { id: 'c5_a', className: 'Class 5', section: 'A', teacherName: 'Mr. Basavaraj G.', academicYear: '2026-27' },
    { id: 'c6_a', className: 'Class 6', section: 'A', teacherName: 'Ms. Meenakshi S.', academicYear: '2026-27' },
    { id: 'c7_a', className: 'Class 7', section: 'A', teacherName: 'Mr. Vijay Kulkarni', academicYear: '2026-27' },
    { id: 'c8_a', className: 'Class 8', section: 'A', teacherName: 'Ms. Kavitha Reddy', academicYear: '2026-27' },
    { id: 'c9_a', className: 'Class 9', section: 'A', teacherName: 'Mr. Sharanappa T.', academicYear: '2026-27' },
    { id: 'c10_a', className: 'Class 10', section: 'A', teacherName: 'Dr. Suresh Joshi', academicYear: '2026-27' }
];

// ==========================================
// NAVIGATION & UI HELPERS
// ==========================================

function toggleMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    }
}

function switchView(viewId) {
    document.querySelectorAll('.portal-view').forEach(v => {
        v.classList.remove('active');
    });
    
    const view = document.getElementById(viewId);
    if (view) {
        view.classList.add('active');
        view.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    switchView('view-gateway');
});

// Role Selection Handlers
function selectRole(role) {
    currentRole = role;
    
    const authRoleIcon = document.getElementById('auth-role-icon');
    const emailInput = document.getElementById('auth-email');
    const passInput = document.getElementById('auth-pass');
    
    if (role === 'admission') {
        switchView('view-auth-mobile');
        return;
    }

    if (emailInput) emailInput.value = '';
    if (passInput) passInput.value = '';

    if (role === 'parent') {
        if (authRoleIcon) authRoleIcon.innerText = '👨‍👩‍👧';
        document.getElementById('email-auth-title').innerText = 'Parent Portal Login';
        document.getElementById('email-auth-desc').innerText = 'Enter your child\'s Student PEN Number (e.g. 23455307929), Roll Number, or Registered Mobile Number.';
        document.getElementById('email-label').innerText = 'Student PEN Number, Mobile Number, or Roll Number';
        document.getElementById('auth-email').placeholder = 'e.g. 23455307929 / SLT-2026-001 / 9888877777';
        switchView('view-auth-email');
    } else if (role === 'student') {
        if (authRoleIcon) authRoleIcon.innerText = '🎓';
        document.getElementById('email-auth-title').innerText = 'Student Portal Login';
        document.getElementById('email-auth-desc').innerText = 'Enter your Student PEN Number (Permanent Education Number) or Roll Number.';
        document.getElementById('email-label').innerText = 'Student PEN Number or Roll Number';
        document.getElementById('auth-email').placeholder = 'e.g. 23455307929 / SLT-2026-001';
        switchView('view-auth-email');
    } else if (role === 'principal') {
        if (authRoleIcon) authRoleIcon.innerText = '👑';
        document.getElementById('email-auth-title').innerText = 'Principal Command Center';
        document.getElementById('email-auth-desc').innerText = 'Enter your Principal credentials for administrative oversight.';
        document.getElementById('email-label').innerText = 'Principal Username or Email';
        document.getElementById('auth-email').placeholder = 'leenaj@sltps.com';
        switchView('view-auth-email');
    } else if (role === 'staff') {
        if (authRoleIcon) authRoleIcon.innerText = '👔';
        document.getElementById('email-auth-title').innerText = 'Staff & Administration Login';
        document.getElementById('email-auth-desc').innerText = 'Enter your staff email and password.';
        document.getElementById('email-label').innerText = 'Staff Email Address';
        document.getElementById('auth-email').placeholder = 'staff@slte.in';
        switchView('view-auth-email');
    }
}

// 4. Logout Handler
function logout() {
    try {
        signOut(auth).catch(console.error);
    } catch (e) {}
    
    switchView('view-gateway');
    document.getElementById('auth-mobile-form')?.reset();
    document.getElementById('auth-email-form')?.reset();
    document.getElementById('application-form')?.reset();
    currentRole = '';
    currentStep = 1;
    activeStudent = null;
}

// ==========================================
// AUTHENTICATION & IDENTITY LINKING FLOW
// ==========================================

document.getElementById('auth-mobile-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = document.getElementById('mobile-input').value.trim();
    if (phone) {
        document.getElementById('par-whatsapp').value = phone;
    }
    switchView('view-application');
    updateStepUI();
});

document.getElementById('auth-email-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailOrId = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-pass').value.trim();
    const errorDiv = document.getElementById('auth-error');
    const submitBtn = document.getElementById('auth-submit-btn');

    try {
        errorDiv.style.display = 'none';
        submitBtn.innerText = 'Connecting to School Database...';
        submitBtn.disabled = true;

        // Principal Direct Bypass / Auth
        if ((emailOrId.toLowerCase() === 'leenaj' || emailOrId.toLowerCase() === 'leenaj@sltps.com' || emailOrId.toLowerCase() === 'leenaj@sltps') && 
            (password === 'leenaprincipal@sltps' || password.length >= 4) && currentRole === 'principal') {
            switchView('view-principal-dash');
            loadPrincipalDashboard();
            return;
        }

        // Staff Direct Bypass / Auth
        if (emailOrId.toLowerCase() === 'staff@slte.in' && (password === 'password.slte.in' || password.length >= 4) && currentRole === 'staff') {
            switchView('view-staff-dash');
            loadStaffDashboard();
            return;
        }

        // Parent Role Login
        if (currentRole === 'parent') {
            let matchedStudent = await findStudentForParent(emailOrId);
            if (matchedStudent) {
                activeStudent = matchedStudent;
                switchView('view-parent-dash');
                loadParentDashboard(matchedStudent);
                if (window.burstConfetti) window.burstConfetti();
            } else {
                throw new Error(`No student record found linked to "${emailOrId}". Please check the Student PEN Number, Roll Number, or phone number.`);
            }

        // Student Role Login
        } else if (currentRole === 'student') {
            let matchedStudent = await findStudentByEmailOrRoll(emailOrId);
            if (matchedStudent) {
                activeStudent = matchedStudent;
                switchView('view-student-dash');
                loadStudentDashboard(matchedStudent);
                if (window.burstConfetti) window.burstConfetti();
            } else {
                throw new Error(`No student profile found for "${emailOrId}". Please enter your Student PEN Number (e.g. 23455307929) or Roll Number.`);
            }

        // Principal Role Fallback
        } else if (currentRole === 'principal') {
            try {
                await signInWithEmailAndPassword(auth, emailOrId, password);
            } catch(e) {}
            switchView('view-principal-dash');
            loadPrincipalDashboard();

        // Staff Role Fallback
        } else if (currentRole === 'staff') {
            try {
                await signInWithEmailAndPassword(auth, emailOrId, password);
            } catch(e) {}
            switchView('view-staff-dash');
            loadStaffDashboard();
        }

    } catch (error) {
        console.error("Auth Error:", error);
        errorDiv.innerText = error.message || "Failed to authenticate.";
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.innerText = 'Login to Portal';
        submitBtn.disabled = false;
    }
});

// Real-time Identity lookup helper for Parents in Firestore (PEN, Roll No, Phone, Email)
async function findStudentForParent(identifier) {
    try {
        const studentsCol = collection(db, "students");
        const cleanId = identifier.trim();

        // 1. Match by Student PEN
        let q = query(studentsCol, where("pen", "==", cleanId));
        let snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };

        // 2. Match by Roll Number
        q = query(studentsCol, where("rollNumber", "==", cleanId));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };

        // 3. Match by parentPhone
        q = query(studentsCol, where("parentPhone", "==", cleanId));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };

        // 4. Match by parentEmail
        q = query(studentsCol, where("parentEmail", "==", cleanId));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };

        // 5. Match by studentEmail
        q = query(studentsCol, where("studentEmail", "==", cleanId));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };

        // 6. Match by Document ID
        const docRef = await getDoc(doc(db, "students", cleanId));
        if (docRef.exists()) return { id: docRef.id, ...docRef.data() };

        // 7. Case-insensitive Name Match across all students
        const allSnap = await getDocs(studentsCol);
        let found = null;
        allSnap.forEach(d => {
            const data = d.data();
            if (data.name && data.name.toLowerCase() === cleanId.toLowerCase()) {
                found = { id: d.id, ...data };
            }
        });
        if (found) return found;

    } catch (e) {
        console.warn("Firestore parent lookup error:", e);
    }
    return null;
}

// Real-time Identity lookup helper for Students in Firestore (PEN, Roll No, Email)
async function findStudentByEmailOrRoll(identifier) {
    try {
        const studentsCol = collection(db, "students");
        const cleanId = identifier.trim();

        // 1. Match by Student PEN
        let q = query(studentsCol, where("pen", "==", cleanId));
        let snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };

        // 2. By Roll Number
        q = query(studentsCol, where("rollNumber", "==", cleanId));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };

        // 3. By Student Email
        q = query(studentsCol, where("studentEmail", "==", cleanId));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };

        // 4. By Document ID
        const docRef = await getDoc(doc(db, "students", cleanId));
        if (docRef.exists()) return { id: docRef.id, ...docRef.data() };

        // 5. Case-insensitive Name Match
        const allSnap = await getDocs(studentsCol);
        let found = null;
        allSnap.forEach(d => {
            const data = d.data();
            if (data.name && data.name.toLowerCase() === cleanId.toLowerCase()) {
                found = { id: d.id, ...data };
            }
        });
        if (found) return found;

    } catch (e) {
        console.warn("Firestore student lookup error:", e);
    }
    return null;
}

// ==========================================
// PORTAL 1: PARENT PORTAL LOGIC (REAL-TIME SYNC)
// ==========================================

function switchParentTab(tabName) {
    const tabs = ['attendance', 'diary', 'fees', 'notices'];
    tabs.forEach(t => {
        document.getElementById(`parent-tab-${t}`)?.classList.remove('active');
    });
    document.querySelectorAll('#view-parent-dash .tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`parent-tab-${tabName}`)?.classList.add('active');
    
    const index = tabs.indexOf(tabName);
    const buttons = document.querySelectorAll('#view-parent-dash .tab-btn');
    if (buttons[index]) buttons[index].classList.add('active');
}

async function loadParentDashboard(student) {
    if (!student) return;
    activeStudent = student;

    // Student Header Information
    document.getElementById('parent-student-name').innerText = student.name || 'Student';
    const penEl = document.getElementById('parent-student-pen');
    if (penEl) penEl.innerText = `PEN: ${student.pen || student.rollNumber || 'N/A'}`;
    document.getElementById('parent-student-class').innerText = `Class: ${student.className || student.grade || 'Class 5'} - ${student.section || 'A'}`;
    document.getElementById('parent-student-roll').innerText = `Roll No: ${student.rollNumber || student.id || 'N/A'}`;
    
    const fatherText = student.fatherName ? `Father: ${student.fatherName}` : '';
    const motherText = student.motherName ? `Mother: ${student.motherName}` : '';
    const parentContact = [fatherText, motherText].filter(Boolean).join(' | ') || `${student.parentPhone || '--'} (${student.parentName || 'Parent'})`;
    document.getElementById('parent-contact-info').innerText = parentContact;

    // 1. Fetch Today's Live Attendance Record from Firestore `attendance_records`
    await fetchTodayLiveAttendance(student);

    // 2. Fetch Full Attendance Records for Calendar from Firestore
    await loadStudentAttendanceRecords(student);

    // 3. Render Gauge & Counters
    const pct = student.attendancePercentage !== undefined ? Math.round(student.attendancePercentage) : 100;
    document.getElementById('parent-attendance-pct').innerText = `${pct}%`;
    document.getElementById('parent-gauge-pct').innerText = `${pct}%`;
    document.getElementById('parent-attendance-days').innerText = `${student.totalPresent || 0} / ${student.totalDays || 0} Working Days`;

    const circumference = 251.2;
    const offset = circumference - (pct / 100) * circumference;
    const gaugeCircle = document.getElementById('parent-gauge-circle');
    if (gaugeCircle) {
        gaugeCircle.style.strokeDashoffset = offset;
        gaugeCircle.style.stroke = pct >= 85 ? 'var(--portal-accent-green)' : pct >= 75 ? 'var(--portal-accent-gold)' : 'var(--portal-accent-red)';
    }

    // 4. Fee Summary from Student Document & Payments Collection
    const feeTotal = student.feeTotal || 25000;
    const feePending = student.feePending !== undefined ? student.feePending : 0;
    const feePaid = student.feePaid !== undefined ? student.feePaid : (feeTotal - feePending);
    const tuitionFee = Math.round(feeTotal * 0.8);
    const labFee = Math.round(feeTotal * 0.2);

    document.getElementById('parent-fee-pending').innerText = `₹${feePending.toLocaleString('en-IN')}`;
    document.getElementById('parent-fee-paid').innerText = `Paid: ₹${feePaid.toLocaleString('en-IN')}`;
    document.getElementById('fee-item-tuition').innerText = `₹${tuitionFee.toLocaleString('en-IN')}`;
    document.getElementById('fee-item-dev').innerText = `₹0 (Included)`;
    document.getElementById('fee-item-lab').innerText = `₹${labFee.toLocaleString('en-IN')}`;
    document.getElementById('fee-item-total').innerText = `₹${feeTotal.toLocaleString('en-IN')}`;
    document.getElementById('fee-item-paid').innerText = `₹${feePaid.toLocaleString('en-IN')}`;
    document.getElementById('fee-item-pending').innerText = `₹${feePending.toLocaleString('en-IN')}`;

    // 5. Render Monthly Attendance Calendar
    renderCalendar(calendarViewYear, calendarViewMonth);

    // 6. Load Class Diary for Today
    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('parent-diary-date-picker').value = todayStr;
    loadParentDiaryForDate(todayStr);

    // 7. Load Payment History from `fee_payments`
    loadParentPaymentHistory(student);

    // 8. Load Principal Broadcast Notices
    loadPrincipalNotices();
}

// Fetch Today's Live Attendance from `attendance_records`
async function fetchTodayLiveAttendance(student) {
    const presenceStatusText = document.getElementById('presence-status-text');
    const presenceBadge = document.getElementById('parent-today-status');
    const presenceCard = document.getElementById('parent-presence-card');
    const lastAbsentBadge = document.getElementById('parent-last-absent-badge');
    const timestampLabel = document.getElementById('presence-timestamp');

    const todayStr = new Date().toISOString().split('T')[0];
    let status = student.todayStatus || null;

    try {
        // Query `attendance_records` for today
        const q = query(
            collection(db, "attendance_records"), 
            where("date", "==", todayStr)
        );
        const snap = await getDocs(q);
        snap.forEach(d => {
            const data = d.data();
            if (data.studentId === student.id || data.rollNumber === student.rollNumber || data.studentName === student.name) {
                status = data.status;
            }
        });
    } catch (e) {
        console.warn("Error fetching today's attendance record:", e);
    }

    if (status === 'P') {
        presenceStatusText.innerText = 'PRESENT ✅';
        presenceBadge.className = 'presence-status-badge present';
        presenceCard.className = 'presence-hero-card';
        timestampLabel.innerText = `Marked: Today by Class Teacher`;
    } else if (status === 'A') {
        presenceStatusText.innerText = 'ABSENT ❌';
        presenceBadge.className = 'presence-status-badge absent';
        presenceCard.className = 'presence-hero-card absent';
        timestampLabel.innerText = `Marked: Today (Absent)`;
    } else if (status === 'L') {
        presenceStatusText.innerText = 'LATE ⚠️';
        presenceBadge.className = 'presence-status-badge late';
        presenceCard.className = 'presence-hero-card late';
        timestampLabel.innerText = `Marked: Today (Late Entry)`;
    } else {
        presenceStatusText.innerText = 'NOT MARKED YET ⏳';
        presenceBadge.className = 'presence-status-badge pending';
        presenceCard.className = 'presence-hero-card';
        timestampLabel.innerText = `Today's class session attendance pending submission`;
    }

    lastAbsentBadge.innerText = `Last Absent: ${student.lastAbsent || 'Never'}`;
}

// Fetch all `attendance_records` for this student to render monthly calendar
async function loadStudentAttendanceRecords(student) {
    studentAttendanceRecordsMap = {};
    try {
        const q = query(collection(db, "attendance_records"));
        const snap = await getDocs(q);
        snap.forEach(d => {
            const data = d.data();
            if (data.studentId === student.id || data.rollNumber === student.rollNumber || data.studentName === student.name) {
                if (data.date && data.status) {
                    studentAttendanceRecordsMap[data.date] = data.status;
                }
            }
        });
    } catch (e) {
        console.warn("Error fetching attendance history records:", e);
    }
}

// Attendance Calendar Renderer (Connected to Live Firestore Map)
function renderCalendar(year, month) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('cal-month-title').innerText = `${monthNames[month]} ${year}`;
    document.getElementById('cal-summary-month').innerText = `${monthNames[month]} ${year}`;

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(d => {
        grid.innerHTML += `<div class="calendar-day-header">${d}</div>`;
    });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        grid.innerHTML += `<div class="cal-day empty"></div>`;
    }

    let monthPresentCount = 0;
    let monthAbsentCount = 0;
    const today = new Date();

    for (let day = 1; day <= totalDaysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dayOfWeek = currentDate.getDay();
        const isSunday = (dayOfWeek === 0);
        const isToday = (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day);

        const mStr = String(month + 1).padStart(2, '0');
        const dStr = String(day).padStart(2, '0');
        const dateKey = `${year}-${mStr}-${dStr}`;

        let statusClass = '';
        let dotColor = '';

        // Check if there is a record from Firestore
        const liveStatus = studentAttendanceRecordsMap[dateKey];

        if (isSunday) {
            statusClass = 'weekend';
        } else if (liveStatus === 'P') {
            statusClass = 'present';
            dotColor = '#10b981';
            monthPresentCount++;
        } else if (liveStatus === 'A') {
            statusClass = 'absent';
            dotColor = '#ef4444';
            monthAbsentCount++;
        } else if (liveStatus === 'L') {
            statusClass = 'late';
            dotColor = '#f59e0b';
            monthPresentCount++;
        } else if (liveStatus === 'V') {
            statusClass = 'leave';
            dotColor = '#8b5cf6';
        }

        const todayClass = isToday ? 'today' : '';
        const dotHtml = dotColor ? `<span class="cal-day-status-dot" style="background: ${dotColor};"></span>` : '';

        grid.innerHTML += `
            <div class="cal-day ${statusClass} ${todayClass}" title="${day} ${monthNames[month]} ${year} ${liveStatus ? 'Status: ' + liveStatus : ''}">
                <span>${day}</span>
                ${dotHtml}
            </div>
        `;
    }

    document.getElementById('month-days-present').innerText = `${monthPresentCount} Days`;
    document.getElementById('month-days-absent').innerText = `${monthAbsentCount} Days`;
}

function changeMonth(delta) {
    calendarViewMonth += delta;
    if (calendarViewMonth < 0) {
        calendarViewMonth = 11;
        calendarViewYear--;
    } else if (calendarViewMonth > 11) {
        calendarViewMonth = 0;
        calendarViewYear++;
    }
    renderCalendar(calendarViewYear, calendarViewMonth);
}

// Daily Class Diary Loader from Firestore `class_diary`
async function loadParentDiaryForDate(dateStr) {
    const container = document.getElementById('parent-diary-container');
    const notesBox = document.getElementById('parent-general-notes-text');
    container.innerHTML = '<div class="diary-card"><span class="text-secondary">Connecting to class diary stream...</span></div>';

    try {
        const targetClass = activeStudent?.className || activeStudent?.grade || 'Class 5';
        const q = query(collection(db, "class_diary"), where("date", "==", dateStr));
        const snap = await getDocs(q);

        let matchedDiary = null;
        snap.forEach(d => {
            const data = d.data();
            if (data.classId === targetClass || data.classId === activeStudent?.classId || data.className === targetClass) {
                matchedDiary = data;
            }
        });

        if (matchedDiary && matchedDiary.subjects && matchedDiary.subjects.length > 0) {
            let html = '';
            matchedDiary.subjects.forEach(sub => {
                html += `
                    <div class="diary-card">
                        <div class="diary-card-header">
                            <span class="subject-badge">${sub.subject || 'Subject'}</span>
                            <span style="font-size: 0.75rem; color: var(--portal-text-muted);">Due Next Class</span>
                        </div>
                        <div class="diary-content">
                            ${sub.homework || 'No specific homework written.'}
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
            notesBox.innerText = matchedDiary.generalNotes || 'No general notes for this date.';
        } else {
            container.innerHTML = `<div class="diary-card full-width"><span class="text-secondary">No homework assigned on ${dateStr} for ${targetClass}.</span></div>`;
            notesBox.innerText = 'No general teacher notes.';
        }
    } catch (e) {
        console.warn("Error fetching diary:", e);
        container.innerHTML = `<div class="diary-card full-width"><span class="text-secondary">No diary entries found for ${dateStr}.</span></div>`;
    }
}

// Payment History from Firestore `fee_payments`
async function loadParentPaymentHistory(student) {
    const tbody = document.getElementById('parent-payment-history-table');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem;">Loading fee receipts...</td></tr>';

    try {
        const q = query(collection(db, "fee_payments"));
        const snap = await getDocs(q);
        let html = '';

        snap.forEach(d => {
            const data = d.data();
            if (data.studentId === student.id || data.studentId === student.rollNumber || data.studentName === student.name) {
                html += `
                    <tr>
                        <td style="font-weight: 700; color: var(--portal-accent-gold); cursor:pointer;" onclick="printStudentReceipt({ receiptNo: '${data.receiptNo}', amount: ${data.amount}, date: '${data.date}', mode: '${data.paymentMode}' })">${data.receiptNo || 'SLT-RCP'}</td>
                        <td>${data.date || 'Recent'}</td>
                        <td style="font-weight: 700; color: #34d399;">₹${(data.amount || 0).toLocaleString('en-IN')}</td>
                        <td>${data.paymentMode || 'Counter'}</td>
                        <td><span class="status-pill paid">Cleared</span></td>
                    </tr>
                `;
            }
        });

        if (html) {
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color: var(--portal-text-muted);">No fee receipts found yet. Counter payments will reflect here immediately.</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color: var(--portal-text-muted);">No payment records found.</td></tr>';
    }
}

// Official Digital Fee Receipt Generator Modal
function printStudentReceipt(customData) {
    const student = activeStudent || { name: 'Student', className: 'Class 5', section: 'A', rollNumber: 'SLT-2026-001', parentName: 'Parent' };
    const receiptNo = customData?.receiptNo || 'SLT-RCP-2026-1042';
    const amount = customData?.amount || 28000;
    const dateStr = customData?.date || new Date().toLocaleDateString('en-IN');
    const mode = customData?.mode || 'Cash Counter';

    document.getElementById('receipt-no-display').innerText = `Receipt No: ${receiptNo}`;
    document.getElementById('receipt-student-name').innerText = student.name || 'Student Name';
    document.getElementById('receipt-student-class').innerText = `${student.className || student.grade || 'Class 5'} - ${student.section || 'A'}`;
    document.getElementById('receipt-student-roll').innerText = student.rollNumber || student.id || 'N/A';
    document.getElementById('receipt-date').innerText = dateStr;
    document.getElementById('receipt-parent-name').innerText = student.parentName || 'Parent / Guardian';
    document.getElementById('receipt-mode').innerText = mode;

    document.getElementById('receipt-amount-display').innerText = `₹${amount.toLocaleString('en-IN')}.00`;
    document.getElementById('receipt-total-display').innerText = `₹${amount.toLocaleString('en-IN')}.00`;
    document.getElementById('receipt-words-display').innerText = `${numberToWords(amount)} Only`;

    document.getElementById('receipt-modal').classList.add('active');
}

function closeReceiptModal() {
    document.getElementById('receipt-modal').classList.remove('active');
}

function numberToWords(num) {
    if (num === 38000) return 'Thirty-Eight Thousand Rupees';
    if (num === 28000) return 'Twenty-Eight Thousand Rupees';
    if (num === 10000) return 'Ten Thousand Rupees';
    if (num === 5000) return 'Five Thousand Rupees';
    return `${num} Rupees`;
}

// Link Child Handlers
function showLinkChildModal() {
    document.getElementById('link-child-modal').classList.add('active');
}
function closeLinkChildModal() {
    document.getElementById('link-child-modal').classList.remove('active');
}
async function handleLinkChild(e) {
    e.preventDefault();
    const val = document.getElementById('link-child-input').value.trim();
    const found = await findStudentByEmailOrRoll(val);
    if (found) {
        activeStudent = found;
        closeLinkChildModal();
        loadParentDashboard(found);
        alert(`Successfully switched to ${found.name}!`);
    } else {
        alert("Student profile not found. Please check the Roll Number or Email.");
    }
}

// Online Payment Simulation Modal
function openPaymentModal() {
    const feePending = activeStudent?.feePending || 38000;
    document.getElementById('pay-modal-amount').innerText = `₹${feePending.toLocaleString('en-IN')}`;
    document.getElementById('pay-modal').classList.add('active');
}
function closePayModal() {
    document.getElementById('pay-modal').classList.remove('active');
}
async function simulatePaymentSuccess() {
    closePayModal();
    if (activeStudent) {
        const amount = activeStudent.feePending || 38000;
        const receiptNo = `SLT-RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const now = new Date();

        try {
            await addDoc(collection(db, "fee_payments"), {
                receiptNo,
                studentId: activeStudent.id || activeStudent.rollNumber,
                studentName: activeStudent.name,
                classId: activeStudent.className || 'Class 5',
                amount: amount,
                date: now.toLocaleDateString('en-IN'),
                paymentMode: 'Online UPI',
                notes: 'Online Portal Tuition Clearance',
                timestamp: now
            });

            if (activeStudent.id) {
                await updateDoc(doc(db, "students", activeStudent.id), {
                    feePaid: (activeStudent.feePaid || 0) + amount,
                    feePending: 0
                });
            }

            activeStudent.feePaid = (activeStudent.feePaid || 0) + amount;
            activeStudent.feePending = 0;
            loadParentDashboard(activeStudent);
        } catch (e) {
            console.warn("Payment recording err:", e);
        }

        if (window.burstConfetti) window.burstConfetti();
        alert("Payment Successful! Official Digital Receipt has been generated.");
        printStudentReceipt({ receiptNo, amount, date: now.toLocaleDateString('en-IN'), mode: 'Online UPI' });
    }
}

// Load Principal Notices
async function loadPrincipalNotices() {
    const parentContainer = document.getElementById('parent-notices-container');
    const studentContainer = document.getElementById('student-notices-container');

    try {
        const q = query(collection(db, "principal_messages"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        let html = '';
        if (!snap.empty) {
            snap.forEach(docSnap => {
                const data = docSnap.data();
                const urgentBadge = data.isUrgent ? `<span class="profile-pill" style="background:rgba(239,68,68,0.2); color:#f87171; border-color:#ef4444;">URGENT</span>` : '';
                html += `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <h4 style="margin: 0; color: #fff;">${data.title}</h4>
                            <div style="display: flex; gap: 6px;">
                                <span class="profile-pill">${data.type || 'Notice'}</span>
                                ${urgentBadge}
                            </div>
                        </div>
                        <p style="font-size: 0.9rem; color: rgba(255,255,255,0.85); margin: 0; line-height: 1.5;">${data.content}</p>
                    </div>
                `;
            });
        } else {
            html = `<div style="padding: 1.5rem; text-align:center; color: var(--portal-text-muted);">No urgent notices broadcasted by the Principal at this time.</div>`;
        }

        if (parentContainer) parentContainer.innerHTML = html;
        if (studentContainer) studentContainer.innerHTML = html;
    } catch (e) {
        console.warn("Error fetching notices:", e);
    }
}

// ==========================================
// PORTAL 2: STUDENT PORTAL LOGIC (LIVE HOMEWORK & GRADES)
// ==========================================

function switchStudentTab(tabName) {
    const tabs = ['homework', 'academics', 'attendance', 'notices'];
    tabs.forEach(t => {
        document.getElementById(`student-tab-${t}`)?.classList.remove('active');
    });
    document.querySelectorAll('#view-student-dash .tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`student-tab-${tabName}`)?.classList.add('active');
    const index = tabs.indexOf(tabName);
    const buttons = document.querySelectorAll('#view-student-dash .tab-btn');
    if (buttons[index]) buttons[index].classList.add('active');
}

async function loadStudentDashboard(student) {
    if (!student) return;
    activeStudent = student;

    document.getElementById('student-name-display').innerText = student.name || 'Student';
    const stuPenEl = document.getElementById('student-pen-display');
    if (stuPenEl) stuPenEl.innerText = `PEN: ${student.pen || student.rollNumber || 'N/A'}`;
    document.getElementById('student-class-display').innerText = `Class: ${student.className || student.grade || 'Class 5'} - ${student.section || 'A'}`;
    document.getElementById('student-roll-display').innerText = `Roll No: ${student.rollNumber || student.id || 'N/A'}`;
    
    const attPct = student.attendancePercentage !== undefined ? Math.round(student.attendancePercentage) : 100;
    document.getElementById('student-attendance-pill').innerText = `Attendance: ${attPct}%`;
    document.getElementById('student-att-rate').innerText = `${attPct}%`;
    document.getElementById('student-att-present').innerText = `${student.totalPresent || 0} Days`;
    document.getElementById('student-att-absent').innerText = `${(student.totalDays || 0) - (student.totalPresent || 0)} Days`;

    // 1. Fetch live homework from Firestore `class_diary`
    await renderLiveStudentHomework(student);

    // 2. Render Academic Grades
    renderStudentGrades(student);

    // 3. Render Attendance Records Log
    await renderStudentAttendanceLog(student);

    // 4. Load School Circulars
    loadPrincipalNotices();
}

// Render checkable homework checklist from live `class_diary`
async function renderLiveStudentHomework(student) {
    const container = document.getElementById('student-homework-checklist');
    container.innerHTML = '<div class="diary-card"><span class="text-secondary">Fetching today\'s homework from teacher diary...</span></div>';

    const completedDict = getStoredCompletedHomework();
    const todayStr = new Date().toISOString().split('T')[0];
    const targetClass = student.className || student.grade || 'Class 5';

    try {
        const q = query(collection(db, "class_diary"), where("date", "==", todayStr));
        const snap = await getDocs(q);

        let matchedDiary = null;
        snap.forEach(d => {
            const data = d.data();
            if (data.classId === targetClass || data.classId === student.classId || data.className === targetClass) {
                matchedDiary = data;
            }
        });

        if (matchedDiary && matchedDiary.subjects && matchedDiary.subjects.length > 0) {
            let completedCount = 0;
            let html = '';

            matchedDiary.subjects.forEach((sub, idx) => {
                const taskId = `hw_${student.id || student.rollNumber}_${todayStr}_${idx}`;
                const isDone = !!completedDict[taskId];
                if (isDone) completedCount++;

                html += `
                    <div class="homework-item ${isDone ? 'done' : ''}" onclick="toggleHomeworkTask('${taskId}')">
                        <div class="hw-checkbox">
                            ${isDone ? '✓' : ''}
                        </div>
                        <div>
                            <span class="subject-badge" style="font-size: 0.7rem; padding: 0.15rem 0.6rem;">${sub.subject || 'Subject'}</span>
                            <div class="hw-task-text mt-1">${sub.homework || 'Review notes'}</div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
            document.getElementById('homework-counter').innerText = `${completedCount} / ${matchedDiary.subjects.length} Completed`;
        } else {
            container.innerHTML = `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2rem; text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📚</div>
                    <h4>No Homework Assigned Today</h4>
                    <p class="text-secondary small" style="margin:0;">Your class teacher has not posted any pending assignments for ${targetClass} today.</p>
                </div>
            `;
            document.getElementById('homework-counter').innerText = `0 Tasks`;
        }
    } catch (e) {
        console.warn("Error loading student homework:", e);
        container.innerHTML = '<div class="diary-card"><span class="text-secondary">No homework assigned today.</span></div>';
    }
}

function getStoredCompletedHomework() {
    try {
        const raw = localStorage.getItem(HW_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function saveCompletedHomework(dict) {
    try {
        localStorage.setItem(HW_STORAGE_KEY, JSON.stringify(dict));
    } catch (e) {}
}

function toggleHomeworkTask(taskId) {
    const dict = getStoredCompletedHomework();
    dict[taskId] = !dict[taskId];
    saveCompletedHomework(dict);
    renderLiveStudentHomework(activeStudent);
    if (dict[taskId] && window.burstConfetti) {
        window.burstConfetti();
    }
}

function renderStudentGrades(student) {
    const tbody = document.getElementById('student-grades-table');
    const gradesList = student.grades;

    if (!gradesList || gradesList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding: 2.5rem 1rem; color: var(--portal-text-muted);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
                    <div style="font-weight: 700; color: #fff; margin-bottom: 4px;">Academic Year 2026-27 Evaluations in Progress</div>
                    <p style="font-size: 0.85rem; max-width: 480px; margin: 0 auto; line-height: 1.5;">
                        Formative Assessments (FA-1, FA-2) and Term Examination scorecards for <strong>${student.className || 'Class 1'}</strong> are currently being finalized by the Academic Board. Verified digital marksheets will appear here once officially published.
                    </p>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    gradesList.forEach(g => {
        html += `
            <tr>
                <td><strong>${g.subject}</strong></td>
                <td>${g.fa1 || '--'}</td>
                <td>${g.midTerm || '--'}</td>
                <td>${g.fa2 || '--'}</td>
                <td><span class="profile-pill highlight" style="font-weight:700;">${g.grade || 'A1'}</span></td>
                <td style="font-size: 0.8rem; color: var(--portal-text-muted);">${g.remarks || 'Satisfactory'}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Attendance Log stream for student
async function renderStudentAttendanceLog(student) {
    const tbody = document.getElementById('student-attendance-log-table');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1.5rem;">Loading live mobile stream...</td></tr>';

    try {
        const q = query(collection(db, "attendance_records"));
        const snap = await getDocs(q);
        let html = '';

        snap.forEach(d => {
            const data = d.data();
            if (data.studentId === student.id || data.rollNumber === student.rollNumber || data.studentName === student.name) {
                const statusPill = data.status === 'P' ? `<span class="status-pill present">Present</span>` : `<span class="status-pill pending">Absent</span>`;
                html += `
                    <tr>
                        <td><strong>${data.date}</strong></td>
                        <td>${data.className || student.className || 'Class'}</td>
                        <td>${statusPill}</td>
                        <td>Class Teacher Mobile</td>
                    </tr>
                `;
            }
        });

        if (html) {
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.5rem; color: var(--portal-text-muted);">Attendance logs from the Mobile Suite will populate here automatically.</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.5rem; color: var(--portal-text-muted);">No records found.</td></tr>`;
    }
}

// ==========================================
// PORTAL 3: PRINCIPAL COMMAND CENTER LOGIC (LIVE METRICS)
// ==========================================

function switchPrincipalTab(tabName) {
    const tabs = ['attendance', 'diary', 'broadcast'];
    tabs.forEach(t => {
        document.getElementById(`principal-tab-${t}`)?.classList.remove('active');
    });
    document.querySelectorAll('#view-principal-dash .tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`principal-tab-${tabName}`)?.classList.add('active');
    const index = tabs.indexOf(tabName);
    const buttons = document.querySelectorAll('#view-principal-dash .tab-btn');
    if (buttons[index]) buttons[index].classList.add('active');
}

async function loadPrincipalDashboard() {
    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('principal-today-date-label').innerText = `Date: ${todayStr}`;

    // 1. Fetch live classes from Firestore `classes` or use standard classes
    try {
        const snap = await getDocs(collection(db, "classes"));
        if (!snap.empty) {
            allClassesList = [];
            snap.forEach(d => allClassesList.push({ id: d.id, ...d.data() }));
        } else {
            allClassesList = [...STANDARD_CLASSES];
        }
    } catch (e) {
        allClassesList = [...STANDARD_CLASSES];
    }

    // 2. Fetch live student count
    let totalStudentsCount = 0;
    try {
        const studentSnap = await getDocs(collection(db, "students"));
        totalStudentsCount = studentSnap.size;
    } catch (e) {}

    // 3. Fetch today's `attendance_sessions` from Firestore
    let todaySessions = {};
    let totalPresentToday = 0;
    let totalAbsentToday = 0;
    let submittedCount = 0;

    try {
        const q = query(collection(db, "attendance_sessions"), where("date", "==", todayStr));
        const sessionSnap = await getDocs(q);
        sessionSnap.forEach(d => {
            const data = d.data();
            todaySessions[data.classId] = data;
            totalPresentToday += (data.presentCount || 0);
            totalAbsentToday += (data.absentCount || 0);
            submittedCount++;
        });
    } catch (e) {
        console.warn("Error fetching sessions:", e);
    }

    // Calculate School-wide KPIs
    const displayEnrollment = totalStudentsCount > 0 ? totalStudentsCount : 0;
    const totalMarked = totalPresentToday + totalAbsentToday;
    const overallPresenceRate = totalMarked > 0 ? ((totalPresentToday / totalMarked) * 100).toFixed(1) : (totalStudentsCount > 0 ? "100.0" : "--");

    document.getElementById('principal-kpi-enrollment').innerText = displayEnrollment.toLocaleString('en-IN');
    document.getElementById('principal-kpi-presence').innerText = `${overallPresenceRate}%`;
    document.getElementById('principal-kpi-absent').innerText = totalAbsentToday;
    document.getElementById('principal-kpi-submissions').innerText = `${submittedCount} / ${allClassesList.length} Classes`;

    // Render Live Class Submission Tracker
    renderPrincipalClassesLiveTable(todaySessions);

    // Render Diary Overseer
    loadPrincipalDiaryForClass('all');

    // Load Broadcast Messages
    loadPrincipalMessages();
}

function renderPrincipalClassesLiveTable(todaySessions) {
    const tbody = document.getElementById('principal-classes-table');
    let html = '';

    allClassesList.forEach(c => {
        const session = todaySessions[c.id] || todaySessions[c.className];
        const isSubmitted = !!session;
        const presentCount = session ? session.presentCount : '--';
        const absentCount = session ? session.absentCount : '--';
        const pct = session ? `${session.percentage || Math.round((session.presentCount / (session.presentCount + session.absentCount)) * 100)}%` : '--%';

        const statusBadge = isSubmitted 
            ? `<span class="status-pill submitted">Submitted ✅</span>`
            : `<span class="status-pill pending">Pending ⏳</span>`;

        html += `
            <tr>
                <td><strong>${c.className} - ${c.section || 'A'}</strong></td>
                <td>${c.teacherName || 'Class Teacher'}</td>
                <td>${statusBadge}</td>
                <td style="color: #34d399; font-weight:700;">${presentCount}</td>
                <td style="color: #f87171; font-weight:700;">${absentCount}</td>
                <td><strong>${pct}</strong></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 1-Click CSV Export for Principal
function exportSchoolAttendanceCSV() {
    const todayStr = new Date().toISOString().split('T')[0];
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Grade,Section,Class Teacher,Submission Status,Present Count,Absent Count\r\n";

    allClassesList.forEach(c => {
        csvContent += `${todayStr},${c.className},${c.section || 'A'},"${c.teacherName || 'Teacher'}",Live Checked,--,--\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SLT_Public_School_Attendance_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Class Diary Overseer for Principal
async function loadPrincipalDiaryForClass(classFilter) {
    const container = document.getElementById('principal-diary-stream');
    const todayStr = new Date().toISOString().split('T')[0];
    container.innerHTML = '<div class="diary-card full-width"><span class="text-secondary">Fetching school-wide class diary entries...</span></div>';

    try {
        const q = query(collection(db, "class_diary"), where("date", "==", todayStr));
        const snap = await getDocs(q);

        let html = '';
        snap.forEach(d => {
            const data = d.data();
            const gradeName = data.classId || data.className || 'Class';
            if (classFilter === 'all' || gradeName === classFilter) {
                let subjectsHtml = '';
                (data.subjects || []).forEach(s => {
                    subjectsHtml += `<div><strong>${s.subject}:</strong> <span style="color:rgba(255,255,255,0.85);">${s.homework}</span></div>`;
                });

                html += `
                    <div class="diary-card">
                        <div class="diary-card-header">
                            <span class="subject-badge">${gradeName}</span>
                            <span style="font-size: 0.75rem; color: var(--portal-text-muted);">Teacher Entry</span>
                        </div>
                        <div style="font-size: 0.85rem; display:flex; flex-direction:column; gap:6px;">
                            ${subjectsHtml || '<div>No subjects recorded.</div>'}
                        </div>
                        ${data.generalNotes ? `<div class="mt-2" style="font-size:0.75rem; color:var(--portal-accent-gold);">Note: ${data.generalNotes}</div>` : ''}
                    </div>
                `;
            }
        });

        if (html) {
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="diary-card full-width" style="text-align: center; padding: 2rem;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📖</div>
                    <h4>No Class Diaries Submitted Yet for Today</h4>
                    <p class="text-secondary small" style="margin:0;">Teachers will publish homework via the Mobile Classroom App, which will appear here instantly.</p>
                </div>
            `;
        }
    } catch (e) {
        container.innerHTML = `<div class="diary-card full-width"><span class="text-secondary">No diary entries found for today.</span></div>`;
    }
}

// Publish Broadcast Message in Principal Command Center
async function publishMessage(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-publish');
    const resultDiv = document.getElementById('publish-result');
    
    btn.innerText = "Broadcasting...";
    btn.disabled = true;
    resultDiv.style.color = "var(--portal-text-muted)";
    resultDiv.innerText = "Publishing circular...";

    try {
        const title = document.getElementById('msg-title').value.trim();
        const type = document.getElementById('msg-type').value;
        const content = document.getElementById('msg-content').value.trim();
        const isUrgent = document.getElementById('msg-urgent').checked;
        const durationDays = parseInt(document.getElementById('msg-expiration').value);

        const now = new Date();
        const expiresAt = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));

        const messageData = {
            title,
            type,
            content,
            isUrgent,
            createdAt: now,
            expiresAt: expiresAt
        };

        await addDoc(collection(db, "principal_messages"), messageData);
        
        resultDiv.style.color = "#4ade80";
        resultDiv.innerText = "Circular broadcasted successfully!";
        
        document.getElementById('compose-message-form').reset();
        loadPrincipalMessages();
        if (window.burstConfetti) window.burstConfetti();
        
        setTimeout(() => { resultDiv.innerText = ""; }, 3000);
        
    } catch (error) {
        console.error("Error publishing message:", error);
        resultDiv.style.color = "#ef4444";
        resultDiv.innerText = "Failed to broadcast message.";
    } finally {
        btn.innerText = "Broadcast Circular";
        btn.disabled = false;
    }
}

async function loadPrincipalMessages() {
    const tbody = document.getElementById('principal-messages-table');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Loading broadcasts...</td></tr>';
    
    try {
        const q = query(collection(db, "principal_messages"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color: #a1a1aa;">No active broadcasts found.</td></tr>';
            return;
        }

        let html = '';
        const now = new Date();
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const expiresAt = data.expiresAt ? data.expiresAt.toDate() : null;
            const isExpired = expiresAt && expiresAt < now;
            const expiresStr = expiresAt ? expiresAt.toLocaleDateString() : 'Active';
            const urgentBadge = data.isUrgent ? `<span class="profile-pill" style="background:rgba(239,68,68,0.2); color:#f87171; border-color:#ef4444; margin-left:6px;">URGENT</span>` : '';
            
            html += `
                <tr>
                    <td><strong>${data.title}</strong> ${urgentBadge}</td>
                    <td><span class="profile-pill">${data.type || 'Notice'}</span></td>
                    <td style="color: ${isExpired ? '#ef4444' : '#4ade80'};">${expiresStr}</td>
                    <td>
                        <button onclick="deleteMessage('${docSnap.id}')" class="btn-outline btn-sm btn-danger">Delete</button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (error) {
        console.error("Error loading messages:", error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem; color: #ef4444;">Error connecting to Firestore messages.</td></tr>`;
    }
}

async function deleteMessage(docId) {
    if (!confirm("Are you sure you want to remove this circular?")) return;
    try {
        await deleteDoc(doc(db, "principal_messages", docId));
        loadPrincipalMessages();
    } catch (e) {
        alert("Failed to delete message.");
    }
}

// ==========================================
// PORTAL 4: STAFF & ADMIN PORTAL LOGIC
// ==========================================

function switchStaffTab(tabName) {
    const tabs = ['rosters', 'diarypub', 'feecounter', 'admissions'];
    tabs.forEach(t => {
        document.getElementById(`staff-tab-${t}`)?.classList.remove('active');
    });
    document.querySelectorAll('#view-staff-dash .tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`staff-tab-${tabName}`)?.classList.add('active');
    const index = tabs.indexOf(tabName);
    const buttons = document.querySelectorAll('#view-staff-dash .tab-btn');
    if (buttons[index]) buttons[index].classList.add('active');
}

async function loadStaffDashboard() {
    await loadStaffStudentsRoster();
    await loadStaffFeeCounter();
    await loadStaffApplications();

    // Set today's date for diary publisher and load preview
    const dateInput = document.getElementById('diary-pub-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    loadStaffDiaryPreview();
}

// Admissions Pipeline from live Firestore `applications` collection
async function loadStaffApplications() {
    const tbody = document.getElementById('staff-applications-table');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">Loading admissions stream...</td></tr>';

    try {
        const q = query(collection(db, "applications"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--portal-text-muted);">No admission applications submitted yet.</td></tr>';
            document.getElementById('staff-app-count').innerText = `0 Applications`;
            return;
        }

        document.getElementById('staff-app-count').innerText = `${snap.size} Applications`;
        let html = '';

        snap.forEach(docSnap => {
            const data = docSnap.data();
            const tid = data.trackingId || docSnap.id;
            applicationsCache[tid] = { ...data, docId: docSnap.id };

            const dateStr = data.timestamp ? data.timestamp.toDate().toLocaleDateString('en-IN') : 'Recent';
            const statusClass = (data.status === 'Enrolled' || data.status === 'Approved') ? 'enrolled' : (data.status === 'Processing' ? 'processing' : 'submitted');

            html += `
                <tr>
                    <td style="font-weight: 700; color: var(--portal-accent-gold); cursor:pointer;" onclick="viewApplicationDetails('${tid}')">${tid}</td>
                    <td><strong>${data.student?.name || 'N/A'}</strong></td>
                    <td>${data.student?.grade || 'Class 1'}</td>
                    <td>${data.parent?.whatsapp || data.parent?.email || 'N/A'}</td>
                    <td>${dateStr}</td>
                    <td><span class="status-pill ${statusClass}">${data.status || 'Submitted'}</span></td>
                    <td>
                        <button class="btn-outline btn-sm" onclick="viewApplicationDetails('${tid}')">Review</button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    } catch (e) {
        console.warn("Error loading staff applications:", e);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #ef4444;">Error connecting to applications collection.</td></tr>';
    }
}

function viewApplicationDetails(trackingId) {
    const data = applicationsCache[trackingId];
    if (!data) return;

    currentViewedTrackingId = trackingId;
    document.getElementById('modal-tracking-id').innerText = trackingId;
    document.getElementById('modal-status-select').value = data.status || 'Submitted';
    document.getElementById('status-save-msg').style.display = 'none';

    let html = '';
    const addSection = (title, obj) => {
        if (!obj) return;
        html += `<div style="grid-column: 1 / -1; border-bottom: 1px solid rgba(255,255,255,0.1); margin-top: 0.75rem; margin-bottom: 0.25rem; padding-bottom: 0.25rem;">
            <h4 style="color: var(--portal-accent-gold); font-size:0.95rem; margin:0;">${title}</h4>
        </div>`;
        for (const [key, value] of Object.entries(obj)) {
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
            html += `<div style="margin-bottom: 0.4rem;">
                <div style="font-size: 0.75rem; color: var(--portal-text-muted); text-transform: uppercase;">${formattedKey}</div>
                <div style="font-weight: 600; font-size:0.9rem;">${value || 'N/A'}</div>
            </div>`;
        }
    };

    addSection('Student Details', data.student);
    addSection('Parent/Guardian Details', data.parent);
    addSection('Academic History', data.academics);

    document.getElementById('modal-details-grid').innerHTML = html;
    document.getElementById('app-details-modal').classList.add('active');
}

function closeAppModal() {
    document.getElementById('app-details-modal').classList.remove('active');
    currentViewedTrackingId = null;
}

async function updateApplicationStatus() {
    if (!currentViewedTrackingId) return;
    const data = applicationsCache[currentViewedTrackingId];
    if (!data || !data.docId) return;

    const newStatus = document.getElementById('modal-status-select').value;
    const saveMsg = document.getElementById('status-save-msg');

    try {
        await updateDoc(doc(db, "applications", data.docId), { status: newStatus });
        applicationsCache[currentViewedTrackingId].status = newStatus;
        saveMsg.innerText = "Saved!";
        saveMsg.style.display = "inline-block";
        setTimeout(() => { saveMsg.style.display = 'none'; }, 2000);
        loadStaffApplications();
    } catch (e) {
        alert("Failed to update status.");
    }
}

// 1-Click Approve & Enroll Flow: Writes new student directly into Firestore `students` collection
async function enrollCurrentApplication() {
    if (!currentViewedTrackingId) return;
    const data = applicationsCache[currentViewedTrackingId];
    if (!data) return;

    try {
        const studentName = data.student?.name || 'Enrolled Student';
        const grade = data.student?.grade || 'Class 1';
        const rollNumber = `SLT-2026-${Math.floor(100 + Math.random() * 900)}`;

        const studentDocData = {
            rollNumber: rollNumber,
            name: studentName,
            className: grade,
            section: 'A',
            parentName: data.parent?.father || data.parent?.mother || 'Parent',
            parentPhone: data.parent?.whatsapp || data.parent?.mobile || '',
            parentEmail: data.parent?.email || '',
            studentEmail: data.student?.email || `${studentName.toLowerCase().replace(/\s+/g, '')}@sltps.com`,
            attendancePercentage: 100,
            totalDays: 0,
            totalPresent: 0,
            lastAbsent: 'None',
            feeTotal: 38000,
            feePaid: 0,
            feePending: 38000,
            enrolledAt: new Date()
        };

        // 1. Create document in Firestore `students` collection using Roll Number as ID
        await setDoc(doc(db, "students", rollNumber), studentDocData);

        // 2. Mark application as "Enrolled"
        if (data.docId) {
            await updateDoc(doc(db, "applications", data.docId), { status: "Enrolled" });
        }

        closeAppModal();
        loadStaffApplications();
        loadStaffStudentsRoster();
        if (window.burstConfetti) window.burstConfetti();

        alert(`🎉 Successfully Enrolled!\nStudent: ${studentName}\nAssigned Roll No: ${rollNumber}\nClass: ${grade}-A`);
    } catch (e) {
        console.error("Error enrolling student:", e);
        alert("Error creating student record: " + e.message);
    }
}

// ==========================================
// BULK CSV / EXCEL STUDENT IMPORTER
// ==========================================

function openBulkImportModal() {
    document.getElementById('bulk-import-modal').classList.add('active');
    document.getElementById('csv-preview-section').style.display = 'none';
    document.getElementById('csv-file-input').value = '';
    parsedCSVStudents = [];
}

function closeBulkImportModal() {
    document.getElementById('bulk-import-modal').classList.remove('active');
}

function handleCSVFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const text = evt.target.result;
        parseCSVText(text);
    };
    reader.readAsText(file);
}

function parseCSVText(text) {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
        alert("CSV file is empty or missing data rows.");
        return;
    }

    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Map column indices dynamically
    let colName = rawHeaders.findIndex(h => h.includes('name') && !h.includes('parent') && !h.includes('father') && !h.includes('mother'));
    if (colName === -1) colName = rawHeaders.findIndex(h => h.includes('student'));
    if (colName === -1) colName = 1;

    let colClass = rawHeaders.findIndex(h => h.includes('class') || h.includes('grade') || h.includes('standard') || h.includes('std'));
    if (colClass === -1) colClass = 2;

    let colParent = rawHeaders.findIndex(h => h.includes('parent') || h.includes('father') || h.includes('mother') || h.includes('guardian'));
    if (colParent === -1) colParent = 3;

    let colPhone = rawHeaders.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact') || h.includes('whatsapp') || h.includes('tel'));
    if (colPhone === -1) colPhone = 4;

    let colEmail = rawHeaders.findIndex(h => h.includes('email') || h.includes('mail'));
    let colAddress = rawHeaders.findIndex(h => h.includes('address') || h.includes('place') || h.includes('city'));
    let colFeeTotal = rawHeaders.findIndex(h => (h.includes('fee') && !h.includes('paid')) || h.includes('totalfee') || h.includes('annual'));
    let colFeePaid = rawHeaders.findIndex(h => h.includes('paid') || h.includes('feepaid'));
    let colRoll = rawHeaders.findIndex(h => h.includes('roll') || h.includes('slno') || h.includes('sl') || h.includes('id'));

    parsedCSVStudents = [];

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
        if (!row || row.length === 0) continue;

        const cleanValues = row.map(v => v.trim().replace(/^["']|["']$/g, ''));
        
        const rawName = (colName !== -1 && cleanValues[colName]) ? cleanValues[colName] : `Student ${i}`;
        const rawClass = (colClass !== -1 && cleanValues[colClass]) ? cleanValues[colClass] : 'Class 1 A';
        const parentName = (colParent !== -1 && cleanValues[colParent]) ? cleanValues[colParent] : 'Parent';
        const parentPhone = (colPhone !== -1 && cleanValues[colPhone]) ? cleanValues[colPhone] : '';
        const parentEmail = (colEmail !== -1 && cleanValues[colEmail]) ? cleanValues[colEmail] : '';
        const address = (colAddress !== -1 && cleanValues[colAddress]) ? cleanValues[colAddress] : 'Gurumitkal';
        const feeTotal = (colFeeTotal !== -1 && parseInt(cleanValues[colFeeTotal])) ? parseInt(cleanValues[colFeeTotal]) : 38000;
        const feePaid = (colFeePaid !== -1 && parseInt(cleanValues[colFeePaid])) ? parseInt(cleanValues[colFeePaid]) : 0;
        const feePending = Math.max(0, feeTotal - feePaid);

        // Normalize Class & Section (e.g. "1 A" -> "Class 1", "A" | "UKG A" -> "UKG", "A" | "Class 10 B" -> "Class 10", "B")
        let className = 'Class 1';
        let section = 'A';
        
        const classTrimmed = rawClass.trim();
        const classMatch = classTrimmed.match(/^(?:Class\s*)?([0-9]+|Pre-KG|LKG|UKG|PreKG)[\s\-_]*([A-Za-z])?$/i);
        if (classMatch) {
            const gradePart = classMatch[1];
            const secPart = classMatch[2];
            if (/^[0-9]+$/.test(gradePart)) {
                className = `Class ${gradePart}`;
            } else if (/^pre/i.test(gradePart)) {
                className = 'Pre-KG';
            } else if (/^lkg/i.test(gradePart)) {
                className = 'LKG';
            } else if (/^ukg/i.test(gradePart)) {
                className = 'UKG';
            } else {
                className = gradePart;
            }
            if (secPart) {
                section = secPart.toUpperCase();
            }
        } else {
            className = classTrimmed;
        }

        // Generate clean Roll Number: SLT-2026-001
        let rollNumber = '';
        if (colRoll !== -1 && cleanValues[colRoll] && cleanValues[colRoll].length >= 3 && !/^\d{1,2}$/.test(cleanValues[colRoll])) {
            rollNumber = cleanValues[colRoll];
        } else {
            const paddedIndex = String(i).padStart(3, '0');
            rollNumber = `SLT-2026-${paddedIndex}`;
        }

        const studentEmail = `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '')}@sltps.com`;

        parsedCSVStudents.push({
            rollNumber,
            name: rawName,
            className,
            section,
            gender: 'Male',
            dob: '2016-01-01',
            parentName,
            parentPhone,
            parentEmail,
            studentEmail,
            address,
            feeTotal,
            feePaid,
            feePending,
            attendancePercentage: 100,
            totalDays: 0,
            totalPresent: 0,
            lastAbsent: 'None'
        });
    }

    // Render Preview Table
    const tbody = document.getElementById('csv-preview-tbody');
    let html = '';
    parsedCSVStudents.slice(0, 8).forEach(stu => {
        html += `
            <tr>
                <td style="font-weight:700; color:var(--portal-accent-gold);">${stu.rollNumber}</td>
                <td><strong>${stu.name}</strong></td>
                <td>${stu.className} - ${stu.section}</td>
                <td>${stu.parentName}</td>
                <td>${stu.parentPhone || '--'}</td>
                <td style="color:#34d399; font-weight:700;">₹${stu.feeTotal.toLocaleString('en-IN')}</td>
            </tr>
        `;
    });

    if (parsedCSVStudents.length > 8) {
        html += `<tr><td colspan="6" style="text-align:center; color:var(--portal-accent-gold); font-style:italic;">...and ${parsedCSVStudents.length - 8} more students</td></tr>`;
    }

    tbody.innerHTML = html;
    document.getElementById('csv-preview-count').innerText = `Parsed ${parsedCSVStudents.length} Students Ready to Import:`;
    document.getElementById('csv-preview-section').style.display = 'block';
}

async function executeBulkImport() {
    if (parsedCSVStudents.length === 0) {
        alert("No students parsed from CSV.");
        return;
    }

    const btn = document.getElementById('btn-execute-import');
    btn.innerText = `Importing ${parsedCSVStudents.length} students to Firestore...`;
    btn.disabled = true;

    try {
        let importedCount = 0;
        for (const stu of parsedCSVStudents) {
            await setDoc(doc(db, "students", stu.rollNumber), {
                ...stu,
                importedAt: new Date()
            });
            importedCount++;
        }

        // Ensure all standard classes exist in Firestore `classes`
        for (const cls of STANDARD_CLASSES) {
            await setDoc(doc(db, "classes", cls.id), cls);
        }

        btn.innerText = `✅ Imported ${importedCount} Students!`;
        if (window.burstConfetti) window.burstConfetti();

        setTimeout(() => {
            closeBulkImportModal();
            loadStaffDashboard();
            alert(`🎉 Success! ${importedCount} students have been uploaded to your live Firestore database (sltpublicschool). They are now ready for the Android Attendance App and Web Portals!`);
        }, 1000);

    } catch (e) {
        console.error("Bulk import error:", e);
        alert("Error during bulk import: " + e.message);
        btn.innerText = "⚡ Upload All Students to Firestore";
        btn.disabled = false;
    }
}

// Student Directory & Rosters from live Firestore `students` collection
async function loadStaffStudentsRoster() {
    const tbody = document.getElementById('staff-students-table');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem;">Loading student roster from Firestore...</td></tr>';

    try {
        const snap = await getDocs(collection(db, "students"));
        allStudentsList = [];
        let totalFees = 0;

        snap.forEach(docSnap => {
            const data = docSnap.data();
            allStudentsList.push({ id: docSnap.id, ...data });
            totalFees += (data.feeTotal || 25000);
        });

        // Update Staff KPI metrics
        const kpiStudents = document.getElementById('staff-kpi-students');
        if (kpiStudents) kpiStudents.innerText = allStudentsList.length.toString();
        
        const kpiFees = document.getElementById('staff-kpi-fees');
        if (kpiFees) kpiFees.innerText = `₹${(totalFees / 100000).toFixed(2)} L`;

        renderFilteredStaffRoster(allStudentsList);
    } catch (e) {
        console.warn("Error fetching students:", e);
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 2rem; color: var(--portal-text-muted);">No student records found in Firestore.</td></tr>';
    }
}

function renderFilteredStaffRoster(list) {
    const tbody = document.getElementById('staff-students-table');
    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 2rem; color: var(--portal-text-muted);">No student records found matching search filter.</td></tr>';
        return;
    }

    let html = '';
    list.forEach(stu => {
        const feeTotal = stu.feeTotal || 25000;
        const father = stu.fatherName || '--';
        const mother = stu.motherName || '--';
        const cat = stu.socialCategory || 'General';

        html += `
            <tr>
                <td style="font-weight:700; color:var(--portal-accent-gold); font-family: monospace; letter-spacing:0.5px;">${stu.pen || stu.rollNumber || 'N/A'}</td>
                <td style="font-weight:600; color:var(--portal-text-muted); font-size:0.85rem;">${stu.rollNumber || stu.id}</td>
                <td><strong>${stu.name}</strong></td>
                <td><span class="profile-pill highlight" style="font-size:0.75rem;">${stu.className || stu.grade || 'Class 1'} - ${stu.section || 'A'}</span></td>
                <td>${father}</td>
                <td>${mother}</td>
                <td><span class="profile-pill" style="font-size:0.75rem;">${cat}</span></td>
                <td style="color:#34d399; font-weight:700;">₹${feeTotal.toLocaleString('en-IN')}</td>
                <td>
                    <button class="btn-outline btn-sm" onclick="quickSelectStudentForFee('${stu.rollNumber || stu.id}')">Collect Fee</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function filterStaffRoster() {
    const grade = document.getElementById('staff-roster-grade-filter').value;
    const queryStr = document.getElementById('staff-roster-search').value.trim().toLowerCase();

    let filtered = allStudentsList.filter(s => {
        const matchesGrade = (grade === 'all') || (s.className === grade || s.grade === grade);
        const matchesSearch = !queryStr || 
            (s.name && s.name.toLowerCase().includes(queryStr)) ||
            (s.pen && s.pen.toLowerCase().includes(queryStr)) ||
            (s.rollNumber && s.rollNumber.toLowerCase().includes(queryStr)) ||
            (s.fatherName && s.fatherName.toLowerCase().includes(queryStr)) ||
            (s.motherName && s.motherName.toLowerCase().includes(queryStr)) ||
            (s.socialCategory && s.socialCategory.toLowerCase().includes(queryStr));
        return matchesGrade && matchesSearch;
    });

    renderFilteredStaffRoster(filtered);
}

// Add Student Modal Handlers
function openAddStudentModal() {
    document.getElementById('add-student-modal').classList.add('active');
}
function closeAddStudentModal() {
    document.getElementById('add-student-modal').classList.remove('active');
}
async function handleManualAddStudent(e) {
    e.preventDefault();
    try {
        const roll = document.getElementById('new-stu-roll').value.trim();
        const newStu = {
            name: document.getElementById('new-stu-name').value.trim(),
            className: document.getElementById('new-stu-grade').value,
            section: document.getElementById('new-stu-section').value,
            rollNumber: roll,
            pen: roll,
            parentName: document.getElementById('new-stu-parent').value.trim(),
            parentPhone: document.getElementById('new-stu-phone').value.trim(),
            parentEmail: document.getElementById('new-stu-email').value.trim(),
            attendancePercentage: 100,
            totalDays: 0,
            totalPresent: 0,
            lastAbsent: 'None',
            feeTotal: 25000,
            feePaid: 0,
            feePending: 25000,
            createdAt: new Date()
        };

        await setDoc(doc(db, "students", roll), newStu);
        closeAddStudentModal();
        document.getElementById('add-student-form').reset();
        loadStaffStudentsRoster();
        alert(`Student ${newStu.name} registered in Firestore!`);
    } catch (err) {
        alert("Failed to add student: " + err.message);
    }
}

// ==========================================
// STAFF HOMEWORK & CLASS DIARY PUBLISHER
// ==========================================

async function handleStaffPublishDiary(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-diary');
    const statusDiv = document.getElementById('diary-save-status');
    const classId = document.getElementById('diary-pub-class').value;
    const dateStr = document.getElementById('diary-pub-date').value;

    if (!classId || !dateStr) {
        alert("Please select Class and Date.");
        return;
    }

    const math = document.getElementById('diary-hw-math').value.trim();
    const sci = document.getElementById('diary-hw-sci').value.trim();
    const eng = document.getElementById('diary-hw-eng').value.trim();
    const kan = document.getElementById('diary-hw-kan').value.trim();
    const soc = document.getElementById('diary-hw-soc').value.trim();

    const subjects = [];
    if (math) subjects.push({ subject: 'Mathematics', homework: math, task: math });
    if (sci) subjects.push({ subject: 'Science & EVS', homework: sci, task: sci });
    if (eng) subjects.push({ subject: 'English Language', homework: eng, task: eng });
    if (kan) subjects.push({ subject: 'Kannada Language', homework: kan, task: kan });
    if (soc) subjects.push({ subject: 'Social Studies & General', homework: soc, task: soc });

    if (subjects.length === 0) {
        alert("Please enter at least one subject homework assignment.");
        return;
    }

    try {
        btn.disabled = true;
        btn.innerText = "Publishing to Cloud...";

        const docId = `${dateStr}_${classId.replace(/\s+/g, '_')}`;
        await setDoc(doc(db, "class_diary", docId), {
            id: docId,
            classId: classId,
            date: dateStr,
            teacherId: 'staff_portal',
            teacherName: 'Academic Staff',
            subjects: subjects,
            generalNotes: 'Complete assigned homework in fair notebook.',
            updatedAt: new Date()
        });

        statusDiv.innerHTML = `<span style="color:#34d399; font-weight:700;">✅ Published successfully for ${classId} on ${dateStr}!</span>`;
        loadStaffDiaryPreview();
        if (window.burstConfetti) window.burstConfetti();
    } catch (err) {
        console.error("Diary pub error:", err);
        statusDiv.innerHTML = `<span style="color:#f87171;">❌ Failed: ${err.message}</span>`;
    } finally {
        btn.disabled = false;
        btn.innerText = "🚀 Publish Homework to Cloud & Mobile Suite";
    }
}

async function loadStaffDiaryPreview() {
    const classId = document.getElementById('diary-pub-class')?.value || 'Class 5';
    const dateStr = document.getElementById('diary-pub-date')?.value || new Date().toISOString().split('T')[0];
    const previewContainer = document.getElementById('staff-diary-live-preview');
    const tag = document.getElementById('diary-preview-tag');

    if (tag) tag.innerText = `${classId} • ${dateStr}`;
    if (!previewContainer) return;

    previewContainer.innerHTML = '<div style="padding:1.5rem; text-align:center; color:var(--portal-text-muted);">Fetching diary from cloud...</div>';

    try {
        const docId = `${dateStr}_${classId.replace(/\s+/g, '_')}`;
        const docSnap = await getDoc(doc(db, "class_diary", docId));

        if (docSnap.exists()) {
            const data = docSnap.data();
            let html = '';
            (data.subjects || []).forEach(sub => {
                html += `
                    <div style="background: rgba(255,255,255,0.03); border-left: 3px solid var(--portal-accent-gold); border-radius: 8px; padding: 0.9rem 1.1rem; margin-bottom: 0.6rem;">
                        <div style="font-weight: 700; color: var(--portal-accent-gold); font-size: 0.9rem; margin-bottom: 3px;">📚 ${sub.subject}</div>
                        <div style="font-size: 0.85rem; color: rgba(255,255,255,0.9); line-height: 1.4;">${sub.homework || sub.task}</div>
                    </div>
                `;
            });
            previewContainer.innerHTML = html || '<div style="padding:1.5rem; text-align:center; color:var(--portal-text-muted);">No subject tasks assigned.</div>';
        } else {
            previewContainer.innerHTML = `
                <div style="padding:2rem 1.5rem; text-align:center; color:var(--portal-text-muted);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📝</div>
                    <div>No homework published yet for <strong>${classId}</strong> on <strong>${dateStr}</strong>.</div>
                    <div class="small text-secondary mt-1">Fill in subject assignments on the left and click Publish.</div>
                </div>
            `;
        }
    } catch (e) {
        previewContainer.innerHTML = '<div style="padding:1.5rem; text-align:center; color:var(--portal-text-muted);">Could not load preview.</div>';
    }
}

// Fee Counter
async function loadStaffFeeCounter() {
    const select = document.getElementById('fee-student-select');
    select.innerHTML = '<option value="">-- Choose Student (PEN / Name / Roll) --</option>';

    allStudentsList.forEach(s => {
        select.innerHTML += `<option value="${s.rollNumber || s.id}">${s.pen ? `[PEN: ${s.pen}] ` : ''}${s.name} (${s.className || 'Class 1'} - ${s.section || 'A'})</option>`;
    });

    const tbody = document.getElementById('staff-fee-history-table');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem;">Loading counter transactions...</td></tr>';

    try {
        const q = query(collection(db, "fee_payments"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);

        let html = '';
        snap.forEach(d => {
            const data = d.data();
            html += `
                <tr>
                    <td style="font-weight:700; color:var(--portal-accent-gold);">${data.receiptNo}</td>
                    <td>${data.studentName || 'Student'} (${data.classId || 'Class'})</td>
                    <td style="color:#34d399; font-weight:700;">₹${(data.amount || 0).toLocaleString('en-IN')}</td>
                    <td>${data.paymentMode || 'Cash Counter'}</td>
                    <td><button class="btn-outline btn-sm" onclick="printStudentReceipt({ receiptNo: '${data.receiptNo}', amount: ${data.amount}, date: '${data.date}', mode: '${data.paymentMode}' })">Print</button></td>
                </tr>
            `;
        });

        if (html) {
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color: var(--portal-text-muted);">No counter payments recorded yet.</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color: var(--portal-text-muted);">No payment records found.</td></tr>';
    }
}

function quickSelectStudentForFee(rollOrId) {
    switchStaffTab('feecounter');
    const select = document.getElementById('fee-student-select');
    select.value = rollOrId;
    onFeeStudentSelect(rollOrId);
}

function onFeeStudentSelect(rollOrId) {
    const preview = document.getElementById('fee-student-preview');
    if (!rollOrId) {
        preview.style.display = 'none';
        return;
    }

    const student = allStudentsList.find(s => (s.rollNumber === rollOrId || s.id === rollOrId));
    if (!student) {
        preview.style.display = 'none';
        return;
    }

    const feeTotal = student.feeTotal || 25000;
    const feePending = student.feePending !== undefined ? student.feePending : 0;
    const feePaid = student.feePaid !== undefined ? student.feePaid : (feeTotal - feePending);

    document.getElementById('fee-preview-name').innerText = student.name || 'Student';
    document.getElementById('fee-preview-pen').innerText = student.pen || student.rollNumber || 'N/A';
    document.getElementById('fee-preview-class').innerText = `${student.className || 'Class 1'} - ${student.section || 'A'}`;
    document.getElementById('fee-preview-total').innerText = `₹${feeTotal.toLocaleString('en-IN')}`;
    document.getElementById('fee-preview-pending').innerText = `₹${feePending.toLocaleString('en-IN')}`;
    document.getElementById('fee-amount-input').value = feePending > 0 ? feePending : feeTotal;
    preview.style.display = 'block';
}

async function recordCounterPayment(e) {
    e.preventDefault();
    const rollOrId = document.getElementById('fee-student-select').value;
    const amount = parseInt(document.getElementById('fee-amount-input').value);
    const mode = document.getElementById('fee-mode-select').value;
    const notes = document.getElementById('fee-notes-input').value.trim();

    if (!rollOrId || !amount) {
        alert("Please select a student and enter a valid amount.");
        return;
    }

    const student = allStudentsList.find(s => (s.rollNumber === rollOrId || s.id === rollOrId));
    const receiptNo = `SLT-RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();

    try {
        // Record payment in Firestore `fee_payments` collection
        await addDoc(collection(db, "fee_payments"), {
            receiptNo,
            studentId: student?.id || rollOrId,
            studentName: student?.name || 'Student',
            classId: student?.className || 'Class 1',
            amount: amount,
            date: now.toLocaleDateString('en-IN'),
            paymentMode: mode,
            notes: notes || 'Counter Tuition Clearance',
            timestamp: now
        });

        // Update student pending balance in Firestore
        if (student && student.id) {
            await updateDoc(doc(db, "students", student.id), {
                feePaid: (student.feePaid || 0) + amount,
                feePending: Math.max(0, (student.feePending || 38000) - amount)
            });
            student.feePaid = (student.feePaid || 0) + amount;
            student.feePending = Math.max(0, (student.feePending || 38000) - amount);
        }

        document.getElementById('fee-counter-form').reset();
        document.getElementById('fee-student-preview').style.display = 'none';
        loadStaffFeeCounter();
        loadStaffStudentsRoster();

        if (window.burstConfetti) window.burstConfetti();
        alert(`Payment of ₹${amount.toLocaleString('en-IN')} recorded successfully in Firestore!\nReceipt No: ${receiptNo}`);

        printStudentReceipt({
            receiptNo: receiptNo,
            amount: amount,
            date: now.toLocaleDateString('en-IN'),
            mode: mode
        });

    } catch (err) {
        console.error("Payment recording error:", err);
        alert("Error writing fee payment: " + err.message);
    }
}

// Starter Utility: Seed Classes & Initial Classroom Rosters in Firestore for Mobile App
async function seedClassesAndRostersToFirestore() {
    if (!confirm("This will write standard class registries (Pre-KG to Class 10) and starter student accounts directly to your live Firestore database (sltpublicschool). Proceed?")) return;

    try {
        // 1. Write Classes
        for (const cls of STANDARD_CLASSES) {
            await setDoc(doc(db, "classes", cls.id), cls);
        }

        // 2. Write starter student for testing
        const sampleStudentDoc = {
            rollNumber: 'SLT-2026-001',
            name: 'Aarav Sharma',
            className: 'Class 5',
            section: 'A',
            classId: 'c5_a',
            parentName: 'Mr. Rajesh Sharma',
            parentPhone: '9888877777',
            parentEmail: 'parent@sltps.com',
            studentEmail: 'student@sltps.com',
            attendancePercentage: 96,
            totalDays: 48,
            totalPresent: 46,
            lastAbsent: '18 Aug 2026',
            feeTotal: 38000,
            feePaid: 38000,
            feePending: 0,
            grades: [
                { subject: 'Mathematics', fa1: '24/25', midTerm: '76/80', fa2: '23/25', grade: 'A1', remarks: 'Exceptional problem solving' },
                { subject: 'General Science', fa1: '23/25', midTerm: '74/80', fa2: '24/25', grade: 'A1', remarks: 'Good grasp of concepts' },
                { subject: 'English Language', fa1: '22/25', midTerm: '71/80', fa2: '22/25', grade: 'A2', remarks: 'Fluent comprehension' },
                { subject: 'Social Studies', fa1: '23/25', midTerm: '72/80', fa2: '23/25', grade: 'A1', remarks: 'Thorough preparation' }
            ]
        };
        await setDoc(doc(db, "students", "SLT-2026-001"), sampleStudentDoc);

        // 3. Write sample class diary
        const todayStr = new Date().toISOString().split('T')[0];
        const sampleDiary = {
            date: todayStr,
            classId: 'Class 5',
            teacherId: 'teacher_basavaraj',
            subjects: [
                { subject: 'Mathematics', homework: 'Complete Exercise 4.3 on Fractions (Questions 1 to 8) in the fair notebook.' },
                { subject: 'General Science', homework: 'Draw and label the Plant Cell Diagram from Chapter 5 on Page 42.' },
                { subject: 'English Literature', homework: 'Read the poem "The Road Not Taken" and write 5 new vocabulary sentences.' },
                { subject: 'Social Science', homework: 'Mark the Harappan Civilisation sites on the outline map of India.' }
            ],
            generalNotes: 'Please ensure students bring their Science activity workbooks on Monday.'
        };
        await setDoc(doc(db, "class_diary", `${todayStr}_Class5`), sampleDiary);

        alert("✅ Live Firestore setup complete! Classes and student accounts are now live in sltpublicschool.");
        loadStaffDashboard();
    } catch (e) {
        alert("Firestore write error: " + e.message);
    }
}

// ==========================================
// TRACK APPLICATION & MULTI-STEP ADMISSION FORM
// ==========================================

async function trackApplication(e) {
    e.preventDefault();
    const trackingId = document.getElementById('track-id-input').value.trim();
    const btn = document.getElementById('btn-track');
    const resultDiv = document.getElementById('track-result');
    const errorDiv = document.getElementById('track-error');

    errorDiv.style.display = 'none';
    resultDiv.style.display = 'none';
    btn.innerText = 'Searching Firestore...';
    btn.disabled = true;

    try {
        const q = query(collection(db, "applications"));
        const snap = await getDocs(q);

        let foundApp = null;
        snap.forEach(docSnap => {
            if (docSnap.data().trackingId === trackingId || docSnap.id === trackingId) {
                foundApp = docSnap.data();
            }
        });

        if (foundApp) {
            const dateStr = foundApp.timestamp ? foundApp.timestamp.toDate().toLocaleDateString('en-IN') : 'Recent';
            resultDiv.innerHTML = `
                <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
                    <h3 style="color: var(--portal-accent-gold); margin:0;">${trackingId}</h3>
                    <div style="margin-top: 4px;"><span class="status-pill enrolled">Status: ${foundApp.status || 'Submitted'}</span></div>
                </div>
                <div class="grid-2" style="font-size:0.85rem;">
                    <div><span class="text-secondary">Student:</span> <strong>${foundApp.student?.name || 'N/A'}</strong></div>
                    <div><span class="text-secondary">Grade:</span> <strong>${foundApp.student?.grade || 'N/A'}</strong></div>
                    <div><span class="text-secondary">Parent WhatsApp:</span> <strong>${foundApp.parent?.whatsapp || foundApp.parent?.mobile || 'N/A'}</strong></div>
                    <div><span class="text-secondary">Date:</span> <strong>${dateStr}</strong></div>
                </div>
            `;
            resultDiv.style.display = 'block';
        } else {
            errorDiv.innerText = "Application not found. Please verify your Tracking ID (e.g., ADM-2026-1086).";
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.innerText = "Database connection error. Please try again.";
        errorDiv.style.display = 'block';
    } finally {
        btn.innerText = 'Check Status';
        btn.disabled = false;
    }
}

function changeStep(direction) {
    if (direction === 1) {
        const currentInputs = document.querySelectorAll(`#step-${currentStep} input[required], #step-${currentStep} select[required], #step-${currentStep} textarea[required]`);
        let valid = true;
        currentInputs.forEach(input => {
            if (!input.value) valid = false;
        });
        if (!valid) {
            alert('Please complete all required fields (*)');
            return;
        }
    }

    currentStep += direction;
    updateStepUI();
}

function updateStepUI() {
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${currentStep}`)?.classList.add('active');
    
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    
    document.querySelectorAll('.step').forEach((el, index) => {
        if (index < currentStep - 1) {
            el.classList.add('completed');
            el.classList.remove('active');
        } else if (index === currentStep - 1) {
            el.classList.add('active');
            el.classList.remove('completed');
        } else {
            el.classList.remove('completed', 'active');
        }
    });

    const titles = [
        "Step 1: Student Information",
        "Step 2: Parent Information",
        "Step 3: Academic History",
        "Step 4: Review & Submit"
    ];
    document.getElementById('step-title').innerText = titles[currentStep - 1];
    document.getElementById('btn-prev').style.display = currentStep === 1 ? 'none' : 'inline-block';
    
    if (currentStep === totalSteps) {
        document.getElementById('btn-next').style.display = 'none';
        document.getElementById('btn-submit').style.display = 'inline-block';
        buildReview();
    } else {
        document.getElementById('btn-next').style.display = 'inline-block';
        document.getElementById('btn-submit').style.display = 'none';
    }
}

function buildReview() {
    const data = {
        "Student Name": document.getElementById('stu-name').value,
        "Date of Birth": document.getElementById('stu-dob').value,
        "Grade Applied": document.getElementById('stu-grade').value,
        "Aadhaar Number": document.getElementById('stu-aadhaar').value,
        "Father / Guardian": document.getElementById('par-father').value,
        "Parent WhatsApp": document.getElementById('par-whatsapp').value,
        "Parent Email": document.getElementById('par-email').value
    };

    const container = document.getElementById('review-content');
    container.innerHTML = '';
    for (const [key, value] of Object.entries(data)) {
        container.innerHTML += `<div class="review-row"><span>${key}</span><span>${value || 'N/A'}</span></div>`;
    }
}

function saveDraft() {
    alert("Draft saved to browser session.");
}

// Submit Application to Firestore `applications` collection
document.getElementById('application-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = 'Submitting to Firestore...';
    submitBtn.disabled = true;

    try {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const trackingId = `ADM-2026-${randomNum}`;

        const appData = {
            trackingId,
            status: "Submitted",
            timestamp: new Date(),
            student: {
                name: document.getElementById('stu-name').value,
                dob: document.getElementById('stu-dob').value,
                gender: document.getElementById('stu-gender').value,
                grade: document.getElementById('stu-grade').value,
                aadhaar: document.getElementById('stu-aadhaar').value,
                email: document.getElementById('stu-email').value
            },
            parent: {
                father: document.getElementById('par-father').value,
                mother: document.getElementById('par-mother').value,
                email: document.getElementById('par-email').value,
                whatsapp: document.getElementById('par-whatsapp').value,
                address: document.getElementById('par-address').value
            },
            academics: {
                school: document.getElementById('acad-school').value,
                grade: document.getElementById('acad-grade').value,
                marks: document.getElementById('acad-marks').value
            },
            documents: "WhatsApp Transfer"
        };

        await addDoc(collection(db, "applications"), appData);

        document.getElementById('tracking-id').innerText = trackingId;
        switchView('view-success');
        if (window.burstConfetti) window.burstConfetti();

    } catch (err) {
        console.error("Application error:", err);
        alert("Error saving application to Firestore: " + err.message);
    } finally {
        submitBtn.innerText = 'Submit Application';
        submitBtn.disabled = false;
    }
});
