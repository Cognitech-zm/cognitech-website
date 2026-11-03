/**
 * Cognitech site configuration — the ONE place to change runtime settings.
 * See README.md → "Configure Formspree" before going live.
 */
window.CognitechConfig = {
  /**
   * Formspree form endpoint, e.g. "https://formspree.io/f/abcdwxyz".
   * Leave the placeholder until a real form exists: while it contains
   * "YOUR_FORM_ID" the contact forms validate input but do NOT send, and
   * tell the visitor the form is not connected yet.
   */
  formspreeEndpoint: "https://formspree.io/f/xrpppewg",

  /** Optional subject line Formspree uses for notification emails. */
  formSubject: "New website enquiry — Cognitech Business Solutions",

  /**
   * Optional WhatsApp number in international format, digits only,
   * e.g. "260970000000". When empty, WhatsApp buttons stay hidden.
   */
  whatsappNumber: "260977781375",

  /**
   * Outline every block marked data-placeholder and show the
   * "Draft preview" bar. Set to false before launch.
   */
  showPlaceholderMarkers: true,
};
