/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Default configuration for the plugin.
 * @typedef {Object} GTMMartechConfig
 * @property {Boolean} analytics Whether to initialize analytics
 * @property {Boolean} dataLayer Whether to initialize the data layer
 * @property {String} dataLayerInstanceName The name of the data ayer instance in the global scope
 *                                          (defaults to "gtmDataLayer")
 * @property {Array<String>|String} tags The GA4 tags to initialize
 * @property {Objetct|Array<String>|String} containers GTM containers to load during specified phases.
 *                                                    If an array or string is provided, the container(s)
 *                                                    will be loaded during the lazy phase.
 * @property {Array<String>} containers.lazy The GTM containers to load during the lazy phase (defaults to empty list)
 * @property {Array<String>} containers.delayed The GTM containers to load during the delayed phase (defaults to empty list)
 * @property {Object} pageMetadata The page metadata to push to the data layer during the eager phase
 * @property {Boolean} consent Whether consent is required, if true all tracking is defaulted to 'denied'
 * @property {Function<Promise<Object>>|undefined} consentCallback A function that will prompt the visitor for consent.
 *                                    If the CMP does not automaically update the Google Consent config object,
 *                                    this function should return a new consent config object.
 * @property {Function<void>} decorateCallback A function that will be called on each section & block load, to allow for decoration
 *                                    of DataLayer events. The function will be passed all section or block elements found.
 */

let gtm; // instance of GtmMartech for backref

const DEFAULT_CONFIG = Object.freeze({
  analytics: true,
  dataLayer: true,
  dataLayerInstanceName: 'gtmDataLayer',
  tags: [],
  containers: {
    lazy: [],
    delayed: [],
  },
  pageMetadata: {},
  consent: true,
  consentCallback: () => undefined,
  decorateCallback: () => undefined,
});

const DEFAULT_CONSENT = Object.freeze({
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'denied',
  wait_for_update: 500,
});

/**
 * Push a payload to the data layer
 *
 * @param {Object} payload The payload to push to the data layer
 */
function pushToDataLayer(payload) {
  // eslint-disable-next-line no-console
  console.assert(gtm, 'GtmMartech is not initialized');
  // eslint-disable-next-line no-console
  console.assert(gtm.config.dataLayer, 'Data layer is disabled in the martech config');
  gtm.dataLayer.push(payload);
}

/**
 * Initialize the data layer
 *
 * @param {String} instanceName The name of the data layer instance in the global scope
 * @returns {Array} The data layer instance
 */
function initDataLayer(instanceName) {
  window.gtag = () => {
    // eslint-disable-next-line no-console
    console.assert(gtm.config.dataLayer, 'Data layer is disabled in the martech config');
    // eslint-disable-next-line prefer-rest-params
    window[instanceName].push(arguments);
  };

  // eslint-disable-next-line no-console
  console.assert(gtm.config.dataLayer, 'Data layer is disabled in the martech config');
  window[instanceName] = window[instanceName] || [];
  return window[instanceName]; // return it so plugin can reference directly
}

/**
 * Initialize GA4 tags.
 *
 * @param {String} instanceName the name of the data layer instance in the global scope
 * @param {Array<String>} tags the GA4 tags to initialize
 */
function initGa4(instanceName, tags) {
  // eslint-disable-next-line no-console
  console.assert(gtm.config.analytics, 'Analytics is disabled in the martech config');
  tags.forEach((tag) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${tag}&l=${instanceName}`;
    document.head.appendChild(script);
  });
}

/**
 * Load GTM containers for the specified phase.
 *
 * @param {String} phase the phase to load
 */
function loadGTM(phase) {
  // eslint-disable-next-line no-console
  console.assert(gtm.config.analytics, 'Analytics is disabled in the martech config');
  if (gtm.config.containers[phase]?.length > 0) {
    pushToDataLayer({ event: 'gtm.js', [`gtm.${phase}.start`]: new Date().getTime() });

    gtm.config.containers[phase].forEach((container) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${container}&l=${gtm.config.dataLayerInstanceName}`;
      document.head.appendChild(script);
    });
  }
}

