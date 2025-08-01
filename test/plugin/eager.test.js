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

import { expect } from 'chai';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';
import { GtmMartech } from '../../src/index.js';

const MEASUREMENT_ID_1 = 'GA_MEASUREMENT_ID_1';
const MEASUREMENT_ID_2 = 'GA_MEASUREMENT_ID_2';


describe('GtmMartech eager function', () => {
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

  it('should load GA4 scripts during eager phase', async () => {
    
    // Create GtmMartech instance with test configuration
    const { eager }  = new GtmMartech({
      tags: [MEASUREMENT_ID_1],
    });

    // Call the eager function
    await eager();

    const script = document.querySelector('head > script[src*="MEASUREMENT_ID_1"]');
    expect(script).to.exist;
    expect(script.src).to.include('googletagmanager.com/gtag/js');
    expect(script.src).to.include(`id=${MEASUREMENT_ID_1}`);
    expect(script.getAttribute('async')).to.equal("true");
    expect(script.src).to.include('l=gtmDataLayer');
  });

  it('should not load scripts if analytics is disabled', async () => {
    // Spy on console.warn to check for the warning when analytics is disabled
    const consoleWarnSpy = sinon.spy(console, 'warn');
    
    // Create GtmMartech instance with analytics disabled
    const { eager } = new GtmMartech({
      analytics: false,
      tags: [MEASUREMENT_ID_1],
    });

    // Call the eager function
    await eager();

    // Verify that the warning was logged for disabled analytics
    sinon.assert.calledWith(consoleWarnSpy, 'Analytics is disabled in the martech config');
    consoleWarnSpy.restore();

    // Verify that no scripts were loaded
    const script = document.querySelector('head > script[src*="MEASUREMENT_ID_1"]');
    expect(script).to.not.exist;
  });

  it('should not load scripts when tags array is empty', async () => {
    // Test empty tags array
    const { eager: emptyEager } = new GtmMartech({ tags: [] });
    await emptyEager();
    const emptyScript = document.querySelector('head > script[src*="MEASUREMENT_ID_1"]');
    expect(emptyScript).to.not.exist;
  });

  it('should load script when tag is provided as string', async () => {
    // Test single tag as string
    const { eager: stringEager } = new GtmMartech({ tags: MEASUREMENT_ID_1 });
    await stringEager();
    const stringScript = document.querySelector('head > script[src*="MEASUREMENT_ID_1"]');
    expect(stringScript).to.exist;
  });

  it('should load multiple GA4 scripts during eager phase', async () => {
    // Create GtmMartech instance with multiple tags
    const { eager } = new GtmMartech({
      tags: [MEASUREMENT_ID_1, MEASUREMENT_ID_2],
    });

    // Call the eager function
    await eager();

    // Verify that both GA4 scripts were loaded
    const script1 = document.querySelector('head > script[src*="MEASUREMENT_ID_1"]');
    const script2 = document.querySelector('head > script[src*="MEASUREMENT_ID_2"]');
    
    expect(script1).to.exist;
    expect(script2).to.exist;
  });

  it('should handle duplicate tags gracefully', async () => {
    // Create GtmMartech instance with duplicate tags
    const { eager } = new GtmMartech({
      tags: [MEASUREMENT_ID_1, MEASUREMENT_ID_1, MEASUREMENT_ID_2],
    });

    // Call the eager function
    await eager();

    // Verify that only one script per unique measurement ID was loaded
    const scripts1 = document.querySelectorAll('head > script[src*="MEASUREMENT_ID_1"]');
    const scripts2 = document.querySelectorAll('head > script[src*="MEASUREMENT_ID_2"]');
    
    expect(scripts1).to.have.length(1);
    expect(scripts2).to.have.length(1);
  });

  it('should not duplicate scripts if eager is called multiple times', async () => {
    // Create GtmMartech instance
    const { eager } = new GtmMartech({
      tags: [MEASUREMENT_ID_1],
    });

    // Call the eager function twice
    await eager();
    await eager();

    // Verify that only one script was loaded (no duplicates)
    const scripts = document.querySelectorAll('head > script[src*="MEASUREMENT_ID_1"]');
    expect(scripts).to.have.length(1);
  });


});
