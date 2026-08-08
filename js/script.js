

document.documentElement.classList.add("motion-ready");
document.body.classList.add("motion-ready", "intro-active");
window.setTimeout(() => document.body.classList.add("intro-done"), 140);
window.setTimeout(() => document.body.classList.remove("intro-active", "intro-done"), 980);
window.requestAnimationFrame(() => document.body.classList.add("hero-ready"));

(function pageTransitions() {
  // Morphing page transitions using a full-screen overlay, fetch, and history.pushState
  const TRANSITION_DURATION = 520;
  const overlay = document.createElement('div');
  overlay.id = 'morph-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = '<div class="morph-inner" aria-hidden="true"></div>';
  document.body.appendChild(overlay);

  const showOverlay = (fromX = 0, fromY = 0) => {
    overlay.classList.add('visible');
    overlay.style.setProperty('--tx', fromX + 'px');
    overlay.style.setProperty('--ty', fromY + 'px');
    return new Promise((res) => setTimeout(res, TRANSITION_DURATION));
  };

  const hideOverlay = () => {
    overlay.classList.remove('visible');
    return new Promise((res) => setTimeout(res, TRANSITION_DURATION));
  };

  const loadUrl = async (href, push = true) => {
    try {
      const resp = await fetch(href, { credentials: 'same-origin' });
      if (!resp.ok) throw new Error('Network response not ok');
      const text = await resp.text();
      const tmp = document.createElement('div');
      tmp.innerHTML = text;
      const newMain = tmp.querySelector('main');
      const newTitle = tmp.querySelector('title')?.textContent || document.title;

      if (newMain) {
        const main = document.querySelector('main');
        // replace main content
        main.replaceWith(newMain);
        document.title = newTitle;
        if (push) history.pushState({ url: href }, newTitle, href);
        // re-run init functions after content swap
        reinitializePage();
      } else {
        // fallback to full navigation
        window.location.href = href;
      }
    } catch (err) {
      console.error('Page load failed for', href, err);
      window.location.href = href;
    }
  };

  const onNavClick = async (event) => {
    const link = event.currentTarget;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || link.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();

    const rect = link.getBoundingClientRect();
    const fromX = rect.left + rect.width / 2 - window.innerWidth / 2;
    const fromY = rect.top + rect.height / 2 - window.innerHeight / 2;

    await showOverlay(fromX, fromY);
    await loadUrl(href);
    await hideOverlay();
  };

  const bindLinks = () => {
    document.querySelectorAll('a[href$=".html"]').forEach((a) => {
      a.removeEventListener('click', onNavClick);
      a.addEventListener('click', onNavClick);
    });
  };

  // popstate support
  window.addEventListener('popstate', (e) => {
    const href = location.pathname.split('/').pop() || 'index.html';
    showOverlay(0,0).then(() => loadUrl(href, false).then(hideOverlay));
  });

  // initial bind
  bindLinks();

  // Expose small API
  window.__morph = { bindLinks, showOverlay, hideOverlay, loadUrl };
})();

(function navMenu() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("nav");
  const header = document.querySelector(".site-header");

  if (!toggle || !nav) return;

  const setMenuState = (isOpen) => {
    nav.classList.toggle("open", isOpen);
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  };

  toggle.addEventListener("click", () => {
    const isOpen = !nav.classList.contains("open");
    setMenuState(isOpen);
  });

  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) {
      setMenuState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuState(false);
  });

  const onScroll = () => {
    const scrolled = window.scrollY > 8;
    header?.classList.toggle("scrolled", scrolled);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

(function highlightNav() {
  const links = document.querySelectorAll(".nav-link");
  const path = window.location.pathname.split("/").pop() || "index.html";

  links.forEach((link) => {
    if (link.getAttribute("href") === path) link.classList.add("active");
  });
})();

(function indexScrollNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  if (path !== "index.html") return;

  const pairs = [
    { section: document.getElementById("home"), link: document.querySelector('.nav-link[href="index.html"]') },
    { section: document.getElementById("intro"), link: document.querySelector('.nav-link[href="about.html"]') },
    { section: document.getElementById("featured"), link: document.querySelector('.nav-link[href="Portfolio.html"]') }
  ].filter((item) => item.section && item.link);

  if (!pairs.length || !("IntersectionObserver" in window)) return;

  const allLinks = document.querySelectorAll(".nav-link");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activePair = pairs.find((pair) => pair.section === entry.target);
        if (!activePair) return;
        allLinks.forEach((link) => link.classList.remove("active"));
        activePair.link.classList.add("active");
      });
    },
    { threshold: 0.45, rootMargin: "-10% 0px -35% 0px" }
  );

  pairs.forEach((pair) => observer.observe(pair.section));
})();

