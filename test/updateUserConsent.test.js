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

import sinon from 'sinon';
import { TestSetup, createGtmMartech } from './helpers/setup.js';

describe('GtmMartech updateUserConsent function', () => {
  let testSetup;
  let gtmMartech;
  let gtagSpy;

  beforeEach(() => {
    testSetup = new TestSetup();
    testSetup.setup();
    gtmMartech = createGtmMartech();

    // Now that GtmMartech is initialized, we can spy on gtag
    gtagSpy = sinon.spy(testSetup.window, 'gtag');
  });

  afterEach(() => {
    testSetup.cleanup();
    gtagSpy.restore();
  });

  describe('consent updates', () => {
    it('should call gtag with consent update command', () => {
      const consentConfig = {
        analytics_storage: 'granted',
        ad_storage: 'denied',
      };

      gtmMartech.updateUserConsent(consentConfig);

      sinon.assert.calledWith(gtagSpy, 'consent', 'update', consentConfig);
    });

    it('should handle multiple consecutive calls', () => {
      // First call
      gtmMartech.updateUserConsent({ analytics_storage: 'granted' });

      // Second call
      gtmMartech.updateUserConsent({ ad_storage: 'denied' });

      // Third call
      gtmMartech.updateUserConsent({ functionality_storage: 'granted' });

      // Verify all calls were made
      sinon.assert.callCount(gtagSpy, 3);

      // Check the calls were made with correct parameters
      sinon.assert.calledWith(gtagSpy.firstCall, 'consent', 'update', { analytics_storage: 'granted' });
      sinon.assert.calledWith(gtagSpy.secondCall, 'consent', 'update', { ad_storage: 'denied' });
      sinon.assert.calledWith(gtagSpy.thirdCall, 'consent', 'update', { functionality_storage: 'granted' });
    });
  });
});
