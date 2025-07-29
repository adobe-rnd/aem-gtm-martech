:construction: This is an early access technology and is still heavily in development. Reach out to us over Slack before using it.

# AEM Edge Delivery Services Marketing Technology - GA/GTM

he AEM Marketing Technology plugin helps you quickly set up a MarTech stack based on Google Analytics (GA) & Google Tag Manager (GTM) for your AEM project. It is currently available to customers in collaboration with AEM Engineering via co-innovation VIP Projects. To implement your use cases, please reach out to the AEM Engineering team in the Slack channel dedicated to your project.

## Features

The AEM MarTech plugin is essentially a wrapper around the GA4 and GTM Libraries, and that can seamlessley integrate your website with:

- 📊 Google Analytics: to track customer journey data
- 🏷️ Google Tag Manager: to track your custom events

It's key differentiators are:
- 🚀 extremely fast: the library is optimized to reduce load delay, TBT and CLS, and has minimal impact on your Core Web Vitals
- 👤 privacy-first: the library does not track end users by default, and can easily be integrated with your preferred consent management system to open up more advanced use cases


## Preqequisites

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

1. Add preload hints for the dependencies we need to speed up the page load at the end of your `head.html`:
    ```html
    <link rel="preload" as="script" crossorigin="anonymous" href="/plugins/gtm-martech/src/index.js"/>
    <link rel="preconnect" href="https://www.googletagmanager.com"/>
    ```

2. Import the plugin at the top of your `scripts.js` file:
    ```js
    import { GtmMartech } from '../plugins/gtm-martech/src/index.js';
    ```

3. Initialize the plugin, this should be done near the top of your `scripts.js` file, so that the appropriate methods can be called in their respective lifecycle phase.

    ```js
    const { eager, lazy, delayed } = new GtmMartech({
      
      anaytics: /* enable/disable GA4 (default: enabled) */,
      dataLayer: /* enable/disable the DataLayer initialization (default: enabled) */,
      dataLayerInstanceName: /* Name of the DataLayer to use for all events. (default 'gtmDataLayer') */,
      tags: [/* One or more GA4 Measumrent Ids */],
      containers: {
        lazy: [/* Zero or more GTM Container Ids to load during Lazy Phase */],
        lazy: [/* Zero or more GTM Container Ids to load during Delayed Phase */],
      },
      pageMetadata: { /* Metadata to pass on during the intializaton of the GA4 tag */ },
      consent: /* require consent (default: enabled) */,
      consentCallback: /* Function that handles consent processing, if consent is enabled, this must be specified */,
      decorateCallback: /* Function to call on each found or loaded Section/Block */,
    });

    ```
    Note that:
     - If `consent` is enabled, then by default all [consent types](https://developers.google.com/tag-platform/security/concepts/consent-mode#consent-types) will be set to `denied`. 
     - If `consent` is enabled, then a `consentCallback` must be specified. 

4. Update the `loadEager` function, to call plugin's eager phase.

    ```js
    async function loadEager(doc) {
      …
      if (main) {
        decorateMain(main);
        eager();
        doc.body.classList.add('appear');
        await loadSection(main.querySelector('.section'), waitForFirstImage);
      }
      …
    }
    ```

    Note that the `eager()` call is asynchronous, therefore can be added before or after the LCP section. When it is called shoud have no bearing on tracking or performance.

4. Update the `loadLazy` function, to call plugin's lazy phase.

    ```js
    async function loadLazy(doc) {
      …
        await loadSections(main);
        await lazy();
      …
    }
    ```
    Note that the `lazy()` function must be awaited _independently_ for correct handling of the `decorateCallback`. Do not perform other processing (e.g. section loading or dynamic block insertions) simultaneously using `Promise.all()`, otherwise correct decoration may not occur.

5. Update the `loadDelayed` function to call the plugin's delayed phase, after a timeout.

    ```js
    function loadDelayed() {
      …
      window.setTimeout(delayed, 1000);
      window.setTimeout(() => import('./delayed.js'), 3000);
      …
    }
    
    ```

6. If consent is enabled, implement a function to check consent. If the Consent Managment Provider (CMP) does not automatically update Google's consent store, resolve to a state based on user selections. The data structure must conform to the expected [Google consent types](https://developers.google.com/tag-platform/security/concepts/consent-mode#consent-types)

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

7. If desired, implement a `decorateCallback` to add event processing to Sections or Blocks. This function makes a best attempt at finding all Sections & Blocks that are loaded. Each will be passed to the specified function. If some elements are not processed, we recommend you manually monitor and decorate missed elements.

    ```js
    function decorateEvents(el) {
      if (el.classList.contains('block')) {
        // Check type of block and add DataLayer pushes as desired.
      } else if (el.classList.contains('section')) {
        // Do something on each section to push to DataLayer
      }
    }
    ```


## Example Site

An example of this plugin in use can be found on the [AEM GTM Martech demo site](https://main--aem-gtm-martech-site--adobe-rnd.aem.page/).


## FAQ

### The earlies GTM Containers are loaded Lazy. I need the page view data immediately.

While the GTM containers are loaded lazy, the GA4 library is loaded in the eager phase. This loading will send a collection event for a page view. Any custom data passed via the `pageMetadata` configuration property will be passed along with the page view event.