(function sectionSpy() {
  const links = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
  if (!links.length || !("IntersectionObserver" in window)) return;

  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const sectionToLink = new Map();
  links.forEach((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    if (section) sectionToLink.set(section, link);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.remove("active"));
        sectionToLink.get(entry.target)?.classList.add("active");
      });
    },
    { threshold: 0.45, rootMargin: "-10% 0px -35% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
})();

document.getElementById("year")?.textContent = new Date().getFullYear();

(function revealOnScroll() {
  const revealItems = document.querySelectorAll(".reveal");
  if (!revealItems.length) return;

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("revealed");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
})();

(function heroParallax() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const update = () => {
    const offset = Math.min(window.scrollY * 0.15, 28);
    hero.style.setProperty("--parallax-offset", `${offset}px`);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
})();

(function portfolioFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".project-card[data-category]");
  if (!filterButtons.length || !cards.length) return;

  const resetInClass = (card) => {
    card.classList.remove("filter-in");
  };

  const applyFilter = (filter) => {
    cards.forEach((card) => {
      card.hidden = false;
      const show = filter === "all" || card.dataset.category === filter;
      if (!show) {
        card.classList.add("filter-out");
        card.style.display = "none";
        return;
      }

      card.style.display = "";
      card.classList.remove("filter-out");
      card.classList.add("filter-in");
      setTimeout(() => resetInClass(card), 360);
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      applyFilter(button.dataset.filter);
    });
  });

  const initial = document.querySelector(".filter-btn.active")?.dataset.filter || "all";
  applyFilter(initial);
})();

(function projectPreview() {
  const lightbox = document.getElementById("lightbox");
  const cards = document.querySelectorAll(".projects-grid .project-card[data-title]");
  if (!lightbox || !cards.length) return;

  const closeBtn = lightbox.querySelector(".lb-close");
  const image = lightbox.querySelector(".lb-img");
  const caption = lightbox.querySelector(".lb-caption");
  const desc = lightbox.querySelector(".lb-desc");

  const openPreview = (card) => {
    const cardImage = card.querySelector("img");
    const cardTitle = card.querySelector("h3");
    const cardDesc = card.querySelector(".proj-desc") || card.querySelector("p");

    image.src = cardImage?.src || "";
    image.alt = cardImage?.alt || cardTitle?.textContent || "Project preview";
    caption.textContent = cardTitle?.textContent || "Project";
    if (desc) desc.textContent = cardDesc?.textContent || "Project details";

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closePreview = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  cards.forEach((card) => {
    if (!card.querySelector("img")) return;

    card.addEventListener("click", () => openPreview(card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPreview(card);
      }
    });
    if (!card.hasAttribute("tabindex")) card.tabIndex = 0;
  });

  closeBtn?.addEventListener("click", closePreview);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closePreview();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.getAttribute("aria-hidden") === "false") {
      closePreview();
    }
  });
})();

