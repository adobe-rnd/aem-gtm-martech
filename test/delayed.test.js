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
import { TestSetup, TEST_CONSTANTS, createGtmMartech } from './helpers/setup.js';

describe('GtmMartech delayed function', () => {
  let testSetup;
  let consoleWarnSpy;

  beforeEach(() => {
    testSetup = new TestSetup();
    const setup = testSetup.setupWithConsoleWarn();
    consoleWarnSpy = setup.consoleWarnSpy;
  });

  afterEach(() => {
    testSetup.cleanup();
  });

  describe('GTM container loading', () => {
    it('should load delayed GTM containers', async () => {
      // Create GtmMartech instance with delayed containers
      const gtmMartech = createGtmMartech({
        containers: {
          lazy: [],
          delayed: [TEST_CONSTANTS.GTM_CONTAINER_1, TEST_CONSTANTS.GTM_CONTAINER_2],
        },
      });

      // Call the delayed function
      await gtmMartech.delayed();

      // Verify GTM scripts were loaded
      const script1 = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      const script2 = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_2}"]`);

      expect(script1).to.exist;
      expect(script2).to.exist;
      expect(script1.src).to.include('googletagmanager.com/gtm.js');
      expect(script2.src).to.include('googletagmanager.com/gtm.js');
    });

    it('should not load GTM containers when analytics is disabled', async () => {
      // Create GtmMartech instance with analytics disabled
      const gtmMartech = createGtmMartech({
        analytics: false,
        containers: {
          lazy: [],
          delayed: [TEST_CONSTANTS.GTM_CONTAINER_1],
        },
      });

      // Call the delayed function
      await gtmMartech.delayed();

      // Verify warning was logged
      sinon.assert.calledWith(consoleWarnSpy, 'Analytics is disabled in the martech config');

      // Verify no GTM scripts were loaded
      const script = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      expect(script).to.not.exist;
    });

    it('should not load GTM containers when delayed containers array is empty', async () => {
      // Create GtmMartech instance with empty delayed containers
      const gtmMartech = createGtmMartech({
        containers: {
          lazy: [TEST_CONSTANTS.GTM_CONTAINER_1],
          delayed: [],
        },
      });

      // Call the delayed function
      await gtmMartech.delayed();

      // Verify no GTM scripts were loaded
      const script = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      expect(script).to.not.exist;
    });

    it('should not load containers when provided as string (they go to lazy phase)', async () => {
      // Create GtmMartech instance with containers as string
      const gtmMartech = createGtmMartech({
        containers: TEST_CONSTANTS.GTM_CONTAINER_1,
      });

      // Call the delayed function
      await gtmMartech.delayed();

      // Verify GTM script was NOT loaded (string containers go to lazy phase)
      const script = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      expect(script).to.not.exist;
    });

    it('should not load containers when provided as array (they go to lazy phase)', async () => {
      // Create GtmMartech instance with containers as array
      const gtmMartech = createGtmMartech({
        containers: [TEST_CONSTANTS.GTM_CONTAINER_1, TEST_CONSTANTS.GTM_CONTAINER_2],
      });

      // Call the delayed function
      await gtmMartech.delayed();

      // Verify GTM scripts were NOT loaded (array containers go to lazy phase)
      const script1 = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      const script2 = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_2}"]`);
      expect(script1).to.not.exist;
      expect(script2).to.not.exist;
    });

    it('should not duplicate GTM scripts if delayed is called multiple times', async () => {
      // Create GtmMartech instance
      const gtmMartech = createGtmMartech({
        containers: {
          lazy: [],
          delayed: [TEST_CONSTANTS.GTM_CONTAINER_1],
        },
      });

      // Call the delayed function twice
      await gtmMartech.delayed();
      await gtmMartech.delayed();

      // Verify only one script was loaded (no duplicates)
      const scripts = document.querySelectorAll(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      expect(scripts).to.have.length(1);
    });

    it('should load only delayed containers, not lazy containers', async () => {
      // Create GtmMartech instance with both lazy and delayed containers
      const gtmMartech = createGtmMartech({
        containers: {
          lazy: [TEST_CONSTANTS.GTM_CONTAINER_1],
          delayed: [TEST_CONSTANTS.GTM_CONTAINER_2],
        },
      });

      // Call the delayed function
      await gtmMartech.delayed();

      // Verify only delayed container script was loaded
      const lazyScript = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      const delayedScript = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_2}"]`);

      expect(lazyScript).to.not.exist;
      expect(delayedScript).to.exist;
    });
  });

  describe('data layer events', () => {
    it('should push gtm.delayed.start event to data layer', async () => {
      // Create GtmMartech instance with delayed containers
      const gtmMartech = createGtmMartech({
        containers: {
          lazy: [],
          delayed: [TEST_CONSTANTS.GTM_CONTAINER_1],
        },
      });

      const initialLength = window.gtmDataLayer.length;

      // Call the delayed function
      await gtmMartech.delayed();

      // Verify gtm.delayed.start event was pushed to data layer
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);

      const lastEntry = window.gtmDataLayer[window.gtmDataLayer.length - 1];
      expect(lastEntry.event).to.equal('gtm.js');
      expect(lastEntry['gtm.delayed.start']).to.be.a('number');
    });

    it('should not push data layer event when no delayed containers', async () => {
      // Create GtmMartech instance with no delayed containers
      const gtmMartech = createGtmMartech({
        containers: {
          lazy: [TEST_CONSTANTS.GTM_CONTAINER_1],
          delayed: [],
        },
      });

      const initialLength = window.gtmDataLayer.length;

      // Call the delayed function
      await gtmMartech.delayed();

      // Verify no additional data layer event was pushed
      expect(window.gtmDataLayer).to.have.length(initialLength);
    });

    it('should not push data layer event when analytics is disabled', async () => {
      // Create GtmMartech instance with analytics disabled
      const gtmMartech = createGtmMartech({
        analytics: false,
        containers: {
          lazy: [],
          delayed: [TEST_CONSTANTS.GTM_CONTAINER_1],
        },
      });

      const initialLength = window.gtmDataLayer.length;

      // Call the delayed function
      await gtmMartech.delayed();

      // Verify no additional data layer event was pushed
      expect(window.gtmDataLayer).to.have.length(initialLength);
    });
  });

  describe('script attributes', () => {
    it('should load GTM scripts with correct attributes', async () => {
      // Create GtmMartech instance
      const gtmMartech = createGtmMartech({
        containers: {
          lazy: [],
          delayed: [TEST_CONSTANTS.GTM_CONTAINER_1],
        },
      });

      // Call the delayed function
      await gtmMartech.delayed();

      // Verify script attributes
      const script = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      expect(script).to.exist;
      expect(script.src).to.include('googletagmanager.com/gtm.js');
      expect(script.src).to.include(`id=${TEST_CONSTANTS.GTM_CONTAINER_1}`);
      expect(script.src).to.include('l=gtmDataLayer');
      expect(script.getAttribute('async')).to.equal('true');
    });

    it('should use custom data layer instance name in script URL', async () => {
      // Create GtmMartech instance with custom data layer name
      const gtmMartech = createGtmMartech({
        dataLayerInstanceName: 'customDataLayer',
        containers: {
          lazy: [],
          delayed: [TEST_CONSTANTS.GTM_CONTAINER_1],
        },
      });

      // Call the delayed function
      await gtmMartech.delayed();

      // Verify script uses custom data layer name
      const script = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      expect(script).to.exist;
      expect(script.src).to.include('l=customDataLayer');
    });
  });

  describe('error handling', () => {
    it('should handle script loading errors gracefully', async () => {
      // Create GtmMartech instance
      const gtmMartech = createGtmMartech({
        containers: {
          lazy: [],
          delayed: [TEST_CONSTANTS.GTM_CONTAINER_1],
        },
      });

      // Mock loadScript to throw an error
      const originalLoadScript = global.loadScript;
      global.loadScript = () => Promise.reject(new Error('Script loading failed'));

      // Call the delayed function and expect it to handle the error gracefully
      await gtmMartech.delayed();

      // Restore original loadScript
      global.loadScript = originalLoadScript;

      // The test passes if no unhandled errors are thrown
      expect(true).to.be.true;
    });
  });
});
