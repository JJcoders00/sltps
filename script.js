document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Navbar Scrolled State
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Intersection Observer for Cinematic Fade-Ups
    const fadeElements = document.querySelectorAll('.fade-up');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Unobserve if you only want it to happen once
                // observer.unobserve(entry.target); 
            } else {
                // Remove this else block if you don't want them to fade out when scrolling past
                // Keeping it creates a highly dynamic feel like SpaceX
                entry.target.classList.remove('visible');
            }
        });
    }, {
        root: null,
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    fadeElements.forEach(el => {
        revealObserver.observe(el);
    });

    // 3. Intersection Observer for Background Zoom Effect
    const scenes = document.querySelectorAll('.scene');
    
    const sceneObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                entry.target.classList.remove('active');
            }
        });
    }, {
        threshold: 0.5
    });

    scenes.forEach(scene => {
        sceneObserver.observe(scene);
    });
});
