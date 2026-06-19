/**
 * portal.js - Logic for the Unified Admissions & Student Portal
 * Firebase V2 Integration
 */

import { auth, db, storage } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
import { deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

let currentRole = ''; // 'admission', 'parent', 'student', 'staff', 'principal'
let currentStep = 1;
const totalSteps = 4;
let isSignUpMode = false;

// Export functions to global scope for HTML onclick handlers
window.switchView = switchView;
window.selectRole = selectRole;
window.logout = logout;
window.changeStep = changeStep;
window.saveDraft = saveDraft;
window.updateFileName = updateFileName;
window.toggleAuthMode = toggleAuthMode;
window.toggleMenu = toggleMenu;
window.trackApplication = trackApplication;
window.viewApplicationDetails = viewApplicationDetails;
window.closeAppModal = closeAppModal;
window.updateApplicationStatus = updateApplicationStatus;
window.publishMessage = publishMessage;
window.deleteMessage = deleteMessage;

let applicationsCache = {};
let currentViewedTrackingId = null;

function toggleMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    }
}

// Navigation Helper
function switchView(viewId) {
    document.querySelectorAll('.portal-view').forEach(v => {
        v.classList.remove('active');
    });
    
    const view = document.getElementById(viewId);
    if(view) {
        view.classList.add('active');
        const fadeEls = view.querySelectorAll('.fade-up');
        fadeEls.forEach(el => {
            el.classList.add('visible');
        });
    }
}

window.onload = () => {
    switchView('view-gateway');
};

// 1. Role Selection
function selectRole(role) {
    currentRole = role;
    isSignUpMode = false; // Reset to login mode
    updateAuthUI();
    
    if (role === 'admission') {
        document.getElementById('auth-title').innerText = "Start Application";
        switchView('view-auth-mobile');
    } else if (role === 'staff') {
        document.getElementById('email-auth-title').innerText = "Staff Login";
        document.getElementById('email-auth-desc').innerText = "Enter your staff email and password.";
        switchView('view-auth-email');
    } else if (role === 'principal') {
        document.getElementById('email-auth-title').innerText = "Principal Login";
        document.getElementById('email-auth-desc').innerText = "Enter your principal credentials.";
        switchView('view-auth-email');
    } else if (role === 'parent' || role === 'student') {
        document.getElementById('email-auth-title').innerText = role === 'parent' ? "Parent Login" : "Student Login";
        document.getElementById('email-auth-desc').innerText = "Enter your registered email and password.";
        switchView('view-auth-email');
    }
}

function toggleAuthMode(e) {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    updateAuthUI();
}

function updateAuthUI() {
    const btn = document.getElementById('auth-submit-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    const toggleLink = document.querySelector('a[onclick="toggleAuthMode(event)"]');
    
    if (isSignUpMode) {
        document.getElementById('email-auth-title').innerText = "Create Account";
        btn.innerText = "Sign Up";
        if(toggleText) toggleText.innerText = "Already have an account?";
        if(toggleLink) toggleLink.innerText = "Login";
    } else {
        const titleMap = { 'staff': 'Staff Login', 'principal': 'Principal Login', 'parent': 'Parent Login', 'student': 'Student Login' };
        document.getElementById('email-auth-title').innerText = titleMap[currentRole] || "Login";
        btn.innerText = "Login to Portal";
        if(toggleText) toggleText.innerText = "Don't have an account?";
        if(toggleLink) toggleLink.innerText = "Sign Up";
    }
}

// 2. Auth Flow (Admissions Mobile - OTP Removed)
document.getElementById('auth-mobile-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    startApplication();
});

// 3. Auth Flow (Email/Password for Parents, Students & Staff)
document.getElementById('auth-email-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-pass').value;
    const errorDiv = document.getElementById('auth-error');
    const submitBtn = document.getElementById('auth-submit-btn');
    
    try {
        errorDiv.style.display = 'none';
        submitBtn.innerText = isSignUpMode ? 'Creating Account...' : 'Logging in...';
        submitBtn.disabled = true;

        // Default Admin Bypass
        if (email === 'admin@sltps' && password === 'admin123@sltps' && currentRole === 'staff') {
            switchView('view-staff-dash');
            loadStaffDashboard();
            return;
        }

        // Principal Bypass
        if ((email === 'leenaj' || email === 'leenaj@sltps.com' || email === 'leenaj@sltps') && password === 'leenaprincipal@sltps' && currentRole === 'principal') {
            switchView('view-principal-dash');
            loadPrincipalMessages();
            return;
        }

        // Firebase Auth: Create or Sign In
        if (isSignUpMode) {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Account created successfully! You are now logged in.");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
        
        // Route based on role
        if (currentRole === 'parent') {
            switchView('view-parent-dash');
        } else if (currentRole === 'staff') {
            switchView('view-staff-dash');
            loadStaffDashboard();
        } else if (currentRole === 'principal') {
            switchView('view-principal-dash');
            loadPrincipalMessages();
        } else {
            switchView('view-student-dash');
        }
        
    } catch (error) {
        console.error("Auth Error:", error);
        errorDiv.innerText = "Error: " + error.message;
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.innerText = isSignUpMode ? 'Sign Up' : 'Login to Portal';
        submitBtn.disabled = false;
    }
});

