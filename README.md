# Cognitech Business Solutions — website

The marketing website for **Cognitech Business Solutions**: a static, multi-page site that presents Cognitech's five service areas and turns visitors into enquiries. It's built with plain HTML, CSS and vanilla JavaScript. There's no framework and no build step, so it runs on any static host or ordinary web server.

> **Status: draft preview.** The layout, design system and functionality are complete. Most copy, and all pricing, portfolio, testimonial and contact details, are **placeholders**. See [What still needs real business information](#what-still-needs-real-business-information) before going live.

---

## Contents

1. [Project structure](#project-structure)
2. [Technologies and dependencies](#technologies-and-dependencies)
3. [Run it locally](#run-it-locally)
4. [Shared header, footer and icons](#shared-header-footer-and-icons)
5. [Add or update a page](#add-or-update-a-page)
6. [Colours, typography and design tokens](#colours-typography-and-design-tokens)
   - [Light and dark mode](#light-and-dark-mode)
7. [Logos, fonts and other assets](#logos-fonts-and-other-assets)
8. [Placeholder content and pricing](#placeholder-content-and-pricing)
9. [Configure Formspree (contact forms)](#configure-formspree-contact-forms)
10. [Domain, metadata and sitemap](#domain-metadata-and-sitemap)
11. [Deploy](#deploy)
12. [What still needs real business information](#what-still-needs-real-business-information)
13. [Testing performed](#testing-performed)

---

## Project structure

```
cognitech-website/
├── index.html                       Homepage
├── services.html                    Overview of all five services
├── services/
│   ├── software-web-development.html
│   ├── digital-growth-lead-generation.html
│   ├── business-automation-crm.html
│   ├── it-support-infrastructure.html
│   └── ecommerce-payment-integration.html
├── about.html
├── pricing.html
├── faq.html
├── contact.html
├── assets/
│   ├── brand/      Web copies of the Cognitech logo files, favicon SVG, Apple touch icon
│   ├── fonts/      Manrope (variable, self-hosted) + its licence
│   └── images/     og-default.png (social sharing image)
├── css/
│   ├── tokens.css      ← colours, type scale, spacing, radii, shadows, motion (edit here first)
│   ├── base.css        reset, typography defaults, focus styles, reduced-motion
│   ├── layout.css      containers, section bands, grids, header, mobile menu, footer
│   ├── components.css  buttons, cards, hero, steps, pricing, FAQ, forms, CTA band …
│   └── pages.css       page-specific pieces and small utilities
├── js/
│   ├── config.js   ← Formspree endpoint, WhatsApp number, draft-preview switch
│   ├── main.js     header scroll state, Services dropdown, mobile menu, reveal-on-scroll
│   └── forms.js    validation and Formspree submission
├── partials/       Source of the shared header, footer, icon sprite and theme script (see below)
├── tools/
│   ├── site.config.json   Domain + list of pages (drives canonical URLs and the sitemap)
│   └── sync-layout.mjs    Optional helper: copies partials into every page, rebuilds the sitemap
├── favicon.ico
├── robots.txt
└── sitemap.xml
```

The original brand files in `../Logo - Quadrant Indigo Copper/` are **not modified**. The SVGs in `assets/brand/` are web copies with rounded path coordinates, tighter whitespace and accessible labels.

## Technologies and dependencies

| What | Why |
|---|---|
| HTML5, CSS3, vanilla JavaScript (ES2020) | No framework, no bundler, no runtime dependencies |
| [Manrope](https://github.com/sharanda/manrope) variable font (SIL OFL 1.1), self-hosted | The same typeface as the Cognitech wordmark, served with the site so there are no third-party font requests |
| [Lucide](https://lucide.dev) icons (ISC licence), v0.460.0 | About 50 outline icons copied into an inline SVG sprite. Nothing is loaded from a CDN. |
| [Formspree](https://formspree.io) | Receives contact-form submissions (configured in `js/config.js`) |
| Node.js 18+ (**optional**) | Only needed to run `tools/sync-layout.mjs`; the website itself doesn't use Node |

The site makes **no external requests** apart from the Formspree form submission.

## Run it locally

Pages also open directly from disk (double-click `index.html`), but a local web server gives a more accurate preview: over `file://`, browsers block the font *preload* hint (a harmless console warning — the font still loads) and other features can behave differently. From the `cognitech-website` folder, run any one of these:

```bash
python3 -m http.server 8080        # Python 3 (Windows: py -m http.server 8080)
npx serve .                        # Node.js
php -S localhost:8080              # PHP
```

Then open <http://localhost:8080>. VS Code's **Live Server** extension also works.

## Shared header, footer and icons

Every page contains its own copy of the header, footer and icon sprite. This keeps pages fast, readable without JavaScript and fully visible to search engines. To avoid editing 11 copies, the shared markup lives in `partials/`:

| Edit this | It replaces everything between these markers in each page |
|---|---|
| `partials/header.html` | `<!-- layout:header -->` … `<!-- /layout:header -->` |
| `partials/footer.html` | `<!-- layout:footer -->` … `<!-- /layout:footer -->` |
| `partials/icons.svg`   | `<!-- layout:icons -->` … `<!-- /layout:icons -->` |
| `partials/theme.html`  | `<!-- layout:theme -->` … `<!-- /layout:theme -->` (in `<head>`) |

After editing a partial, run:

```bash
node tools/sync-layout.mjs          # update all pages, sitemap.xml and robots.txt
node tools/sync-layout.mjs --check  # report anything out of date, without changing files
```

The script also:

- swaps `{{root}}` for the correct relative path (`""` or `"../"`)
- marks the current page in the navigation with `aria-current="page"`
- rewrites canonical and Open Graph URLs

If you don't have Node.js, make the same edit by hand in each page. The marker comments show exactly where the shared markup is.

**Using an icon:** `<svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg>`. The available names are the `id`s in `partials/icons.svg`. To add one, copy the inner shapes of the icon from [lucide.dev](https://lucide.dev) into a new `<symbol id="i-NAME" viewBox="0 0 24 24">` and run the sync script.

## Add or update a page

1. Copy the closest existing page. For example, copy a service page into `services/`.
2. Update `<title>`, `<meta name="description">`, `og:title` and `og:description`. Each page needs its own.
3. Edit the content inside `<main>`. Reuse existing components (see `css/components.css`) rather than writing new styles.
4. Add the page to `tools/site.config.json`. The `nav` key controls which navigation item is highlighted.
5. Link to it from the navigation (`partials/header.html`) and footer (`partials/footer.html`) if appropriate.
6. Run `node tools/sync-layout.mjs`.

Pages inside `services/` use `../` in front of every asset and page link. The sync script handles this for the shared parts, but in your own content you need to add it yourself.

**Content conventions**

- Section backgrounds use band classes: `band-ink` (deep indigo), `band-paper` (warm off-white), `band-white` and `band-indigo`.
- To place a quadrant divider between a dark and a light band:

  ```html
  <div class="q-divider" style="--from: var(--indigo-900); --to: var(--paper);" aria-hidden="true"></div>
  ```

  Add `q-divider--flip` when the band below is the darker one.

- Two-tone headlines: `<h2 class="headline">Soft part <span class="hl">emphasised part.</span></h2>`.
- Add `class="reveal"` to an element to give it a gentle fade-in on scroll. The effect is skipped for reduced-motion users and when JavaScript is off.

## Colours, typography and design tokens

Everything global lives in **`css/tokens.css`**:

- **Brand colours** come from the logo files: indigo `#2B2A80`, copper `#D2743A` and slate `#5E6080`. The other shades are derived from them for contrast.
- **Accessibility:** brand copper is only 3.3:1 on white, so it's used for graphics, large text and button backgrounds (with dark indigo text, 5.3:1). For small copper text, use `--accent-text` (`#A24F1F` on light backgrounds, `#E8925A` on dark), which meets WCAG AA.
- **Typography:** `--font-sans` and the `--fs-*` type scale. Display sizes use `clamp()` so they scale smoothly between phone and desktop.
- **Spacing, layout and shape:**
  - `--space-*` for spacing, `--section-y` for section padding and `--gutter` for side margins
  - `--container` sets the content width (1280px)
  - `--radius-q*` gives the signature "quadrant corner": square shapes with only the top-right corner rounded
- **Motion:** `--dur-*` and `--ease`.

### Light and dark mode

The site has a light theme (the original design) and a dark theme, with a sun/moon toggle in the header.

- **Which theme a visitor sees:** their device setting on the first visit. Once they use the toggle, their choice is remembered in their browser (`localStorage`, key `cognitech-theme`) on every page.
- **No flash:** the small script in `partials/theme.html` runs in each page's `<head>` and sets `data-theme="light"` or `"dark"` on `<html>` before anything is drawn. `js/main.js` (`initTheme`) wires up the toggle.
- **Without JavaScript:** the site shows the light theme and the toggle is hidden.
- **Colours:** everything lives in `css/tokens.css`. Components use theme tokens such as `--band-paper`, `--band-white`, `--band-ink`, `--surface-raised`, `--surface-sunk`, `--surface-tint`, `--text`, `--text-muted` and `--accent-text`. The `[data-theme="dark"]` block at the end of `tokens.css` sets their dark values. A few component tweaks are at the end of `css/components.css` ("Dark theme adjustments").
- **Dark palette:** deep indigo surfaces (`#0B0A24` and `#100F2E` for sections, `#1A1946` for cards, `#08071C` for the footer), near-white text `#EEEEF8`, lavender-grey `#A9AAD0` for secondary text, and light copper `#E8925A` for small copper text. Ink bands (hero, call-to-action) and brand copper buttons look the same in both themes.
- **Footer logo:** the indigo logo shows in light mode and the white logo in dark mode (`.logo-on-light` / `.logo-on-dark`).
- **New sections:** use the band classes and the theme tokens (not `--white` or `--paper` directly for backgrounds), and both themes will work. For quadrant dividers, use `--band-ink`, `--band-paper` and `--band-white` in `--from` / `--to`.

## Logos, fonts and other assets

| Asset | Location | Notes |
|---|---|---|
| Header logo (for dark backgrounds) | `assets/brand/cognitech-logo-white.svg` | Referenced in `partials/header.html` |
| Footer logo (for light backgrounds) | `assets/brand/cognitech-logo-indigo-copper.svg` | Referenced in `partials/footer.html` |
| Symbol only | `assets/brand/cognitech-mark-indigo-copper.svg` | Faint watermark in the footer |
| Favicons | `assets/brand/cognitech-app-icon.svg`, `favicon.ico`, `assets/brand/apple-touch-icon.png` | Linked in each page's `<head>` |
| Social sharing image | `assets/images/og-default.png` (1200×630) | Set via `ogImage` in `tools/site.config.json` |
| Font | `assets/fonts/manrope-latin-variable.woff2` | Declared in `css/tokens.css` (`@font-face`) |

To replace a logo, keep the same file name, or update the `src` in the partial and run the sync script. If the logo's proportions change, update the `width` and `height` attributes too, so the page doesn't shift while it loads.

## Placeholder content and pricing

- **Square brackets** mark anything that needs a real fact: `[PACKAGE NAME]`, `[PRICE]`, `[BILLING PERIOD]`, `[FEATURE DESCRIPTION]`, `[CLIENT NAME]`, `[EMAIL ADDRESS]`, `[TIMELINE GUIDANCE …]` and so on. Search the project for `[` to find them all.
- **Draft copy:** marketing text is written as realistic proposed copy, but it's still draft. Blocks that need review carry a `data-placeholder` attribute.
- **Review outlines:** while `showPlaceholderMarkers: true` is set in `js/config.js`, every placeholder block has a dashed copper outline and a small "Draft preview" bar appears. The bar's button hides the outlines temporarily. **Set it to `false` before launch.**
- **Badges:** visible `<span class="ph">…</span>` badges ("Draft copy", "Suggested highlight", "Add privacy notice") must be removed or replaced before launch.
- **Pricing:** edit the three package cards and the add-on rows in `pricing.html`, and the three summary cards in the Pricing section of `index.html`. Remove the dashed "placeholders" notices once real, approved prices are in place.
- **Portfolio and proof:** in `index.html`, replace the project rows, client logo slots, testimonial and metric cards with **real, verified, client-approved** content, or delete those sections.
- **Service scope:** each service page has a "Proposed scope — for review" notice above its capability list. Confirm the capabilities before removing the notice.

## Configure Formspree (contact forms)

Both forms (the homepage and `contact.html`) send to **one** endpoint, set in **`js/config.js`**:

```js
formspreeEndpoint: "https://formspree.io/f/YOUR_FORM_ID",
```

While the placeholder is in place, the forms still validate input, but **they don't send anything**. Instead they tell the visitor the form isn't connected yet.

1. **Create the form:** sign in at [formspree.io](https://formspree.io) with the mailbox that should receive enquiries, then choose **New form**. Name it, for example, "Cognitech website enquiries".
2. **Copy the endpoint:** it's shown on the form's **Integration** tab, for example `https://formspree.io/f/abcdwxyz`.
3. **Paste it into `js/config.js`:** replace the placeholder value. This is the only place it needs to change.
4. **Recommended Formspree settings:**
   - Verify the notification email address. Formspree sends a confirmation email on the first submission.
   - Under **Settings → Restrict to domain**, add your production domain so other sites can't post to your form.
   - Keep spam filtering on. The forms already include Formspree's `_gotcha` honeypot field.
   - Optionally change `formSubject` in `js/config.js`, which sets the subject line of notification emails.
5. **Test it:**
   - Deploy the site, or run it locally.
   - Submit a test enquiry and confirm you see the green "Thank you" message.
   - Check the email arrives, and that it appears in the Formspree dashboard under **Submissions**.
   - Also try submitting with a field left empty, to confirm validation still works.

Each submission includes `name`, `email`, `phone`, `message`, the `service` of interest (filled in automatically when a visitor arrives from a "Request a quote" link, e.g. `contact.html?service=business-automation-crm`) and the `page` it was sent from.

**Security:** a Formspree form endpoint is meant to be public, so it is safe in frontend code. Never put API keys or account tokens in `js/config.js` or anywhere else in the site.

**WhatsApp button (optional):** set `whatsappNumber` in `js/config.js` (international format, digits only, e.g. `"2609XXXXXXXX"`). A "Chat on WhatsApp" button then appears on the contact page. It stays hidden while the number is empty.

## Domain, metadata and sitemap

1. Set your domain in `tools/site.config.json`, for example `"siteUrl": "https://www.cognitech.co.zm"`.
2. Run `node tools/sync-layout.mjs`. This updates `<link rel="canonical">`, `og:url` and `og:image` on every page, and regenerates `sitemap.xml` and `robots.txt`.
3. Edit each page's `<title>` and `<meta name="description">`, and remove the `[Draft description]` suffix.
4. After launch, submit `https://YOUR-DOMAIN/sitemap.xml` in [Google Search Console](https://search.google.com/search-console).

**Local SEO (Zambia):**

- Pages use `lang="en-ZM"` and `og:locale="en_ZM"`, and titles and descriptions mention Lusaka and Zambia.
- Once the business details are verified, create a **Google Business Profile** with exactly the same name, address and phone number as the website footer and contact page.
- You could also add `Organization` / `LocalBusiness` structured data (JSON-LD) at that point. It has been left out deliberately, so the site makes no unverified claims.

## Deploy

The folder is the website, and no build is needed. Upload the contents of `cognitech-website/` to any static host:

| Host | How |
|---|---|
| **cPanel / conventional hosting** | Upload everything to `public_html/` (FTP or File Manager). `index.html` is served at `/`. |
| **Netlify** | Drag and drop the folder at app.netlify.com/drop, or connect a Git repo with no build command and `.` as the publish directory. |
| **Cloudflare Pages / GitHub Pages / Vercel** | Static site, no build command, output directory = project root. |

- **Uploading:** `partials/`, `tools/` and `README.md` aren't needed on the server. They're harmless if uploaded, and `robots.txt` tells search engines to skip them.
- **HTTPS:** serve the site over HTTPS. Formspree and modern browsers expect it.
- **Before going live:** set `showPlaceholderMarkers: false` and work through the list below.

## What still needs real business information

**Must do before launch:**

- [ ] **Formspree endpoint** in `js/config.js`, plus a live test submission
- [ ] **Production domain** in `tools/site.config.json`, then run the sync script
- [ ] **Contact details:** email, phone/WhatsApp, office address, business hours (footer partial and `contact.html`)
- [ ] **Pricing:** package names, prices, billing periods, features, currency/VAT, payment terms (`pricing.html`, homepage)
- [ ] **Portfolio:** real case studies, or remove the section (homepage)
- [ ] **Proof:** client logos, testimonial, metrics and accreditations, all verified and with permission, or remove them (homepage)
- [ ] **About page:** company introduction, mission, vision, values, and team names, roles, bios and photos (or remove the team section)
- [ ] **Service pages:** confirm the capabilities offered, and fill the bracketed FAQ answers (ownership, ad-spend handling, on-site coverage, payment providers, data protection)
- [ ] **FAQ page:** service area, consultation terms, timelines, support process, hosting and domains
- [ ] **Response-time statement** in "What happens next"
- [ ] **Privacy notice:** add a privacy policy page and link it from the forms (Zambia's Data Protection Act No. 3 of 2021 applies to personal data collected through the forms)
- [ ] **Proofreading:** review all draft copy, and remove `[Draft description]` from meta descriptions
- [ ] **Turn off draft markers:** set `showPlaceholderMarkers` to `false` and remove the `.ph` badges

**Optional:**

- [ ] WhatsApp number in `js/config.js`
- [ ] Social media links (add them to the footer partial once real profiles exist)
- [ ] A custom social sharing image per page

## Testing performed

The draft was tested in headless Chromium (Playwright), served over a local web server:

- **Links:** every internal link, asset, script, stylesheet, icon reference and in-page anchor on all 11 pages resolves (1,065 references in total).
- **Layout:** all pages were checked at 320, 360, 390, 768, 1024, 1280, 1440 and 1920px wide. None scroll sideways, there are no console errors or failed requests, and every image and the font load.
- **Accessibility:** axe-core reported no violations of the WCAG 2.0, 2.1 and 2.2 A/AA rules or its best-practice rules, on every page at desktop and mobile widths.
- **Keyboard:**
  - The skip link is the first stop.
  - The mobile menu opens with Enter, keeps focus inside while open, and closes with Escape (focus returns to the button).
  - The desktop Services dropdown works fully by keyboard.
  - FAQ items open and close with Enter and Space.
- **Navigation:** all service cards and pricing CTAs reach the correct pages. The FAQ topic links land clear of the fixed header.
- **Forms, with Formspree's responses simulated:**
  - Empty and invalid input show errors on the right fields.
  - The placeholder endpoint sends nothing.
  - While sending, the button is disabled, so repeated clicks still send only one request.
  - Success, Formspree error responses and network failure each show the right message.
- **SEO:** every page has a unique title and description, a canonical link, Open Graph tags and a single `h1`. `sitemap.xml` is valid and lists all 11 pages.
- **Reduced motion and no JavaScript:** all content stays visible in both cases.
- **Lighthouse 12** (local server, simulated mobile throttling) on the homepage, a service page and the contact page:
  - Performance 99 on mobile and 100 on desktop.
  - Accessibility, Best Practices and SEO all 100.
  - CLS 0 and a total page weight of about 135–160 KB.
  - Results on real hosting and networks will vary.

**Dark mode (26 October 2026):** both themes were checked on all 11 pages at 1280px and 390px. axe-core found no WCAG A/AA or best-practice issues in either theme, there's no sideways scrolling or console errors, and the light theme is pixel-identical to before. The toggle switches theme, updates its label, and keeps the choice across pages; with no saved choice, the site follows the device setting live.

**Not yet tested:** a **live Formspree submission**, which needs a real endpoint, and other browser engines (Safari/WebKit, Firefox).
