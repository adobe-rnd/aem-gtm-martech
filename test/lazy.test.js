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

describe('GtmMartech lazy function', () => {
  let testSetup;
  let consoleWarnSpy;

  beforeEach(() => {
    testSetup = new TestSetup();
    const setup = testSetup.setupWithConsoleWarn({ includeMain: true });
    consoleWarnSpy = setup.consoleWarnSpy;
  });

  afterEach(() => {
    testSetup.cleanup();
  });

  describe('consent', () => {
    describe('when consent is enabled', () => {
      it('should call consent callback and update consent', async () => {
        const consentCallback = sinon.stub().resolves({
          analytics_storage: 'granted',
          ad_storage: 'denied',
        });
        const updateUserConsentSpy = sinon.spy();

        // Create GtmMartech instance with consent enabled
        const gtmMartech = createGtmMartech({
          consent: true,
          consentCallback,
        });

        // Mock the updateUserConsent method
        gtmMartech.updateUserConsent = updateUserConsentSpy;

        // Call the lazy function
        await gtmMartech.lazy();

        // Verify consent callback was called
        sinon.assert.calledOnce(consentCallback);

        // Verify updateUserConsent was called with the resolved consent config
        sinon.assert.calledWith(updateUserConsentSpy, {
          analytics_storage: 'granted',
          ad_storage: 'denied',
        });
      });

      it('should handle consent callback that returns undefined', async () => {
        const consentCallback = sinon.stub().resolves(undefined);
        const updateUserConsentSpy = sinon.spy();

        // Create GtmMartech instance with consent enabled
        const gtmMartech = createGtmMartech({
          consent: true,
          consentCallback,
        });

        // Mock the updateUserConsent method
        gtmMartech.updateUserConsent = updateUserConsentSpy;

        // Call the lazy function
        await gtmMartech.lazy();

        // Verify consent callback was called
        sinon.assert.calledOnce(consentCallback);

        // Verify updateUserConsent was not called when consentConfig is undefined
        sinon.assert.notCalled(updateUserConsentSpy);
      });

      it('should handle consent callback that throws an error', async () => {
        const consentCallback = sinon.stub().rejects(new Error('Consent error'));
        const updateUserConsentSpy = sinon.spy();

        // Create GtmMartech instance with consent enabled
        const gtmMartech = createGtmMartech({
          consent: true,
          consentCallback,
        });

        // Mock the updateUserConsent method
        gtmMartech.updateUserConsent = updateUserConsentSpy;

        // Call the lazy function and expect it to handle the error gracefully
        await gtmMartech.lazy();

        // Verify consent callback was called
        sinon.assert.calledOnce(consentCallback);

        // Verify updateUserConsent was not called due to error
        sinon.assert.notCalled(updateUserConsentSpy);
      });
    });

    describe('when consent is disabled', () => {
      it('should not call consent callback', async () => {
        const consentCallback = sinon.stub().resolves({});
        const updateUserConsentSpy = sinon.spy();

        // Create GtmMartech instance with consent disabled
        const gtmMartech = createGtmMartech({
          consent: false,
          consentCallback,
        });

        // Mock the updateUserConsent method
        gtmMartech.updateUserConsent = updateUserConsentSpy;

        // Call the lazy function
        await gtmMartech.lazy();

        // Verify consent callback was not called
        sinon.assert.notCalled(consentCallback);

        // Verify updateUserConsent was not called
        sinon.assert.notCalled(updateUserConsentSpy);
      });
    });
  });

  describe('data layer events', () => {
    it('should push gtm.js event to data layer', async () => {
      // Create GtmMartech instance
      const gtmMartech = createGtmMartech({
        consent: false,
      });

      const initialLength = window.gtmDataLayer.length;

      // Call the lazy function
      await gtmMartech.lazy();

      // Verify gtm.js event was pushed to data layer
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);

      const lastEntry = window.gtmDataLayer[window.gtmDataLayer.length - 1];
      expect(lastEntry.event).to.equal('gtm.js');
      expect(lastEntry['gtm.start']).to.be.a('number');
    });
  });

  describe('GTM container loading', () => {
    it('should load lazy GTM containers', async () => {
      // Create GtmMartech instance with lazy containers
      const gtmMartech = createGtmMartech({
        containers: {
          lazy: [TEST_CONSTANTS.GTM_CONTAINER_1, TEST_CONSTANTS.GTM_CONTAINER_2],
          delayed: [],
        },
        consent: false,
      });

      // Call the lazy function
      await gtmMartech.lazy();

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
          lazy: [TEST_CONSTANTS.GTM_CONTAINER_1],
          delayed: [],
        },
        consent: false,
      });

      // Call the lazy function
      await gtmMartech.lazy();

      // Verify warning was logged
      sinon.assert.calledWith(consoleWarnSpy, 'Analytics is disabled in the martech config');

      // Verify no GTM scripts were loaded
      const script = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      expect(script).to.not.exist;
    });

    it('should not load GTM containers when lazy containers array is empty', async () => {
      // Create GtmMartech instance with empty lazy containers
      const gtmMartech = createGtmMartech({
        containers: {
          lazy: [],
          delayed: [TEST_CONSTANTS.GTM_CONTAINER_1],
        },
        consent: false,
      });

      // Call the lazy function
      await gtmMartech.lazy();

      // Verify no GTM scripts were loaded
      const script = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      expect(script).to.not.exist;
    });

    it('should handle containers provided as string', async () => {
      // Create GtmMartech instance with containers as string
      const gtmMartech = createGtmMartech({
        containers: TEST_CONSTANTS.GTM_CONTAINER_1,
        consent: false,
      });

      // Call the lazy function
      await gtmMartech.lazy();

      // Verify GTM script was loaded
      const script = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      expect(script).to.exist;
    });

    it('should handle containers provided as array', async () => {
      // Create GtmMartech instance with containers as array
      const gtmMartech = createGtmMartech({
        containers: [TEST_CONSTANTS.GTM_CONTAINER_1, TEST_CONSTANTS.GTM_CONTAINER_2],
        consent: false,
      });

      // Call the lazy function
      await gtmMartech.lazy();

      // Verify GTM scripts were loaded
      const script1 = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      const script2 = document.querySelector(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_2}"]`);
      expect(script1).to.exist;
      expect(script2).to.exist;
    });

    it('should not duplicate GTM scripts if lazy is called multiple times', async () => {
      // Create GtmMartech instance
      const gtmMartech = createGtmMartech({
        containers: {
          lazy: [TEST_CONSTANTS.GTM_CONTAINER_1],
          delayed: [],
        },
        consent: false,
      });

      // Call the lazy function twice
      await gtmMartech.lazy();
      await gtmMartech.lazy();

      // Verify only one script was loaded (no duplicates)
      const scripts = document.querySelectorAll(`head > script[src*="${TEST_CONSTANTS.GTM_CONTAINER_1}"]`);
      expect(scripts).to.have.length(1);
    });
  });
});
