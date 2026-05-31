/**
 * portal.js - Logic for the Unified Admissions & Student Portal
 * Firebase V2 Integration
 */

import { auth, db, storage } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

let currentRole = ''; // 'admission', 'parent', 'student', 'staff'
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
        document.getElementById('email-auth-title').innerText = currentRole === 'staff' ? "Staff Login" : (currentRole === 'parent' ? "Parent Login" : "Student Login");
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

            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <td style="padding: 1rem; color: #fbbf24;">${data.trackingId || 'N/A'}</td>
                    <td style="padding: 1rem;">${data.student?.name || 'N/A'}</td>
                    <td style="padding: 1rem;">${data.student?.grade || 'N/A'}</td>
                    <td style="padding: 1rem;">${dateStr}</td>
                    <td style="padding: 1rem; font-size: 0.85rem;">WhatsApp Transfer</td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error("Error loading staff dashboard:", error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #ef4444;">Error loading applications. Make sure Firestore rules allow reading.</td></tr>`;
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

    } catch (error) {
        console.error("Error submitting application: ", error);
        alert(`Error: ${error.message}`);
    } finally {
        submitBtn.innerText = 'Pay & Submit';
        submitBtn.disabled = false;
    }
});