(function animateProgress() {
  const bars = document.querySelectorAll(".progress");
  if (!bars.length) return;
  const page = window.location.pathname.split("/").pop() || "index.html";

  const fill = (bar) => {
    const value = bar.dataset.value || "0";
    const span = bar.querySelector("span");
    const valueEl = bar.parentElement?.querySelector(".skill-value");
    if (span) span.style.width = `${value}%`;
    if (valueEl) countTo(valueEl, Number(value));
  };

  const countTo = (el, target) => {
    const current = parseInt(el.textContent || "0", 10);
    let start = Number.isFinite(current) ? current : 0;
    const duration = 950;
    const begin = performance.now();
    const step = (time) => {
      const progress = Math.min((time - begin) / duration, 1);
      const current = Math.round(start + (target - start) * progress);
      el.textContent = `${current}%`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    bars.forEach(fill);
    return;
  }

  if (page === "about.html") {
    window.setTimeout(() => {
      bars.forEach(fill);
    }, 230);
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        fill(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );

  bars.forEach((bar) => observer.observe(bar));

  // Fallback in case intersection does not trigger on some browsers/layout states.
  window.setTimeout(() => {
    bars.forEach((bar) => {
      const span = bar.querySelector("span");
      if (!span || span.style.width) return;
      fill(bar);
    });
  }, 1200);
})();

(function testimonialCarousel() {
  const cards = Array.from(document.querySelectorAll(".testimonial-carousel .testimonial-card"));
  if (cards.length < 2) return;

  let index = 0;
  cards[index].classList.add("active");

  window.setInterval(() => {
    cards[index].classList.remove("active");
    index = (index + 1) % cards.length;
    cards[index].classList.add("active");
  }, 3800);
})();

(function optimizePortfolioVideo() {
  const videos = document.querySelectorAll('.project-card video');
  if (!videos.length) return;

  videos.forEach((video) => {
    video.muted = false;
    video.volume = 1;
    video.setAttribute("playsinline", "");
  });
})();

(function contactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusEl = document.getElementById("form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const defaultBtnText = submitBtn?.textContent || "Send";
  const whatsappNumber = "237678620953";

  const setStatus = (message, type) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove("error", "success");
    if (type) statusEl.classList.add(type);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const honeypot = form.querySelector("#company");
    if (honeypot?.value) return;

    const name = form.from_name?.value?.trim() || "...";
    const need = form.message?.value?.trim() || "...";
    const text = `Hello I am ${name} and I need ${need}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;

    setStatus("Opening WhatsApp...", "success");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
      submitBtn.textContent = "Opening";
    }

    try {
      window.location.assign(whatsappUrl);
    } catch (error) {
      console.error("WhatsApp redirect failed:", error);
      const fallbackUrl = `https://wa.me/${whatsappNumber}`;
      if (statusEl) {
        statusEl.innerHTML = `Could not open WhatsApp automatically. <a href="${fallbackUrl}" target="_blank" rel="noopener noreferrer">Tap here to open WhatsApp</a>.`;
        statusEl.classList.remove("success");
        statusEl.classList.add("error");
      } else {
        setStatus("Could not open WhatsApp. Please try again.", "error");
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
        submitBtn.textContent = defaultBtnText;
      }
    }
  });
})();

/* --- Portfolio staggered reveal + lightbox re-init --- */
function initPortfolioGallery() {
  const grids = document.querySelectorAll('.projects-grid[data-animate="stagger"]');
  if (!grids.length || !('IntersectionObserver' in window)) return;

  grids.forEach((grid) => {
    const cards = Array.from(grid.querySelectorAll('.project-card'));
    // reset state
    cards.forEach((c) => c.classList.remove('is-inview'));

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const visibleCards = cards.filter((c) => grid.contains(c));
        visibleCards.forEach((card, i) => {
          setTimeout(() => card.classList.add('is-inview'), i * 90);
        });
        visibleCards.forEach((c) => obs.unobserve(c));
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    cards.forEach((card) => observer.observe(card));
  });
}

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const closeBtn = lightbox.querySelector('.lb-close');
  const imgEl = lightbox.querySelector('.lb-img');
  const caption = lightbox.querySelector('.lb-caption');
  const desc = lightbox.querySelector('.lb-desc');

  const open = (src, title) => {
    imgEl.src = src || '';
    imgEl.alt = title || '';
    caption.textContent = title || '';
    if (desc) desc.textContent = '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // bind cards
  document.querySelectorAll('.projects-grid .project-card[data-title]').forEach((card) => {
    card.removeEventListener('click', card._lbHandler);
    const handler = () => open(card.querySelector('img')?.src, card.dataset.title || 'Project');
    card._lbHandler = handler;
    card.addEventListener('click', handler);
    card.tabIndex = card.tabIndex || 0;
  });

  closeBtn?.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox.getAttribute('aria-hidden') === 'false') close(); });
}

function reinitializePage() {
  // Re-bind navigation links for morph transitions
  window.__morph?.bindLinks?.();
  // update year
  document.getElementById('year')?.textContent = new Date().getFullYear();
  // re-init portfolio and lightbox
  initPortfolioGallery();
  initLightbox();
  // re-run any simple layout adjustments
  (function safeHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const update = () => hero.style.setProperty('--parallax-offset', `${Math.min(window.scrollY * 0.15, 28)}px`);
    update();
    window.addEventListener('scroll', update, { passive: true });
  })();
  // highlight nav again
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.remove('active'));
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach((link) => { if (link.getAttribute('href') === path) link.classList.add('active'); });
}

// initial run for the current page
initPortfolioGallery();
initLightbox();
