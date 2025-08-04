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
import { TestSetup, createGtmMartech } from './helpers/setup.js';

describe('GtmMartech consent functionality', () => {
  let testSetup;
  let window;

  beforeEach(() => {
    testSetup = new TestSetup();
    const setup = testSetup.setup();
    window = setup.window;
  });

  afterEach(() => {
    testSetup.cleanup();
  });

  describe('when consent is enabled', () => {
    it('should call gtag consent default', () => {
      // Create GtmMartech instance with consent enabled (default)
      const gtmMartech = createGtmMartech();

      // Verify that gtag function exists
      expect(window.gtag).to.be.a('function');

      // Verify that consent entry is in the data layer
      const consentEntries = window.gtmDataLayer.filter((entry) => entry[0] === 'consent');
      expect(consentEntries).to.have.length(1);
      expect(consentEntries[0][1]).to.equal('default');
    });
  });

  describe('when consent is disabled', () => {
    it('should not call gtag consent', () => {
      // Create GtmMartech instance with consent disabled
      const gtmMartech = createGtmMartech({ consent: false });

      // Verify that gtag function exists
      expect(window.gtag).to.be.a('function');

      // Verify that consent entry is not in the data layer
      const consentEntries = window.gtmDataLayer.filter((entry) => entry[0] === 'consent');
      expect(consentEntries).to.have.length(0);
    });
  });
});
