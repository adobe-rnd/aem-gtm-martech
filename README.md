:construction: This is an early access technology and is still heavily in development. Reach out to us over Slack before using it.

# AEM Edge Delivery Services Marketing Technology - GA/GTM

The AEM Marketing Technology plugin helps you quickly set up a MarTech stack based on Google Analytics (GA) & Google Tag Manager (GTM) for your AEM project. It is currently available to customers in collaboration with AEM Engineering via co-innovation VIP Projects. To implement your use cases, please reach out to the AEM Engineering team in the Slack channel dedicated to your project.

## Table of Contents 

- [AEM Edge Delivery Services Marketing Technology - GA/GTM](#aem-edge-delivery-services-marketing-technology---gagtm)
  - [Table of Contents](#table-of-contents)
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
    - [We need the page view data immediately, when is it captured?](#we-need-the-page-view-data-immediately-when-is-it-captured)
    - [We also use the AEM Martech Plugin, won't there be dataLayer conflicts?](#we-also-use-the-aem-martech-plugin-wont-there-be-datalayer-conflicts)
    

## How It Works 

This plugin optimizes the integration of Google's Analytics and Tag Manager tools by moving away from one (or more) large GTM containers. Rather than intializing the loading of several Google libraries & containers via a single GTM request, each is loaded at the ideal time during the AEM Edge Delivery Services render lifecycle.

This is accomplished using a phase-based solution, aligning with the Edge Delivery Services lifecycle phases:
- **Eager**: Handles initializing Google Analytics, including fetching the GA4 script.
- **Lazy**: Loads the first set of the GTM containers that process events, after the main Core Web Vitals (CWV) elements (such as Largest Contentful Paint, LCP) have rendered.
- **Delayed**: Loads any other GTM containers that process non-critical events, such as third-party tags.

By processing the libraries & containers in this sequence, this plugin minimizes the impact to performance, while supporting critical-path event handling. 

## Features

The AEM MarTech plugin is essentially a wrapper around the GA4 and GTM Libraries, and that can seamlessley integrate your website with:

- 📊 Google Analytics: to track customer journey data
- 🏷️ Google Tag Manager: to track your custom events

It's key differentiators are:
- 🚀 extremely fast: the library is optimized to reduce load delay, TBT and CLS, and has minimal impact on your Core Web Vitals
- 👤 privacy-first: the library does not track end users by default, and can easily be integrated with your preferred consent management system to open up more advanced use cases


## Prerequisites

You need to have access to:
- Google Analytics
- Google Tag Manager

You need to have preconfigured:
- A data stream in Google Analtyics
- A Google Tag Manager Workspace

We also recommend using a proper consent management system.


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

If you use some ELint at the project level (or equivalent), make sure to update ignore plugin files in your `.eslintignore`:
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

Add a script to encompass the intialization of the plugin. This will can be used to import in any context necessary to peform the different operations.

This is a template file for use, suggested file name is "gtm-martech.js".

```js
// eslint-disable-next-line import/no-relative-packages
import GtmMartech from '../plugins/gtm-martech/src/index.js';

// For DA Preview support.
const disabled = window.location.search.includes('martech=off');

const martech = new GtmMartech({
  analytics: !disabled,
  tags: [/* One or more GA4 Measumrent Ids */],
  containers: {
    lazy: [/* Zero or more GTM Container Ids to load during Lazy Phase */],
    delayed: [/* Zero or more GTM Container Ids to load during Delayed Phase */],
  },
  pageMetadata: { /* Metadata to pass on during the intializaton of the GA4 tag */ },
  consent: !disabled,
  consentCallback: /* Function that handles consent processing, if consent is enabled, this must be specified */,
  decorateCallback: /* Function to call on each found or loaded Section/Block */,
});

export default martech
```

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
  window.setTimeout(() => gtmMartech.delayed(), 1000);
  window.setTimeout(() => import('./delayed.js'), 3000);
  …
}
```

### 7. Handle Consent

If consent is enabled, implement a function to check consent. If the Consent Managment Provider (CMP) does not automatically update Google's consent store, resolve to a state based on user selections. The data structure must conform to the expected [Google consent types](https://developers.google.com/tag-platform/security/concepts/consent-mode#consent-types)

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
  - `analytics` `{Boolean}`: Enable analytics. Default: `true`.
  - `dataLayerInstanceName` `{String}`: Global name for the GTM Data Layer instance. Default: `'gtmDataLayer'`.
  - `tags` `{String[]}`: Array of GA4 Measurement Ids to load.
  - `containers` `{Object|String[]|String}`: Configuration for GTM Containers, or an Array of GTM Container Ids to load during the lazy phase, or a single GTM Container Id to load during the lazy phase.
    - `lazy` `{String[]}`: Array of GTM Container Ids to load in the lazy phase.
    - `delayed` `{String[]}`: Array of GTM Container Ids to load in the delayed phase.
  - `pageMetadata` `{Object}`: A set of key-value pairs to pass to the GA4 tag initializer.
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
Pushes a generic payload to the Adobe Client Data Layer.

- **`payload`** `{Object}`: The data object to push.

---

### `gtmMartech.updateUserConsent(consent)`
Updates the consent according to the []`gtag.js` implementation](https://developers.google.com/tag-platform/security/guides/consent?consentmode=advanced#implementation_example)

- **`consent`** `{Object}`: An object detailing user consent choices.

---

### `window.gtag()`
On initialization, this Plugin will define the `window.gtag` function according to the [GA Documentation](https://developers.google.com/tag-platform/gtagjs#add_the_google_tag_to_your_website).


## An Example Site

An example of this plugin in use can be found on the [AEM GTM Martech demo site](https://main--aem-gtm-martech-site--adobe-rnd.aem.page/).


## FAQ

### We need the page view data immediately, when is it captured?

All GA4 scripts are imported to the page during the Eager Phase. During this process a `page_view` event occurs, which includes any custom metadata provided to during plugin initialization. This `page_view` event will be dispatched as soon as the Google library decides it should be sent, regardless of when any other phase's GTM libraries are loaded.

### We also use the [AEM Martech Plugin](https://github.com/adobe-rnd/aem-martech), won't there be `dataLayer` conflicts?

No. Both of these plugins use a different default data layer on the global `window` context. Unless you specifically provide the same name to each plugin's `dataLayerInstanceName` configuration parameter, they will be separate.