/**
 * Observe for Section & Block elements so projects can decorate with DataLayer events.
 *
 * @param {Function} fn the function to call for each found section or block
 */
function observeElements(fn) {
  // Protect against double decoration
  const decorate = (el) => {
    if (el.dataset.gtnMartechDecorated) return;
    el.dataset.gtmMartechDecorated = true;
    fn(el);
  };

  const opts = {
    subtree: true,
    attributes: true,
    attributeFilter: ['data-block-status', 'data-section-status'],
  };

  // To ensure everything gets decorated, observe first, then call the callback for any already loaded elements

  // Observer for loading of Section & Block elements
  const loadingObserver = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.target.dataset.blockStatus === 'loaded'
        || m.target.dataset.sectionStatus === 'loaded') {
        decorate(m.target);
      }
    });
  });
  loadingObserver.observe(document.querySelector('main'), opts);

  // Observer for added Section & Block elements
  const addedObserver = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        loadingObserver.observe(node, opts);
        node.querySelectorAll('[data-block-status="loaded"],[data-section-status="loaded"]').forEach(decorate);
        node.querySelectorAll('.fragment-wrapper').forEach((el) => {
          addedObserver.observe(el, { childList: true });
        });
      });
    });
  });

  // Watch these for new Section & Block elements
  document.querySelectorAll('body, header, footer, main, .fragment-wrapper').forEach((el) => {
    addedObserver.observe(el, { childList: true });
  });

  // Decorate any already loaded Section & Block elements
  document.querySelectorAll('[data-block-status="loaded"],[data-section-status="loaded"]').forEach(decorate);
}

/**
 * GTM Martech plugin.
 *
 * @typedef {Object} GtmMartech

* @function eager Operations to perform during the eager phase
 * @function lazy Operations to perform during the lazy phase
 * @function delayed Operations to perform during the delayed phase
 */
class GtmMartech {
  /**
   * Create a new GtmMartech instance.
   * @param {GTMMartechConfig} martechConfig
   */
  constructor(martechConfig) {
    gtm = this;

    // Fix any missing or invalid config values.
    if (typeof martechConfig.tags === 'string') {
      martechConfig.tags = [martechConfig.tags];
    }
    if (typeof martechConfig.containers === 'string') {
      martechConfig.containers = { lazy: [martechConfig.containers], delayed: [] };
    } else if (Array.isArray(martechConfig.containers)) {
      martechConfig.containers = { lazy: martechConfig.containers, delayed: [] };
    }

    // eslint-disable-next-line no-console
    console.assert(martechConfig.tags.length > 0, 'No GA4 tag provided.');

    this.config = { ...DEFAULT_CONFIG, ...martechConfig };
    this.dataLayer = initDataLayer(this.config.dataLayerInstanceName);

    // Default consent, if specified
    if (this.config.consent) {
      window.gtag('consent', 'default', DEFAULT_CONSENT);
    }

    window.gtag('js', new Date());
    this.config.tags.forEach((tag) => {
      window.gtag('config', tag, this.config.pageMetadata);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async eager() {
    // Load the GA4 tag(s)
    initGa4(gtm.config.dataLayerInstanceName, gtm.config.tags);
  }

  // eslint-disable-next-line class-methods-use-this
  async lazy() {
    // Update consent, if specified
    if (gtm.config.consent) {
      gtm.config.consentCallback().then((updatedConsent) => {
        if (updatedConsent) window.gtag('consent', 'update', updatedConsent);
      }); 
    }
    // Load the lazy GTM containers
    loadGTM('lazy');
    if (gtm.config.decorateCallback) {
      observeElements(gtm.config.decorateCallback);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async delayed() {
    // Load the delayed GTM containers
    loadGTM('delayed');
  }
}

export { GtmMartech, pushToDataLayer };
