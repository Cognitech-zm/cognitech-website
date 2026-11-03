/**
 * forms.js — contact forms submitted to Formspree with fetch().
 *
 * Markup contract: <form data-formspree novalidate> containing inputs named
 * name, email, phone, message (+ optional hidden "service") and a
 * [data-form-status] live region. The endpoint lives in js/config.js.
 *
 * States handled: invalid input, sending (button disabled — no double
 * submits), success, Formspree error response, network failure/timeout,
 * and "not configured" (placeholder endpoint — nothing is sent).
 */
(function () {
  "use strict";

  const config = window.CognitechConfig || {};
  const TIMEOUT_MS = 15000;

  const ICONS = {
    success: "i-circle-check",
    error: "i-circle-alert",
    info: "i-circle-alert",
  };

  /* ---- Validation rules -------------------------------------------------- */
  const rules = {
    name(value) {
      if (!value) return "Please enter your name.";
      if (value.length < 2) return "Your name looks too short.";
      return "";
    },
    email(value) {
      if (!value) return "Please enter your work email address.";
      // Pragmatic check: something@domain.tld (the server re-validates)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return "Enter an email address like name@company.co.zm.";
      return "";
    },
    phone(value) {
      if (!value) return "Please enter a phone or WhatsApp number.";
      const digits = value.replace(/\D/g, "");
      if (!/^[+\d\s().-]+$/.test(value) || digits.length < 9 || digits.length > 15) {
        return "Enter a valid number, e.g. +260 97 000 0000.";
      }
      return "";
    },
    message(value) {
      if (!value) return "Please tell us a little about what you need.";
      if (value.length < 10) return "Please add a little more detail (at least 10 characters).";
      return "";
    },
  };

  const isConfigured = (endpoint) =>
    typeof endpoint === "string" && /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(endpoint) && !endpoint.includes("YOUR_FORM_ID");

  const escapeHtml = (text) =>
    String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  function iconSvg(id) {
    return `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
  }

  function initForm(form) {
    const status = form.querySelector("[data-form-status]");
    const submit = form.querySelector('[type="submit"]');
    const submitLabel = submit.innerHTML;
    let submitting = false;
    let attempted = false;

    // Pre-fill the service of interest from ?service=… (links on service pages)
    const params = new URLSearchParams(window.location.search);
    const serviceInput = form.querySelector('input[name="service"]');
    if (serviceInput && params.get("service")) {
      serviceInput.value = params.get("service").slice(0, 80);
    }

    function fieldParts(input) {
      const field = input.closest(".field");
      const error = field && field.querySelector(".field__error");
      return { field, error };
    }

    function showFieldError(input, message) {
      const { field, error } = fieldParts(input);
      if (!field || !error) return;
      field.classList.toggle("is-invalid", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
      error.innerHTML = message ? `${iconSvg("i-circle-alert")}<span>${message}</span>` : "";
    }

    function validateInput(input) {
      const rule = rules[input.name];
      if (!rule) return true;
      const message = rule(input.value.trim());
      showFieldError(input, message);
      return !message;
    }

    function validateAll() {
      let firstInvalid = null;
      Object.keys(rules).forEach((name) => {
        const input = form.elements[name];
        if (input && !validateInput(input) && !firstInvalid) firstInvalid = input;
      });
      return firstInvalid;
    }

    function setStatus(type, html) {
      if (!status) return;
      status.className = `form-status form-status--${type} is-visible`;
      status.innerHTML = `${iconSvg(ICONS[type])}<div>${html}</div>`;
    }

    function clearStatus() {
      if (!status) return;
      status.className = "form-status";
      status.innerHTML = "";
    }

    function setSubmitting(on) {
      submitting = on;
      submit.disabled = on;
      form.setAttribute("aria-busy", String(on));
      submit.innerHTML = on ? '<span class="spinner" aria-hidden="true"></span> Sending…' : submitLabel;
    }

    // Live re-validation once the visitor has tried to submit, or after
    // they leave a field they've typed in.
    form.addEventListener("input", (event) => {
      if (attempted && rules[event.target.name]) validateInput(event.target);
    });
    form.addEventListener("focusout", (event) => {
      const input = event.target;
      if (rules[input.name] && input.value.trim()) validateInput(input);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitting) return; // ignore repeated clicks while sending
      attempted = true;
      clearStatus();

      const firstInvalid = validateAll();
      if (firstInvalid) {
        setStatus("error", "Please check the highlighted fields and try again.");
        firstInvalid.focus();
        return;
      }

      // Honeypot: real visitors never fill this hidden field.
      const trap = form.querySelector('[name="_gotcha"]');
      if (trap && trap.value) return;

      const endpoint = config.formspreeEndpoint;
      if (!isConfigured(endpoint)) {
        setStatus(
          "info",
          "<strong>This form isn't connected yet.</strong> Your message has not been sent. " +
            "(Site owner: add the Formspree endpoint in <code>js/config.js</code>.)"
        );
        return;
      }

      const data = new FormData(form);
      if (config.formSubject) data.append("_subject", config.formSubject);
      data.append("page", window.location.pathname);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      setSubmitting(true);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (response.ok) {
          form.reset();
          attempted = false;
          Object.keys(rules).forEach((name) => form.elements[name] && showFieldError(form.elements[name], ""));
          setStatus(
            "success",
            "<strong>Thank you — your enquiry has been sent.</strong> We'll review it and reply to the email or number you gave us."
          );
          status && status.focus();
        } else {
          let detail = "";
          try {
            const body = await response.json();
            if (body && Array.isArray(body.errors)) {
              detail = escapeHtml(body.errors.map((e) => e.message).filter(Boolean).join(" "));
            }
          } catch (_) {
            /* non-JSON error body */
          }
          setStatus(
            "error",
            `<strong>Sorry, your message couldn't be sent.</strong> ${detail || "Please try again in a moment."}`
          );
        }
      } catch (error) {
        const timedOut = error && error.name === "AbortError";
        setStatus(
          "error",
          `<strong>${timedOut ? "The request timed out." : "We couldn't reach the server."}</strong> ` +
            "Please check your internet connection and try again. Your message is still in the form."
        );
      } finally {
        clearTimeout(timer);
        setSubmitting(false);
      }
    });
  }

  document.querySelectorAll("form[data-formspree]").forEach(initForm);
})();
