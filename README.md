:construction: This is an early access technology and is still heavily in development. Reach out to us over Slack before using it.

# AEM Edge Delivery Services Marketing Technology - GA/GTM

The AEM Marketing Technology plugin helps you quickly set up a MarTech stack based on Google Analytics (GA) & Google Tag Manager (GTM) for your AEM project. It is currently available to customers in collaboration with AEM Engineering via co-innovation VIP Projects. To implement your use cases, please reach out to the AEM Engineering team in the Slack channel dedicated to your project.

## Table of Contents 

- [AEM Edge Delivery Services Marketing Technology - GA/GTM](#aem-edge-delivery-services-marketing-technology---gagtm)
  - [Table of Contents](#table-of-contents)
  - [Not a standard GA/GTM install](#not-a-standard-gagtm-install)
  - [How It Works](#how-it-works)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Project Instrumentation](#project-instrumentation)
    - [1. Add Preload Hints](#1-add-preload-hints)
    - [2. Add Martech Helper Script](#2-add-martech-helper-script)
    - [3. Import the Plugin](#3-import-the-plugin)
    - [4. Call Eager Phase Function](#4-call-eager-phase-function)
    - [5. Call the Lazy Phase Function](#5-call-the-lazy-phase-function)
    - [6. Call the Delayed Phase Function](#6-call-the-delayed-phase-function)
    - [7. Handle Consent](#7-handle-consent)
    - [8. Decorate Section & Blocks](#8-decorate-section--blocks)
  - [API Reference](#api-reference)
    - [`new GtmMartech(martechConfig)`](#new-gtmmartechmartechconfig)
    - [`gtmMartech.eager()`](#gtmmartech-eager)
    - [`gtmMartech.lazy()`](#gtmmartech-lazy)
    - [`gtmMartech.delayed()`](#gtmmartech-delayed)
    - [`gtmMartech.pushToDataLayer(payload)`](#gtmmartech-pushtodatalayerpayload)
    - [`gtmMartech.updateUserConsent(consent)`](#gtmmartech-updateuserconsentconsent)
    - [`window.gtag()`](#window-gtag)
  - [An Example Site](#an-example-site)
  - [FAQ](#faq)
    - [What runs at helper import versus in `eager()`?](#what-runs-at-helper-import-versus-in-eager)
    - [How does gtag relate to the data layer?](#how-does-gtag-relate-to-the-data-layer)
    - [Why `gtmMartech` in scripts.js but `new GtmMartech` in the helper?](#why-gtmmartech-in-scriptsjs-but-new-gtmmartech-in-the-helper)
    - [When is the initial page view captured?](#when-is-the-initial-page-view-captured)
    - [How do I use server-side GTM (sGTM) with this plugin?](#how-do-i-use-server-side-gtm-sgtm-with-this-plugin)
    

## Not a standard GA/GTM install

Many teams are used to a **single** install path: paste the GTM container snippet (or one `gtag.js` snippet) in the document head and let that container load Google Analytics and everything else. **This plugin is intentionally different.** It **splits GA4 and GTM across Edge Delivery Services lifecycle phases** so you can **manage performance characteristics**: what runs during early render, what waits until after critical content and work related to Core Web Vitals, and what is deferred further, instead of one early load that tends to pull every tag in at once. That performance-driven split is why the setup diverges from a conventional GA/GTM install; read on so your measurement and GTM configuration align with **when** and **how** each phase runs, and so you avoid duplicate hits or data layer mismatches.

Read this section before you wire GTM workspaces or migrate an existing container.

Putting **everything** in GTM is convenient, but it usually pushes a large amount of work into one early load and costs performance. This plugin expects you to **wire the important pieces in site code** (GA4 via `tags`, consent via the site or `consentCallback`, lifecycle hooks) and use GTM for complementary tags. That split is what keeps loading predictable and measurement aligned with how Edge Delivery runs the page.

- **GA4 is initialized only through this plugin (`tags`).** Always pass your GA4 measurement ID(s) in `tags`. The plugin initializes `gtag`, loads the GA4 library in the **eager** phase, and calls `gtag('config', …)` so baseline measurement (including the initial `page_view`) is not tied to when GTM loads. **Do not** use a GA4 Configuration tag in GTM as the only way to initialize that property: when this plugin is wired correctly, GTM loads in the **lazy** phase, after LCP and other work that is critical for Core Web Vitals, so a GTM-only GA setup would delay first page views and core client-side measurement far beyond what this integration targets. If a GA4 tag for the same measurement ID also runs in GTM, you will double-count. Remove or disable that tag in the container.

- **GTM containers load in phases, not at first paint.** Lazy containers run after main content and work that is critical for Core Web Vitals; delayed containers run later still. **Multiple GTM containers are a normal pattern:** for example, put tags that listen to the data layer and capture first-party measurement events in one container and load it in the **lazy** phase, and put third-party tags (social pixels, widgets, and similar) in another container loaded in the **delayed** phase. Choose lazy versus delayed from how important the data is and how soon those tags need to run. Use GTM for that additional logic; primary GA4 initialization stays in `tags` as above. Tags that assumed “GTM is ready in the first 100 ms” may need retiming or to listen for the data layer events this plugin emits when each phase starts.

- **The data layer name may not be `dataLayer`.** By default the plugin uses `gtmDataLayer` (override with `dataLayerInstanceName`). Your GTM container must be configured to use the **same** name. A workspace built for the default `dataLayer` will not see pushes from this plugin until both sides match.

- **Lifecycle hooks are required.** Besides the script in `head.html`, you must call `gtmMartech.eager()`, `gtmMartech.lazy()`, and optionally `gtmMartech.delayed()` from your project’s `scripts.js` in the right places (`loadEager`, `loadLazy`, `loadDelayed`). Preload hints alone do not run the integration.

- **Consent should be driven from the site, not only from GTM.** With `consent: true`, the plugin sets Google Consent Mode defaults (denied until updated) and expects your `consentCallback` (or CMP) to align with that. Many teams implement consent **only** as tags inside GTM; here, GTM loads in the **lazy** or **delayed** phase, so consent from the container alone can apply **later** than early `gtag` and GA4 activity. Data capture can then look wrong or incomplete. Plan on loading or resolving consent **in the site** (CMP script, banner logic, `consentCallback`) so updates line up with the plugin timeline; GTM can still mirror or extend behavior once containers run.

If you need help mapping an existing GTM workspace to this model, use your project’s Slack channel with AEM Engineering before changing production tags.

## How It Works 

This plugin optimizes the integration of Google's Analytics and Tag Manager tools by moving away from one (or more) large GTM containers. Rather than initializing the loading of several Google libraries & containers via a single GTM request, each is loaded at the ideal time during the AEM Edge Delivery Services render lifecycle.

This is accomplished using a phase-based solution, aligning with the Edge Delivery Services lifecycle phases:
- **Eager**: Handles initializing Google Analytics, including fetching the GA4 script.
- **Lazy**: Loads the first set of the GTM containers that process events, after the main Core Web Vitals (CWV) elements (such as Largest Contentful Paint, LCP) have rendered.
- **Delayed**: Loads any other GTM containers that process non-critical events, such as third-party tags.

By processing the libraries & containers in this sequence, this plugin minimizes the impact to performance, while supporting critical-path event handling. 

## Features

The AEM MarTech plugin is essentially a wrapper around the GA4 and GTM libraries, and can seamlessly integrate your website with:

- 📊 Google Analytics: to track customer journey data
- 🏷️ Google Tag Manager: to track your custom events

Its key differentiators are:
- 🚀 extremely fast: the library is optimized to reduce load delay, TBT and CLS, and has minimal impact on your Core Web Vitals
- 👤 privacy-first: the library does not track end users by default, and can easily be integrated with your preferred consent management system to open up more advanced use cases


## Prerequisites

You need to have access to:
- Google Analytics
- Google Tag Manager

You need to have preconfigured:
- A data stream in Google Analytics
- A Google Tag Manager Workspace

**⚠️ Legal Disclaimer:** This library defaults user consent to `denied`. Setting user consent to `granted` overrides this behavior to grant consent by default (i.e. without explicit end user agreement). Customers should consult with their own legal counsel to understand their privacy obligations and the appropriate use and configuration of this library. We also recommend using a consent management system.

## Installation

Add the plugin to your AEM project by running:
```sh
git subtree add --squash --prefix plugins/gtm-martech git@github.com:adobe-rnd/aem-gtm-martech.git main
```

If you later want to pull the latest changes and update your local copy of the plugin
```sh
git subtree pull --squash --prefix plugins/gtm-martech git@github.com:adobe-rnd/aem-gtm-martech.git main
```

If you prefer using `https` links you'd replace `git@github.com:adobe-rnd/aem-gtm-martech.git` in the above commands by `https://github.com/adobe-rnd/aem-gtm-martech.git`.

If the `subtree pull` command is failing with an error like:
```
fatal: can't squash-merge: 'plugins/martech' was never added
```
you can just delete the folder and re-add the plugin via the `git subtree add` command above.

If you use ESLint at the project level (or equivalent), make sure to update ignore plugin files in your `.eslintignore`:
```
plugins/gtm-martech/*
```

## Project instrumentation

To properly connect and configure the plugin for your project, you'll need to edit both the `head.html` and `scripts.js` in your AEM project and add the following:

### 1. Add Preload Hints

Add the following lines at the end of your `head.html`, to speed up the page load:
```html
<script nonce="aem" src="/scripts/gtm-martech.js" type="module"></script>
<link rel="preload" as="script" crossorigin="anonymous" href="/plugins/gtm-martech/src/index.js"/>
<link rel="preconnect" href="https://www.googletagmanager.com"/>
```

### 2. Add Martech Helper Script

Add a script to encompass the initialization of the plugin. It can be imported wherever you need to run the martech phases.

This is a template file for use, suggested file name is "gtm-martech.js".

```js
// eslint-disable-next-line import/no-relative-packages
import GtmMartech from '../plugins/gtm-martech/src/index.js';

// For DA Preview support.
const disabled = window.location.search.includes('martech=off');

const martech = new GtmMartech({
  analytics: !disabled,
  tags: [/* Required: at least one GA4 measurement ID */],
  containers: {
    lazy: [/* Zero or more GTM Container Ids to load during Lazy Phase */],
    delayed: [/* Zero or more GTM Container Ids to load during Delayed Phase */],
  },
  gtagConfig: { /* Passed to gtag('config', measurementId, …): page fields, transport_url, etc. */ },
  consent: !disabled,
  consentCallback: /* Function that handles consent processing, if consent is enabled, this must be specified */,
  decorateCallback: /* Function to call on each found or loaded Section/Block */,
});

export default martech
```

**`martech=off`:** Add `?martech=off` to the page URL to disable this integration (the sample above turns off `analytics` and `consent` when that flag is present). That pattern exists so measurement does not run where it should not, **especially in AEM Document Authoring (DA) preview**; you can reuse the same query parameter anywhere you need the plugin off.

### 3. Import the plugin

Import the plugin at the top of your `scripts.js` file:
```js
import gtmMartech from './gtm-martech.js';
```

### 4. Call Eager Phase Function

Update the `loadEager` function in your `scripts.js` file, to call plugin's eager phase:

```js
async function loadEager(doc) {
  …
  if (main) {
    decorateMain(main);
    doc.body.classList.add('appear');
    await Promise.all([
      gtmMartech.eager(),
      loadSection(main.querySelector('.section'), waitForFirstImage),
    ]);
  }
  …
}
```

Note that the `eager()` call is asynchronous, therefore can be added before or after the LCP section. We do recommend awaiting it, as future updates (such as personalization support) may require it.


### 5. Call the Lazy Phase Function

Update the `loadLazy` function, to call plugin's lazy phase.

```js
async function loadLazy(doc) {
  …
    await loadSections(main);
    await gtmMartech.lazy();
  …
}
```
Note that the `lazy()` function must be awaited _independently_ for correct handling of the `decorateCallback`. Do not perform other processing (e.g. section loading or dynamic block insertions) simultaneously using `Promise.all()`, otherwise correct decoration may not occur.

### 6. Call the Delayed Phase Function

Update the `loadDelayed` function to call the plugin's delayed phase, after a timeout. If there are no `delayed` GTM Containers, this step is not necessary.

```js
function loadDelayed() {
  …
  window.setTimeout(gtmMartech.delayed, 1000);
  window.setTimeout(() => import('./delayed.js'), 3000);
  …
}
```

### 7. Handle Consent

Consent tags that run **only** inside GTM load with the **lazy** or **delayed** container, which is often later than consent must be known for correct capture alongside eager GA4. Prefer a CMP or site-level flow that integrates with `consentCallback` (and thus `gtag` consent updates) rather than relying on GTM as the sole source of consent.

If consent is enabled, implement a function to check consent. If the Consent Management Provider (CMP) does not automatically update Google's consent store, resolve to a state based on user selections. The data structure must conform to the expected [Google consent types](https://developers.google.com/tag-platform/security/concepts/consent-mode#consent-types)

```js
async function checkConsent() {
  return new Promise((resolve) => {
    // Perform the Consent popup check here.
    // Not using a CMP, therefore we must resolve to the desired Consent State.

    resolve({
      ad_storage: /* granted or denied */,
      ad_user_data: /* granted or denied */,
      ad_personalization: /* granted or denied */,
      analytics_storage: /* granted or denied */,
      functionality_storage: /* granted or denied */,
      personalization_storage: /* granted or denied */,
      security_storage: /* granted or denied */,
    });
  });
}
```

### 8. Decorate Section & Blocks

If desired, implement a `decorateCallback` to add event processing to Sections or Blocks. This function makes a best attempt at finding all Sections & Blocks that are loaded. Each will be passed to the specified function. If some elements are not processed, we recommend you manually monitor and decorate missed elements.

```js
function decorateEvents(el) {
  if (el.classList.contains('block')) {
    // Check type of block and add DataLayer pushes as desired.
  } else if (el.classList.contains('section')) {
    // Do something on each section to push to DataLayer
  }
}
```

## API Reference

This plugin exports several functions to manage the marketing libraries:

--- 

### `new GtmMartech(martechConfig)`

Initializes the plugin. This should be called in the `scripts.js` outside any lifecycle phase.

- **`martechConfig`** `{Object}`: Configuration for this plugin.
  - `analytics` `{Boolean}`: When `false`, skips loading GA4 (`eager`) and GTM (`lazy` / `delayed`). Same flag for both. Default: `true`.
  - `dataLayerInstanceName` `{String}`: Global name for the GTM Data Layer instance. Default: `'gtmDataLayer'`.
  - `tags` `{String[]}`: **Required.** At least one GA4 measurement ID; loaded in **eager**. Do not use GTM as the **only** GA4 initializer for the same IDs (GTM is lazy/delayed). See [Not a standard GA/GTM install](#not-a-standard-gagtm-install).
  - `containers` `{Object|String[]|String}`: Configuration for GTM Containers, or an Array of GTM Container Ids to load during the lazy phase, or a single GTM Container Id to load during the lazy phase.
    - `lazy` `{String[]}`: Array of GTM Container Ids to load in the lazy phase.
    - `delayed` `{String[]}`: Array of GTM Container Ids to load in the delayed phase.
  - `gtagConfig` `{Object}`: Passed as the third argument to `gtag('config', measurementId, gtagConfig)` for each ID in `tags` (any fields [Google documents for GA4 `gtag('config')`](https://developers.google.com/analytics/devguides/collection/ga4/reference/config), e.g. `page_title`, `transport_url`). Default: `{}`.
  - `pageMetadata` `{Object}`: **Deprecated.** Alias for `gtagConfig` **input only**. If both are set, `gtagConfig` wins (with a console warning). The resolved object used for `gtag('config', …)` is only **`gtagConfig`** on the instance; do not read `instance.config.pageMetadata` as the effective config.
  - `consent` `{Boolean}`: Enable consent. Default: `true`
  - `consentCallback` `{Function|undefined}`: A function that will perform consent validation. Returns a promise that resolves to an object, which will be passed to the GA for update.
  - `decorateCallback` `{Function}`: A function that can decorate HTML elements for events. Passed all sections & blocks found.

---

### `gtmMartech.eager()`
Performs the eager phase operations for the plugin.

---

### `gtmMartech.lazy()`
Performs the lazy phase operations for the plugin.

---

### `gtmMartech.delayed()`
Performs the delayed phase operations for the plugin.

---

### `gtmMartech.pushToDataLayer(payload)`
Pushes a generic payload to the plugin’s data layer array (default global name `gtmDataLayer`, or the name set in `dataLayerInstanceName`).

- **`payload`** `{Object}`: The data object to push.

---

### `gtmMartech.updateUserConsent(consent)`
Updates the consent according to the [gtag.js implementation](https://developers.google.com/tag-platform/security/guides/consent?consentmode=advanced#implementation_example)

- **`consent`** `{Object}`: An object detailing user consent choices.

---

### `window.gtag()`
On initialization, this Plugin will define the `window.gtag` function according to the [GA Documentation](https://developers.google.com/tag-platform/gtagjs#add_the_google_tag_to_your_website).


## An Example Site

An example of this plugin in use can be found on the [AEM GTM Martech demo site](https://main--aem-gtm-martech-site--adobe-rnd.aem.page/).


## FAQ

### What runs at helper import versus in `eager()`?

Running `new GtmMartech(...)` when the helper module loads sets up the named data layer, defines `window.gtag`, applies consent defaults when `consent` is enabled, and queues `gtag('config', measurementId, gtagConfig)` for each measurement ID (from your `gtagConfig` option). `eager()` loads the GA4 `gtag/js` script from Google so those queued calls can execute. Activity in the console before `eager()` resolves is normal.

### How does gtag relate to the data layer?

`window.gtag` pushes onto the same array GTM uses: `window[dataLayerInstanceName]` (default `gtmDataLayer`), matching the `&l=` parameter on the GTM script URL.

### Why `gtmMartech` in scripts.js but `new GtmMartech` in the helper?

The **plugin** (`plugins/gtm-martech/src/index.js`) default-exports the **`GtmMartech` class**. Your **`gtm-martech.js`** helper imports that class, constructs `new GtmMartech({...})`, and default-exports the **instance**. In **`scripts.js`**, import that instance (for example `import gtmMartech from './gtm-martech.js'`) and call `gtmMartech.eager()`. Avoid naming the instance `GtmMartech`; it is easy to mistake for the class.

### When is the initial page view captured?

All GA4 scripts are imported to the page during the Eager Phase. During this process a `page_view` event occurs, which includes fields from your `gtagConfig` (or deprecated `pageMetadata`) passed at construction. This `page_view` event will be dispatched as soon as the Google library decides it should be sent, regardless of when any other phase's GTM libraries are loaded.

### How do I use server-side GTM (sGTM) with this plugin?

Server-side GTM is a **tagging server** (usually on Google Cloud) that receives requests from the browser and forwards to GA4 and other vendors. This plugin does not host that server; you deploy and configure it using [Google’s server-side tagging documentation](https://developers.google.com/tag-platform/tag-manager/server-side).

For **GA4 loaded through this plugin** (`tags` + `eager()`), set your tagging server origin on the client by including **`transport_url`** in **`gtagConfig`** (HTTPS URL Google documents for your setup, typically your first-party tagging endpoint). That object is passed straight into `gtag('config', measurementId, gtagConfig)`, so the GA4 library can send hits via your server.

You still load **web** GTM containers in **`lazy` / `delayed`** as today. GA4 **tags inside those containers** must be configured separately to use the same server endpoint where required; otherwise the browser may still send some hits directly. Avoid configuring **two independent client paths** for the same event and same GA4 property (double counting is a workspace/configuration issue, not introduced by the plugin’s phases).