// 4. Logout / Gateway Return
// 4. Logout / Gateway Return
function logout() {
    auth.signOut().catch(console.error);
    switchView('view-gateway');
    document.getElementById('auth-mobile-form')?.reset();
    document.getElementById('auth-email-form')?.reset();
    document.getElementById('application-form')?.reset();
    currentRole = '';
    currentStep = 1;
}

// 5. Load Staff Dashboard
async function loadStaffDashboard() {
    const tableBody = document.getElementById('staff-applications-table');
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Loading applications...</td></tr>';
    
    try {
        const q = query(collection(db, "applications"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #a1a1aa;">No applications found.</td></tr>';
            return;
        }

        let html = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const dateStr = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : 'N/A';
            const tid = data.trackingId || 'N/A';
            
            // Store in cache for modal
            if (tid !== 'N/A') {
                applicationsCache[tid] = { ...data, docId: doc.id };
            }

            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: background 0.3s;" onclick="viewApplicationDetails('${tid}')" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 1rem; color: #fbbf24; font-weight: 600;">${tid}</td>
                    <td style="padding: 1rem;">${data.student?.name || 'N/A'}</td>
                    <td style="padding: 1rem;">${data.student?.grade || 'N/A'}</td>
                    <td style="padding: 1rem;">${dateStr}</td>
                    <td style="padding: 1rem; font-size: 0.85rem; color: #4ade80;">${data.status || 'Submitted'}</td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error("Error loading staff dashboard:", error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #ef4444;">Error loading applications. Make sure Firestore rules allow reading.</td></tr>`;
    }
}

// 5b. View Application Modal
function viewApplicationDetails(trackingId) {
    const data = applicationsCache[trackingId];
    if (!data) return;

    currentViewedTrackingId = trackingId;
    document.getElementById('modal-tracking-id').innerText = trackingId;
    
    // Set the select dropdown to the current status
    const select = document.getElementById('modal-status-select');
    if(select) {
        select.value = data.status || 'Submitted';
    }
    document.getElementById('status-save-msg').style.display = 'none';

    let html = '';
    
    // Helper to add sections
    const addSection = (title, obj) => {
        if (!obj) return;
        html += `<div style="grid-column: 1 / -1; border-bottom: 1px solid rgba(255,255,255,0.1); margin-top: 1rem; margin-bottom: 0.5rem; padding-bottom: 0.5rem;">
            <h4 style="color: #fff;">${title}</h4>
        </div>`;
        for (const [key, value] of Object.entries(obj)) {
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
            html += `<div style="margin-bottom: 0.5rem;">
                <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">${formattedKey}</div>
                <div style="font-weight: 600;">${value || 'N/A'}</div>
            </div>`;
        }
    };

    addSection('Student Details', data.student);
    addSection('Parent/Guardian Details', data.parent);
    addSection('Academic History', data.academics);

    html += `<div style="grid-column: 1 / -1; margin-top: 1rem;">
        <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Documents</div>
        <div style="font-weight: 600;">${data.documents || 'N/A'}</div>
    </div>`;

    document.getElementById('modal-details-grid').innerHTML = html;
    document.getElementById('app-details-modal').style.display = 'flex';
}

function closeAppModal() {
    document.getElementById('app-details-modal').style.display = 'none';
    currentViewedTrackingId = null;
}

// 5c. Update Application Status
async function updateApplicationStatus() {
    if (!currentViewedTrackingId) return;
    const data = applicationsCache[currentViewedTrackingId];
    if (!data || !data.docId) return;

    const newStatus = document.getElementById('modal-status-select').value;
    const saveMsg = document.getElementById('status-save-msg');
    
    try {
        const appRef = doc(db, "applications", data.docId);
        await updateDoc(appRef, {
            status: newStatus
        });
        
        // Update local cache
        applicationsCache[currentViewedTrackingId].status = newStatus;
        
        // Show success message
        saveMsg.innerText = "Saved successfully!";
        saveMsg.style.display = "inline-block";
        saveMsg.style.color = "#4ade80";
        
        // Hide after 2 seconds
        setTimeout(() => { saveMsg.style.display = 'none'; }, 2000);
        
        // Refresh table to show new status
        loadStaffDashboard();
        
    } catch (error) {
        console.error("Error updating status: ", error);
        saveMsg.innerText = "Error saving!";
        saveMsg.style.color = "#ef4444";
        saveMsg.style.display = "inline-block";
    }
}

// 6. Track Application
async function trackApplication(e) {
    e.preventDefault();
    const trackingId = document.getElementById('track-id-input').value.trim();
    const btn = document.getElementById('btn-track');
    const resultDiv = document.getElementById('track-result');
    const errorDiv = document.getElementById('track-error');

    errorDiv.style.display = 'none';
    resultDiv.style.display = 'none';
    btn.innerText = 'Searching...';
    btn.disabled = true;

    try {
        // Query Firestore for this Tracking ID
        const q = query(collection(db, "applications"));
        // Wait! We didn't import `where` from firestore. Let's do it manually or fetch all and filter for now since it's a small dataset, but wait we can just import 'where'.
        // To be safe without modifying imports, we fetch getDocs and find it.
        const querySnapshot = await getDocs(q);
        
        let foundApp = null;
        querySnapshot.forEach((doc) => {
            if (doc.data().trackingId === trackingId) {
                foundApp = doc.data();
            }
        });

        if (foundApp) {
            const dateStr = foundApp.timestamp ? foundApp.timestamp.toDate().toLocaleDateString() : 'N/A';
            resultDiv.innerHTML = `
                <div style="margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem;">
                    <h3 style="color: var(--primary-accent); margin-bottom: 0.5rem;">${trackingId}</h3>
                    <div style="display: inline-block; padding: 0.2rem 1rem; border-radius: 20px; background: rgba(251, 191, 36, 0.2); color: #fbbf24; border: 1px solid #fbbf24; font-size: 0.85rem;">Status: ${foundApp.status || 'Submitted'}</div>
                </div>
                <div class="grid-2">
                    <div>
                        <span class="text-secondary small">Student Name</span>
                        <div style="font-weight: 600;">${foundApp.student?.name || 'N/A'}</div>
                    </div>
                    <div>
                        <span class="text-secondary small">Grade Applied</span>
                        <div style="font-weight: 600;">${foundApp.student?.grade || 'N/A'}</div>
                    </div>
                    <div>
                        <span class="text-secondary small">Submission Date</span>
                        <div style="font-weight: 600;">${dateStr}</div>
                    </div>
                </div>
            `;
            resultDiv.style.display = 'block';
        } else {
            errorDiv.innerText = "Application not found. Please check your Tracking ID.";
            errorDiv.style.display = 'block';
        }

    } catch (error) {
        console.error("Tracking error:", error);
        errorDiv.innerText = "Error connecting to database.";
        errorDiv.style.display = 'block';
    } finally {
        btn.innerText = 'Check Status';
        btn.disabled = false;
    }
}

// ==========================================
// ADMISSION FORM LOGIC & FIRESTORE
// ==========================================

function startApplication() {
    switchView('view-application');
    updateStepUI();
}

function changeStep(direction) {
    if (direction === 1) {
        const currentInputs = document.querySelectorAll(`#step-${currentStep} input[required], #step-${currentStep} select[required], #step-${currentStep} textarea[required]`);
        let valid = true;
        currentInputs.forEach(input => {
            if (!input.value) valid = false;
        });
        if (!valid) {
            alert('Please fill all required fields before proceeding.');
            return;
        }
    }

    currentStep += direction;
    updateStepUI();
}

function updateStepUI() {
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${currentStep}`).classList.add('active');
    
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

function updateFileName(input, labelId) {
    const label = document.getElementById(labelId);
    if (input.files && input.files[0]) {
        if (input.files[0].size > 2 * 1024 * 1024) {
            alert("File is too large. Max size is 2MB.");
            input.value = "";
            return;
        }
        label.innerText = input.files[0].name;
        label.style.color = "var(--primary-accent)";
    }
}

function buildReview() {
    const data = {
        "Student Name": document.getElementById('stu-name').value,
        "Grade Applied": document.getElementById('stu-grade').value,
        "Parent WhatsApp": document.getElementById('par-whatsapp').value,
        "Aadhaar No": document.getElementById('stu-aadhaar').value
    };

    const container = document.getElementById('review-content');
    container.innerHTML = '';
    for (const [key, value] of Object.entries(data)) {
        container.innerHTML += `<div class="review-row"><span>${key}</span><span>${value || 'N/A'}</span></div>`;
    }
}

function saveDraft() {
    alert("Draft saving to Firebase pending implementation.");
}

// Final Submit
document.getElementById('application-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerText = 'Processing...';
    submitBtn.disabled = true;

    try {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const trackingId = `ADM-2026-${randomNum}`;
        
        const firebaseTask = (async () => {
            // Prepare Firestore Data
            const applicationData = {
                trackingId: trackingId,
                status: "Submitted",
                timestamp: new Date(),
                student: {
                    name: document.getElementById('stu-name').value,
                    dob: document.getElementById('stu-dob').value,
                    gender: document.getElementById('stu-gender').value,
                    grade: document.getElementById('stu-grade').value,
                    aadhaar: document.getElementById('stu-aadhaar').value,
                    whatsapp: document.getElementById('stu-whatsapp').value
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

            // Save to Firestore
            await addDoc(collection(db, "applications"), applicationData);
        })();

        const timeoutTask = new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase request timed out. Please check your internet connection or Firebase security rules.")), 15000));
        
        // Race the task against a 15-second timeout
        await Promise.race([firebaseTask, timeoutTask]);

        // 4. Show Success View
        document.getElementById('tracking-id').innerText = trackingId;
        switchView('view-success');
        if (window.burstConfetti) window.burstConfetti();

    } catch (error) {
        console.error("Error submitting application: ", error);
        alert(`Error: ${error.message}`);
    } finally {
        submitBtn.innerText = 'Pay & Submit';
        submitBtn.disabled = false;
    }
});

// ==========================================
// PRINCIPAL MESSAGES LOGIC
// ==========================================

async function publishMessage(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-publish');
    const resultDiv = document.getElementById('publish-result');
    
    btn.innerText = "Publishing...";
    btn.disabled = true;
    resultDiv.style.color = "var(--text-secondary)";
    resultDiv.innerText = "Saving to database...";

    try {
        const title = document.getElementById('msg-title').value;
        const type = document.getElementById('msg-type').value;
        const content = document.getElementById('msg-content').value;
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
        resultDiv.innerText = "Message published successfully!";
        
        // Reset form
        document.getElementById('compose-message-form').reset();
        
        // Reload list
        loadPrincipalMessages();
        
        setTimeout(() => { resultDiv.innerText = ""; }, 3000);
        
    } catch (error) {
        console.error("Error publishing message:", error);
        resultDiv.style.color = "#ef4444";
        resultDiv.innerText = "Failed to publish message.";
    } finally {
        btn.innerText = "Publish Message";
        btn.disabled = false;
    }
}

async function loadPrincipalMessages() {
    const tableBody = document.getElementById('principal-messages-table');
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Loading messages...</td></tr>';
    
    try {
        const q = query(collection(db, "principal_messages"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color: #a1a1aa;">No messages found.</td></tr>';
            return;
        }

        let html = '';
        const now = new Date();
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const expiresAt = data.expiresAt ? data.expiresAt.toDate() : null;
            const isExpired = expiresAt && expiresAt < now;
            
            const expiresStr = expiresAt ? expiresAt.toLocaleDateString() : 'Never';
            const statusColor = isExpired ? '#ef4444' : '#4ade80';
            
            // Badge color mapping
            let typeColor = 'var(--secondary-accent)';
            let typeBg = 'rgba(251, 224, 93, 0.2)';
            
            if (data.type === 'Rule') {
                typeColor = '#ef4444'; typeBg = 'rgba(239,68,68,0.2)';
            } else if (data.type === 'Event') {
                typeColor = '#10b981'; typeBg = 'rgba(16,185,129,0.2)';
            } else if (data.type === 'Announcement') {
                typeColor = '#3b82f6'; typeBg = 'rgba(59,130,246,0.2)';
            } else if (data.type === 'Article') {
                typeColor = '#8b5cf6'; typeBg = 'rgba(139,92,246,0.2)';
            }

            const urgentBadge = data.isUrgent ? `<span style="background: rgba(239,68,68,0.2); color: #ef4444; padding: 0.2rem 0.5rem; border-radius: 5px; font-size: 0.7rem; margin-left: 10px; border: 1px solid #ef4444;">URGENT</span>` : '';
            
            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); opacity: ${isExpired ? 0.6 : 1}; transition: background 0.2s;">
                    <td style="padding: 1rem;">
                        <strong>${data.title}</strong>
                        ${urgentBadge}
                    </td>
                    <td style="padding: 1rem;">
                        <span style="background: ${typeBg}; color: ${typeColor}; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; border: 1px solid ${typeColor};">${data.type || 'Announcement'}</span>
                    </td>
                    <td style="padding: 1rem; color: ${statusColor};">${expiresStr} ${isExpired ? '(Expired)' : ''}</td>
                    <td style="padding: 1rem;">
                        <button onclick="deleteMessage('${doc.id}')" class="btn-outline" style="border-color: #ef4444; color: #ef4444; padding: 0.3rem 0.8rem;">Delete</button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error("Error loading messages:", error);
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem; color: #ef4444;">Error loading messages. Make sure Firestore rules allow reading.</td></tr>`;
    }
}

async function deleteMessage(docId) {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    try {
        await deleteDoc(doc(db, "principal_messages", docId));
        loadPrincipalMessages();
    } catch (error) {
        console.error("Error deleting message:", error);
        alert("Failed to delete message.");
    }
}
