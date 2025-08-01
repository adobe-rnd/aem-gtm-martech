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
import { JSDOM } from 'jsdom';
import GtmMartech from '../src/index.js';

const MEASUREMENT_ID_1 = 'GA_MEASUREMENT_ID_1';

describe('GtmMartech consent functionality', () => {
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

  describe('when consent is enabled', () => {
    it('should call gtag consent default', () => {
      // Create GtmMartech instance with consent enabled (default)
      const gtmMartech = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
      });

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
      const gtmMartech = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
        consent: false,
      });

      // Verify that gtag function exists
      expect(window.gtag).to.be.a('function');

      // Verify that consent entry is not in the data layer
      const consentEntries = window.gtmDataLayer.filter((entry) => entry[0] === 'consent');
      expect(consentEntries).to.have.length(0);
    });
  });
});
