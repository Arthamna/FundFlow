// FundFlow Landing Page - Creative & Playful Interactions
let currentSlide = 0;
const campaignsPerView = 4;

document.addEventListener('DOMContentLoaded', function() {
    // Add decorative shapes to hero
    addDecorativeShapes();
    
    // Initialize carousel indicators
    initCarouselIndicators();
    
    // Campaign navigation buttons with fun animations
    setupCampaignNavigation();
    
    // Smooth scroll for navigation links
    setupSmoothScroll();
    
    // Enhanced navbar scroll effect
    handleNavbarScroll();
    window.addEventListener('scroll', handleNavbarScroll);
    
    // Animate elements on scroll with playful effects
    observeElements();
    
    // Auto-rotate testimonials
    autoRotateTestimonials();
    
    // Add interactive card effects
    setupCardInteractions();
    
    // Animated counters for stats
    setupStatsAnimation();
    
    // Progress bar animations
    animateProgressBars();
    
    // Newsletter handler
    setupNewsletter();
    
    // Mobile menu handler
    setupMobileMenu();
    
    // Add playful cursor effects on buttons
    addButtonEffects();
    
    // Parallax effect on hero
    setupParallax();
});

// Add decorative floating shapes to hero section
function addDecorativeShapes() {
    const hero = document.querySelector('.hero-section');
    if (hero) {
        for (let i = 1; i <= 3; i++) {
            const shape = document.createElement('div');
            shape.classList.add('shape', `shape-${i}`);
            hero.appendChild(shape);
        }
    }
}

// Enhanced campaign navigation
function setupCampaignNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            scrollCampaigns('prev');
            addClickAnimation(prevBtn);
        });
        
        nextBtn.addEventListener('click', () => {
            scrollCampaigns('next');
            addClickAnimation(nextBtn);
        });
    }
}

function scrollCampaigns(direction) {
    const container = document.getElementById('campaignsContainer');
    const scrollAmount = container.offsetWidth / campaignsPerView;
    
    if (direction === 'next') {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
}

function addClickAnimation(element) {
    element.style.transform = 'scale(0.9) rotate(180deg)';
    setTimeout(() => {
        element.style.transform = '';
    }, 300);
}

// Smooth scroll with offset
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const targetPosition = target.offsetTop - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Enhanced navbar scroll effect
function handleNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

// Initialize carousel indicators with enhanced interactions
function initCarouselIndicators() {
    const indicators = document.querySelectorAll('.carousel-indicators button');
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            indicators.forEach(ind => ind.classList.remove('active'));
            indicator.classList.add('active');
            currentSlide = index;
        });
    });
}

// Auto-rotate testimonials with smooth transitions
function autoRotateTestimonials() {
    const indicators = document.querySelectorAll('.carousel-indicators button');
    
    setInterval(() => {
        if (indicators.length > 0) {
            currentSlide = (currentSlide + 1) % indicators.length;
            indicators.forEach((ind, idx) => {
                if (idx === currentSlide) {
                    ind.classList.add('active');
                } else {
                    ind.classList.remove('active');
                }
            });
        }
    }, 5000);
}

// Enhanced scroll animations
function observeElements() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) rotate(0deg)';
                }, index * 100);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.card, .campaign-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px) rotate(-5deg)';
        el.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        observer.observe(el);
    });
}

// Interactive card effects
function setupCardInteractions() {
    const campaignCards = document.querySelectorAll('.campaign-card');
    
    campaignCards.forEach((card, index) => {
        card.addEventListener('mouseenter', function() {
            this.style.zIndex = '10';
            // Add random playful rotation
            const rotation = (index % 2 === 0) ? -2 : 2;
            this.style.transform = `translateY(-15px) scale(1.02) rotate(${rotation}deg)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.zIndex = '1';
            this.style.transform = '';
        });
    });
    
    // Add tilt effect to How It Works cards
    const workCards = document.querySelectorAll('#how-it-works .card');
    workCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            this.style.transform = `translateY(-15px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

// Statistics counter animation
function setupStatsAnimation() {
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stats = entry.target.querySelectorAll('.hero-stats h3');
                if (stats.length >= 3) {
                    setTimeout(() => animateCounter(stats[0], 10000), 200);
                    setTimeout(() => animateCounter(stats[1], 2000000), 400);
                    setTimeout(() => animateCounter(stats[2], 500), 600);
                }
                heroObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroObserver.observe(heroSection);
    }
}

function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(start));
        }
    }, 16);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return '$' + (num / 1000000).toFixed(1) + 'M+';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K+';
    }
    return num.toString() + '+';
}

// Animate progress bars on scroll
function animateProgressBars() {
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target.querySelector('.progress-bar');
                if (progressBar) {
                    const width = progressBar.style.width;
                    progressBar.style.width = '0%';
                    setTimeout(() => {
                        progressBar.style.width = width;
                    }, 200);
                }
                progressObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.progress').forEach(progress => {
        progressObserver.observe(progress);
    });
}

// Newsletter form handler
function setupNewsletter() {
    const newsletterBtn = document.querySelector('footer .btn-primary');
    if (newsletterBtn) {
        newsletterBtn.addEventListener('click', function() {
            const emailInput = this.previousElementSibling;
            if (emailInput && emailInput.value && emailInput.value.includes('@')) {
                // Add success animation
                this.innerHTML = '<i class="bi bi-check-circle"></i>';
                this.style.background = 'linear-gradient(135deg, #02A95C, #00D9C0)';
                
                setTimeout(() => {
                    alert('🎉 Thank you for subscribing! You\'ll receive updates about our campaigns.');
                    emailInput.value = '';
                    this.innerHTML = '<i class="bi bi-send"></i>';
                }, 500);
            } else {
                // Shake animation for invalid email
                emailInput.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    emailInput.style.animation = '';
                }, 500);
            }
        });
    }
}

// Mobile menu handler
function setupMobileMenu() {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                bsCollapse.hide();
            }
        });
    });
}

// Add ripple effect to buttons
function addButtonEffects() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// Parallax effect on hero
function setupParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroContent = document.querySelector('.hero-content');
        const shapes = document.querySelectorAll('.shape');
        
        if (heroContent && scrolled < 800) {
            heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
            heroContent.style.opacity = 1 - (scrolled / 800);
        }
        
        shapes.forEach((shape, index) => {
            shape.style.transform = `translateY(${scrolled * (0.1 + index * 0.05)}px)`;
        });
    });
}

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Page load animation
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.6s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});
