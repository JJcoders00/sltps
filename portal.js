/**
 * portal.js - Logic for the School Admission Portal (SAP)
 */

// Global State
let currentOTP = '';
let currentStep = 1;
const totalSteps = 5;

// Navigation Helper
function switchView(viewId) {
    document.querySelectorAll('.portal-view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// 1. Auth Flow
document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const mobile = document.getElementById('mobile-input').value;
    
    // Simulate OTP generation
    currentOTP = Math.floor(1000 + Math.random() * 9000).toString();
    alert(`[SAMPLE V1] Your OTP is: ${currentOTP}`);
    
    switchView('view-otp');
});

document.getElementById('otp-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('otp-input').value;
    
    if (input === currentOTP) {
        switchView('view-dashboard');
    } else {
        alert('Invalid OTP. Please try again.');
    }
});

function logout() {
    switchView('view-auth');
    document.getElementById('auth-form').reset();
    document.getElementById('otp-form').reset();
}

// 2. Application Form Flow
function startApplication() {
    switchView('view-application');
    updateStepUI();
}

function changeStep(direction) {
    // Basic validation before moving next
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
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    
    // Show current step
    document.getElementById(`step-${currentStep}`).classList.add('active');
    
    // Update Progress Bar
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    
    // Update Step Indicators
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

    // Update Step Title
    const titles = [
        "Step 1: Student Information",
        "Step 2: Parent Information",
        "Step 3: Academic History",
        "Step 4: Documents Upload",
        "Step 5: Review & Submit"
    ];
    document.getElementById('step-title').innerText = titles[currentStep - 1];

    // Buttons
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

// 3. Document Upload Helper
function updateFileName(input, labelId) {
    const label = document.getElementById(labelId);
    if (input.files && input.files[0]) {
        // Simulate validation
        if (input.files[0].size > 2 * 1024 * 1024) {
            alert("File is too large. Max size is 2MB.");
            input.value = "";
            return;
        }
        label.innerText = input.files[0].name;
        label.style.color = "#fbe05d";
    }
}

// 4. Review Step Generation
function buildReview() {
    const data = {
        "Student Name": document.getElementById('stu-name').value,
        "Grade Applied": document.getElementById('stu-grade').value,
        "Parent Mobile": document.getElementById('par-mobile').value,
        "Aadhaar No": document.getElementById('stu-aadhaar').value
    };

    const container = document.getElementById('review-content');
    container.innerHTML = '';
    
    for (const [key, value] of Object.entries(data)) {
        container.innerHTML += `<div class="review-row"><span>${key}</span><span>${value || 'N/A'}</span></div>`;
    }
}

// 5. Submit and Draft
function saveDraft() {
    alert("Application draft saved successfully!");
}

document.getElementById('application-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Generate dummy ADM ID
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('tracking-id').innerText = `ADM-2026-${randomNum}`;
    
    switchView('view-success');
});
