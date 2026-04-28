// Scroll-reveal
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(el => observer.observe(el));

// Nav shadow on scroll
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 40 ? '0 2px 24px rgba(0,0,0,0.4)' : 'none';
});

// Mobile nav toggle
const toggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('navMobile');
if (toggle && mobileNav) {
  toggle.addEventListener('click', () => {
    const open = toggle.classList.toggle('open');
    mobileNav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      mobileNav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Mark active nav link based on current page
const page = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  const href = a.getAttribute('href');
  if (href === page || (page === '' && href === 'index.html')) {
    a.classList.add('nav-active');
  }
});
