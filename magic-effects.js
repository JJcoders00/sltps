/**
 * magic-effects.js (Ultimate Edition: Mobile + Desktop)
 * Adds tactile animations, touch ripple effects, haptic feedback, 
 * synthesized musical sounds, cursor trails, and a magical entry!
 */

// --- 1. Audio Synthesis (Musical Piano/Chimes) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let audioUnlocked = false;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Unlock audio on first interaction (browsers require this)
document.addEventListener('click', () => {
    if (!audioUnlocked) {
        initAudio();
        audioUnlocked = true;
    }
}, { once: true });
document.addEventListener('touchstart', () => {
    if (!audioUnlocked) {
        initAudio();
        audioUnlocked = true;
    }
}, { once: true });

// Pentatonic scale frequencies (C Major Pentatonic) for a harmonious melody
const pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
let noteIndex = 0;
let lastPlayTime = 0;

function playPianoNote() {
    if (!audioUnlocked) return;
    
    const now = Date.now();
    // Throttle: prevent sounds from overlapping too messily (max 1 sound per 100ms)
    if (now - lastPlayTime < 100) return; 
    lastPlayTime = now;

    try {
        initAudio();
        const freq = pentatonicScale[noteIndex];
        noteIndex = (noteIndex + 1) % pentatonicScale.length;

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        // Sine wave with a sharp decay sounds like an electric piano or chime
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        // Envelope: quick attack, slow exponential decay
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
    } catch(e) {}
}

function playTada() {
    if (!audioUnlocked) return;
    try {
        initAudio();
        // A celebratory C Major chord
        [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5 + (i * 0.1));
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 2);
        });
    } catch(e) {}
}

// --- 2. Haptic Feedback (Throttled for mobile) ---
let lastHapticTime = 0;
function hapticTap() {
    const now = Date.now();
    // Prevent phones from vibrating aggressively multiple times in a row
    if (now - lastHapticTime < 200) return;
    lastHapticTime = now;
    
    if (navigator.vibrate) navigator.vibrate(10); // Very light, crisp tap
}

function hapticSuccess() {
    if (navigator.vibrate) navigator.vibrate([30, 50, 30, 50, 100]);
}

// --- 3. Touch Ripple Effect (Mobile) ---
function createRipple(event) {
    const button = event.currentTarget;
    let ripple = button.querySelector('.ripple');
    if (!ripple) {
        ripple = document.createElement('span');
        ripple.classList.add('ripple');
        button.appendChild(ripple);
    }
    ripple.classList.remove('animate');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    const rect = button.getBoundingClientRect();
    
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${clientX - rect.left - radius}px`;
    ripple.style.top = `${clientY - rect.top - radius}px`;
    ripple.classList.add('animate');
    
    hapticTap();
}

// --- 4. Confetti Burst ---
function burstConfetti() {
    hapticSuccess();
    playTada();
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const emojis = ['🌟', '✨', '🎓', '🎉', '🎈', '🏆'];
    
    for (let i = 0; i < 40; i++) {
        const char = emojis[Math.floor(Math.random() * emojis.length)];
        const particle = document.createElement('div');
        particle.innerText = char;
        particle.style.position = 'fixed';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.fontSize = (Math.random() * 20 + 20) + 'px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        particle.style.transition = 'all 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
        particle.style.opacity = '1';
        document.body.appendChild(particle);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 80 + Math.random() * 200;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 150; 
        const rot = Math.random() * 360;
        
        requestAnimationFrame(() => {
            particle.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(0.5)`;
            particle.style.opacity = '0';
        });
        setTimeout(() => particle.remove(), 1500);
    }
}

// --- 5. Magic Cursor Trail (Desktop) ---
let lastTrailTime = 0;
if (window.matchMedia("(pointer: fine)").matches) {
    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - lastTrailTime > 40) {
            lastTrailTime = now;
            if (Math.random() > 0.5) {
                const star = document.createElement('div');
                star.innerText = '✨';
                star.style.position = 'fixed';
                star.style.left = (e.clientX - 10) + 'px';
                star.style.top = (e.clientY - 10) + 'px';
                star.style.fontSize = '14px';
                star.style.pointerEvents = 'none';
                star.style.zIndex = '9998';
                star.style.transition = 'all 0.8s ease-out';
                star.style.opacity = '0.8';
                document.body.appendChild(star);
                
                requestAnimationFrame(() => {
                    star.style.transform = `translate(${Math.random()*40-20}px, ${Math.random()*40-20}px) scale(0.1)`;
                    star.style.opacity = '0';
                });
                setTimeout(() => star.remove(), 800);
            }
        }
    });
}

// --- 6. Magical Entry Animation ---
function triggerMagicalEntry() {
    const width = window.innerWidth;
    for(let i=0; i<25; i++) {
        setTimeout(() => {
            const star = document.createElement('div');
            star.innerText = '✨';
            star.style.position = 'fixed';
            star.style.left = Math.random() * width + 'px';
            star.style.top = '-50px';
            star.style.fontSize = (Math.random() * 15 + 10) + 'px';
            star.style.pointerEvents = 'none';
            star.style.zIndex = '9999';
            star.style.transition = 'all 3s linear';
            star.style.opacity = '0.8';
            document.body.appendChild(star);
            
            requestAnimationFrame(() => {
                star.style.transform = `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 360}deg)`;
                star.style.opacity = '0';
            });
            setTimeout(() => star.remove(), 3000);
        }, i * 50); 
    }
}

// --- 7. Attach Effects to Interactions ---
document.addEventListener('DOMContentLoaded', () => {
    triggerMagicalEntry();

    const attachEffects = () => {
        const interactables = document.querySelectorAll('.role-card, .btn-solid, .btn-highlight, .btn-outline, .nav-links a, .facility-item, .gallery-item');
        
        interactables.forEach(el => {
            if (!el.dataset.hasEffects) {
                el.dataset.hasEffects = 'true';
                
                // Desktop Hover Sound (Musical Piano)
                el.addEventListener('mouseenter', playPianoNote);
                
                // Mobile/Desktop Ripple & Haptic
                if (window.getComputedStyle(el).position === 'static') {
                    el.style.position = 'relative';
                }
                el.style.overflow = 'hidden';
                el.addEventListener('touchstart', createRipple, { passive: true });
                el.addEventListener('mousedown', createRipple);
            }
        });
    };
    
    attachEffects();
    
    const observer = new MutationObserver((mutations) => {
        let shouldAttach = false;
        mutations.forEach(m => { if (m.addedNodes.length > 0) shouldAttach = true; });
        if (shouldAttach) attachEffects();
    });
    observer.observe(document.body, { childList: true, subtree: true });
});

window.burstConfetti = burstConfetti;
window.hapticTap = hapticTap;
