// PostHog analytics + session replay
!function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="Ei Ni init zi Gi Nr Ui Xi Vi capture calculateEventProperties tn register register_once register_for_session unregister unregister_for_session an getFeatureFlag getFeatureFlagPayload getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync ln identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty nn Qi createPersonProfile setInternalOrTestUser sn qi cn opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing Ji debug Fr rn getPageViewId captureTraceFeedback captureTraceMetric Bi".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('phc_sy5vix3VF5cfVBghtCSzWESza9b56SYmUEsBCPRCKJen', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2026-01-30',
  person_profiles: 'identified_only',
});

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

// Analytics — page identifier (distinct from the nav `page` var above)
const phPage = (function () {
  const p = window.location.pathname;
  if (p.includes('trails')) return 'trails';
  if (p.includes('tours')) return 'tours';
  return 'index';
}());

// CTA click tracking
function _phCTALabel(a) {
  const href = a.href || '';
  const text = (a.textContent || '').trim().toLowerCase();
  if (href.includes('lodgify.com')) return 'book_direct';
  if (href.includes('airbnb.com')) return text.includes('review') ? 'read_reviews_airbnb' : 'view_airbnb';
  if (href.includes('facebook.com')) return text.includes('book a tour') ? 'book_tour_facebook' : 'message_facebook';
  if (href.includes('trails.html')) return 'trail_guide';
  if (href.includes('tours.html')) return 'guided_tours';
  if (href.includes('google.com/maps') || href.includes('streetviewpixels')) return 'street_view';
  return null;
}

function _phCTALocation(a) {
  if (a.closest('.nav-mobile')) return 'nav_mobile';
  if (a.closest('nav')) return 'nav';
  if (a.closest('footer')) return 'footer';
  if (a.closest('.cta-section')) return 'cta_bar';
  const s = a.closest('section[id], section[data-ph-section]');
  if (s) return s.id || s.dataset.phSection || 'unknown';
  return 'unknown';
}

document.addEventListener('click', function (e) {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const label = _phCTALabel(a);
  if (!label) return;
  posthog.capture('cta_clicked', {
    label: label,
    page: phPage,
    location: _phCTALocation(a),
  });
});

// Section visibility tracking
const _phSectionObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const section = el.id || el.dataset.phSection;
    if (!section) return;
    posthog.capture('section_viewed', { section: section, page: phPage });
    _phSectionObserver.unobserve(el);
  });
}, { threshold: 0.3 });

document.querySelectorAll('section[id]:not(#home), section[data-ph-section]').forEach(function (el) {
  _phSectionObserver.observe(el);
});
