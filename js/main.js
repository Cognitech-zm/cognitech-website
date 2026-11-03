/**
 * main.js — site-wide behaviour:
 *   header surface on scroll, services dropdown, mobile menu,
 *   reveal-on-scroll, footer year, placeholder review bar, WhatsApp links.
 * Each feature is a small function; all are safe to run on every page.
 */
(function () {
  "use strict";

  const config = window.CognitechConfig || {};
  const root = document.documentElement;
  root.classList.add("js");

  /* ---- Header: add a surface once the page scrolls ---------------------- */
  function initHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 16);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---- Desktop "Services" disclosure ------------------------------------ */
  function initDropdowns() {
    document.querySelectorAll("[data-dropdown]").forEach((item) => {
      const button = item.querySelector("button[aria-controls]");
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      if (!panel) return;

      const setOpen = (open) => {
        button.setAttribute("aria-expanded", String(open));
        panel.hidden = !open;
      };

      button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));

      // Close on Escape (return focus to the toggle) or when focus leaves.
      item.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !panel.hidden) {
          setOpen(false);
          button.focus();
        }
      });
      item.addEventListener("focusout", (event) => {
        if (!item.contains(event.relatedTarget)) setOpen(false);
      });
      document.addEventListener("click", (event) => {
        if (!item.contains(event.target)) setOpen(false);
      });
    });
  }

  /* ---- Mobile menu --------------------------------------------------------
     Full-screen panel below the header. While open: page scroll is locked,
     focus is kept inside header + menu, Escape closes it.               */
  function initMobileMenu() {
    const button = document.querySelector("[data-menu-button]");
    const menu = document.querySelector("[data-mobile-menu]");
    const header = document.querySelector("[data-header]");
    if (!button || !menu) return;

    const focusables = () =>
      [...header.querySelectorAll("a[href], button"), ...menu.querySelectorAll("a[href], button")].filter(
        (el) => el.offsetParent !== null
      );

    const setOpen = (open, { restoreFocus = true } = {}) => {
      button.setAttribute("aria-expanded", String(open));
      button.querySelector("span").textContent = open ? "Close" : "Menu";
      menu.hidden = !open;
      header.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      if (open) {
        const first = menu.querySelector("a[href]");
        if (first) first.focus();
      } else if (restoreFocus) {
        button.focus();
      }
    };

    button.addEventListener("click", () => setOpen(menu.hidden));

    document.addEventListener("keydown", (event) => {
      if (menu.hidden) return;
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key === "Tab") {
        const items = focusables();
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    // Following a link (including same-page anchors) closes the menu.
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false, { restoreFocus: false });
    });

    // If the viewport grows to desktop size, reset the menu.
    const desktop = window.matchMedia("(min-width: 64em)");
    desktop.addEventListener("change", (event) => {
      if (event.matches && !menu.hidden) setOpen(false, { restoreFocus: false });
    });
  }

  /* ---- Reveal on scroll (skipped for reduced motion) --------------------- */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!items.length) return;
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach((el) => observer.observe(el));
  }

  /* ---- Footer year -------------------------------------------------------- */
  function initYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = year));
  }

  /* ---- Draft preview: outline placeholders (config.showPlaceholderMarkers) */
  function initPlaceholderMarkers() {
    const bar = document.querySelector("[data-review-bar]");
    if (!config.showPlaceholderMarkers) return;
    root.classList.add("show-placeholders");
    if (!bar) return;
    bar.classList.add("is-active");
    const toggle = bar.querySelector("[data-toggle-placeholders]");
    toggle.addEventListener("click", () => {
      const on = root.classList.toggle("show-placeholders");
      toggle.setAttribute("aria-pressed", String(on));
      toggle.textContent = on ? "Hide outlines" : "Show outlines";
    });
  }

  /* ---- WhatsApp buttons (shown only when a number is configured) -------- */
  function initWhatsApp() {
    const number = String(config.whatsappNumber || "").replace(/\D/g, "");
    document.querySelectorAll("[data-whatsapp]").forEach((el) => {
      if (!number) return;
      el.href = `https://wa.me/${number}`;
      el.hidden = false;
    });
    document.querySelectorAll("[data-whatsapp-missing]").forEach((el) => {
      el.hidden = Boolean(number);
    });
  }

  /* ---- Light / dark theme ---------------------------------------------
     The starting theme is set by the inline script in <head>
     (partials/theme.html). This wires up the header toggle, saves the
     visitor's choice, and follows device changes until they choose. */
  function initTheme() {
    const root = document.documentElement;
    const KEY = "cognitech-theme";
    const buttons = document.querySelectorAll("[data-theme-toggle]");
    const saved = () => {
      try {
        const t = localStorage.getItem(KEY);
        return t === "light" || t === "dark" ? t : null;
      } catch {
        return null;
      }
    };

    const apply = (theme, remember) => {
      root.setAttribute("data-theme", theme);
      buttons.forEach((btn) => {
        btn.setAttribute("aria-pressed", String(theme === "dark"));
        btn.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
      });
      if (remember) {
        try {
          localStorage.setItem(KEY, theme);
        } catch {
          /* storage blocked: the choice lasts for this page only */
        }
      }
    };

    apply(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);

    buttons.forEach((btn) =>
      btn.addEventListener("click", () => {
        apply(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
      })
    );

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener?.("change", (e) => {
      if (!saved()) apply(e.matches ? "dark" : "light", false);
    });
  }

  initTheme();
  initHeader();
  initDropdowns();
  initMobileMenu();
  initReveal();
  initYear();
  initPlaceholderMarkers();
  initWhatsApp();
})();
