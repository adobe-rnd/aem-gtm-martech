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
/* eslint-disable no-unused-vars, no-unused-expressions */

import { expect } from 'chai';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';
import GtmMartech from '../src/index.js';

const MEASUREMENT_ID_1 = 'GA_MEASUREMENT_ID_1';
const MEASUREMENT_ID_2 = 'GA_MEASUREMENT_ID_2';

describe('GtmMartech constructor', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Create a new JSDOM instance for each test
    dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
    });

    document = dom.window.document;
    window = dom.window;

    // Mock the global window and document
    global.window = window;
    global.document = document;
    global.Node = window.Node;
  });

  afterEach(() => {
    // Clean up
    delete global.window;
    delete global.document;
    delete global.Node;
  });

  describe('configuration', () => {
    it('should initialize with default configuration', async () => {
      // Spy on console.assert to check for the assertion when no tags are provided
      const consoleAssertSpy = sinon.spy(console, 'assert');

      // Create GtmMartech instance with no configuration
      const gtmMartech = new GtmMartech();

      // Verify that the assertion was logged for no GA4 tag
      sinon.assert.calledWith(consoleAssertSpy, false, 'No GA4 tag provided.');
      consoleAssertSpy.restore();

      // Verify default configuration is applied
      expect(gtmMartech.config.analytics).to.be.true;
      expect(gtmMartech.config.dataLayerInstanceName).to.equal('gtmDataLayer');
      expect(gtmMartech.config.tags).to.deep.equal([]);
      expect(gtmMartech.config.containers).to.deep.equal({ lazy: [], delayed: [] });
      expect(gtmMartech.config.pageMetadata).to.deep.equal({});
      expect(gtmMartech.config.consent).to.be.true;

      // Verify gtag function is available
      expect(window.gtag).to.be.a('function');

      // Verify that gtag calls were made during initialization
      // Since no tags are provided, only consent and js calls should be made
      expect(window.gtmDataLayer).to.be.an('array');
      expect(window.gtmDataLayer).to.have.length(2); // consent + js calls

      // Verify consent call
      const consentEntry = window.gtmDataLayer[0];
      expect(consentEntry[0]).to.equal('consent');
      expect(consentEntry[1]).to.equal('default');

      // Verify js call
      const jsEntry = window.gtmDataLayer[1];
      expect(jsEntry[0]).to.equal('js');
      expect(jsEntry[1]).to.be.instanceof(Date);
    });

    it('should handle analytics disabled configuration', async () => {
      // Create GtmMartech instance with analytics disabled
      const gtmMartech = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
        analytics: false,
      });

      // Verify that analytics is disabled
      expect(gtmMartech.config.analytics).to.be.false;
    });

    it('should handle string tag input', async () => {
      // Test string tag input
      const stringTagGtm = new GtmMartech({ tags: MEASUREMENT_ID_1 });
      expect(stringTagGtm.config.tags).to.deep.equal([MEASUREMENT_ID_1]);
    });

    it('should handle multiple tags', async () => {
      // Test multiple tags
      const multipleTagsGtm = new GtmMartech({ tags: [MEASUREMENT_ID_1, MEASUREMENT_ID_2] });
      expect(multipleTagsGtm.config.tags).to.deep.equal([MEASUREMENT_ID_1, MEASUREMENT_ID_2]);
    });

    it('should handle empty tags array', async () => {
      // Test empty tags array
      const consoleAssertSpy = sinon.spy(console, 'assert');
      const emptyTagsGtm = new GtmMartech({ tags: [] });
      expect(emptyTagsGtm.config.tags).to.deep.equal([]);
      sinon.assert.calledWith(consoleAssertSpy, false, 'No GA4 tag provided.');
      consoleAssertSpy.restore();
    });

    it('should handle array of tags with additional verification', async () => {
      // Test array of tags with additional verification
      const arrayTagsGtm = new GtmMartech({ tags: [MEASUREMENT_ID_1, MEASUREMENT_ID_2] });
      expect(arrayTagsGtm.config.tags).to.be.an('array');
      expect(arrayTagsGtm.config.tags).to.have.length(2);
      expect(arrayTagsGtm.config.tags).to.deep.equal([MEASUREMENT_ID_1, MEASUREMENT_ID_2]);
    });

    it('should handle string container input', async () => {
      // Test string container input
      const stringContainerGtm = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
        containers: 'GTM-XXXXXXX',
      });
      expect(stringContainerGtm.config.containers).to.deep.equal({
        lazy: ['GTM-XXXXXXX'],
        delayed: [],
      });
    });

    it('should handle array containers input', async () => {
      // Test array containers input
      const arrayContainerGtm = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
        containers: ['GTM-XXXXXXX', 'GTM-YYYYYYY'],
      });
      expect(arrayContainerGtm.config.containers).to.deep.equal({
        lazy: ['GTM-XXXXXXX', 'GTM-YYYYYYY'],
        delayed: [],
      });
    });

    it('should handle object containers input', async () => {
      // Test object containers input
      const objectContainerGtm = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
        containers: {
          lazy: ['GTM-XXXXXXX'],
          delayed: ['GTM-YYYYYYY'],
        },
      });
      expect(objectContainerGtm.config.containers).to.deep.equal({
        lazy: ['GTM-XXXXXXX'],
        delayed: ['GTM-YYYYYYY'],
      });
    });
  });

  describe('datalayer context', () => {
    describe('when datalayer is enabled', () => {
      it('should initialize default data layer', async () => {
        // Create GtmMartech instance
        const gtmMartech = new GtmMartech({
          tags: [MEASUREMENT_ID_1],
        });

        // Verify that data layer was initialized
        expect(window.gtmDataLayer).to.be.an('array');
        expect(window.gtag).to.be.a('function');

        // Verify that gtag consent default was called (should be first entry)
        expect(window.gtmDataLayer).to.have.length.greaterThan(0);
        const consentEntry = window.gtmDataLayer[0];
        expect(consentEntry[0]).to.equal('consent');
        expect(consentEntry[1]).to.equal('default');

        // Verify that gtag js was called in constructor (should be second entry)
        expect(window.gtmDataLayer).to.have.length.greaterThan(1);
        const jsEntry = window.gtmDataLayer[1];
        expect(jsEntry[0]).to.equal('js');
        expect(jsEntry[1]).to.be.instanceof(Date);

        // Verify that gtag config was called for the tag (should be third entry)
        expect(window.gtmDataLayer).to.have.length.greaterThan(2);
        const configEntry = window.gtmDataLayer[2];
        expect(configEntry[0]).to.equal('config');
        expect(configEntry[1]).to.equal(MEASUREMENT_ID_1);

        // Verify that data pushed to gtag is stored in the data layer
        window.gtag('event', 'test_event', { event_category: 'test' });
        expect(window.gtmDataLayer).to.have.length.greaterThan(3);

        // The gtag function pushes the arguments object to the data layer
        const lastEntry = window.gtmDataLayer[window.gtmDataLayer.length - 1];
        expect(lastEntry[0]).to.equal('event');
        expect(lastEntry[1]).to.equal('test_event');
        expect(lastEntry[2]).to.deep.equal({ event_category: 'test' });
      });

      it('should initialize custom data layer when specified', async () => {
        // Create GtmMartech instance with custom data layer name
        const gtmMartech = new GtmMartech({
          tags: [MEASUREMENT_ID_1],
          dataLayerInstanceName: 'customDataLayer',
        });

        // Verify that custom data layer was initialized
        expect(window.customDataLayer).to.be.an('array');
        expect(window.gtag).to.be.a('function');

        // Verify that data pushed to gtag is stored in the custom data layer
        window.gtag('event', 'test_event', { event_category: 'test' });
        const lastEntry = window.customDataLayer[window.customDataLayer.length - 1];
        expect(lastEntry[0]).to.equal('event');
        expect(lastEntry[1]).to.equal('test_event');
      });

      it('should handle custom data layer instance name configuration', async () => {
        // Create GtmMartech instance with custom data layer name
        const gtmMartech = new GtmMartech({
          tags: [MEASUREMENT_ID_1],
          dataLayerInstanceName: 'customDataLayer',
        });

        // Verify that custom data layer name is set
        expect(gtmMartech.config.dataLayerInstanceName).to.equal('customDataLayer');
      });
    });
  });
});
