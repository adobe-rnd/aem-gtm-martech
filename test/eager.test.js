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

describe('GtmMartech eager function', () => {
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

  it('should load GA4 scripts during eager phase', async () => {
    // Create GtmMartech instance with test configuration
    const gtmMartech = createGtmMartech();

    // Call the eager function
    await gtmMartech.eager();

    const script = document.querySelector('head > script[src*="MEASUREMENT_ID_1"]');
    expect(script).to.exist;
    expect(script.src).to.include('googletagmanager.com/gtag/js');
    expect(script.src).to.include(`id=${TEST_CONSTANTS.MEASUREMENT_ID_1}`);
    expect(script.getAttribute('async')).to.equal('true');
    expect(script.src).to.include('l=gtmDataLayer');
  });

  it('should not load scripts if analytics is disabled', async () => {
    // Create GtmMartech instance with analytics disabled
    const gtmMartech = createGtmMartech({
      analytics: false,
    });

    // Call the eager function
    await gtmMartech.eager();

    // Verify that the warning was logged for disabled analytics
    sinon.assert.calledWith(consoleWarnSpy, 'Analytics is disabled in the martech config');

    // Verify that no scripts were loaded
    const script = document.querySelector('head > script[src*="MEASUREMENT_ID_1"]');
    expect(script).to.not.exist;
  });

  it('should not load scripts when tags array is empty', async () => {
    // Test empty tags array
    const gtmMartech = createGtmMartech({ tags: [] });
    await gtmMartech.eager();
    const emptyScript = document.querySelector('head > script[src*="MEASUREMENT_ID_1"]');
    expect(emptyScript).to.not.exist;
  });

  it('should load script when tag is provided as string', async () => {
    // Test single tag as string
    const gtmMartech = createGtmMartech({ tags: TEST_CONSTANTS.MEASUREMENT_ID_1 });
    await gtmMartech.eager();
    const stringScript = document.querySelector('head > script[src*="MEASUREMENT_ID_1"]');
    expect(stringScript).to.exist;
  });

  it('should load multiple GA4 scripts during eager phase', async () => {
    // Create GtmMartech instance with multiple tags
    const gtmMartech = createGtmMartech({
      tags: [TEST_CONSTANTS.MEASUREMENT_ID_1, TEST_CONSTANTS.MEASUREMENT_ID_2],
    });

    // Call the eager function
    await gtmMartech.eager();

    // Verify that both GA4 scripts were loaded
    const script1 = document.querySelector('head > script[src*="MEASUREMENT_ID_1"]');
    const script2 = document.querySelector('head > script[src*="MEASUREMENT_ID_2"]');

    expect(script1).to.exist;
    expect(script2).to.exist;
  });

  it('should handle duplicate tags gracefully', async () => {
    // Create GtmMartech instance with duplicate tags
    const gtmMartech = createGtmMartech({
      tags: [TEST_CONSTANTS.MEASUREMENT_ID_1, TEST_CONSTANTS.MEASUREMENT_ID_1, TEST_CONSTANTS.MEASUREMENT_ID_2],
    });

    // Call the eager function
    await gtmMartech.eager();

    // Verify that only one script per unique measurement ID was loaded
    const scripts1 = document.querySelectorAll('head > script[src*="MEASUREMENT_ID_1"]');
    const scripts2 = document.querySelectorAll('head > script[src*="MEASUREMENT_ID_2"]');

    expect(scripts1).to.have.length(1);
    expect(scripts2).to.have.length(1);
  });

  it('should not duplicate scripts if eager is called multiple times', async () => {
    // Create GtmMartech instance
    const gtmMartech = createGtmMartech();

    // Call the eager function twice
    await gtmMartech.eager();
    await gtmMartech.eager();

    // Verify that only one script was loaded (no duplicates)
    const scripts = document.querySelectorAll('head > script[src*="MEASUREMENT_ID_1"]');
    expect(scripts).to.have.length(1);
  });
});
