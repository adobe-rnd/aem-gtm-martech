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

import { JSDOM } from 'jsdom';
import sinon from 'sinon';
import GtmMartech from '../../src/index.js';

// Test constants
export const TEST_CONSTANTS = {
  MEASUREMENT_ID_1: 'GA_MEASUREMENT_ID_1',
  MEASUREMENT_ID_2: 'GA_MEASUREMENT_ID_2',
  GTM_CONTAINER_1: 'GTM-ABC123',
  GTM_CONTAINER_2: 'GTM-DEF456',
};

/**
 * Global test setup class that handles common JSDOM setup and cleanup
 */
export class TestSetup {
  constructor() {
    this.dom = null;
    this.document = null;
    this.window = null;
    this.spies = [];
  }

  /**
   * Basic setup with JSDOM and global mocks
   * @param {Object} options - Setup options
   * @param {string} options.html - Custom HTML content (default: basic HTML)
   * @param {boolean} options.includeMain - Whether to include main element
   * @returns {Object} Setup result with dom, document, window
   */
  setup(options = {}) {
    const { html, includeMain = false } = options;
    
    const defaultHtml = includeMain 
      ? '<!DOCTYPE html><html><head></head><body><main></main></body></html>'
      : '<!DOCTYPE html><html><head></head><body></body></html>';

    // Create a new JSDOM instance
    this.dom = new JSDOM(defaultHtml || html || defaultHtml, {
      url: 'http://localhost',
      pretendToBeVisual: true,
    });

    this.document = this.dom.window.document;
    this.window = this.dom.window;

    // Mock the global window and document
    global.window = this.window;
    global.document = this.document;
    global.Node = this.window.Node;

    return {
      dom: this.dom,
      document: this.document,
      window: this.window,
    };
  }

  /**
   * Setup with console.warn spy
   * @param {Object} options - Setup options
   * @returns {Object} Setup result with consoleWarnSpy
   */
  setupWithConsoleWarn(options = {}) {
    const setup = this.setup(options);
    const consoleWarnSpy = sinon.spy(console, 'warn');
    this.spies.push(consoleWarnSpy);

    return {
      ...setup,
      consoleWarnSpy,
    };
  }

  /**
   * Clean up all spies and global mocks
   */
  cleanup() {
    // Restore all spies
    this.spies.forEach(spy => {
      if (spy && typeof spy.restore === 'function') {
        spy.restore();
      }
    });
    this.spies = [];

    // Clean up global mocks
    delete global.window;
    delete global.document;
    delete global.Node;
  }
}

/**
 * Create a GtmMartech instance with default test configuration
 * @param {Object} config - Additional configuration to merge with defaults
 * @returns {GtmMartech} GtmMartech instance
 */
export function createGtmMartech(config = {}) {
  const defaultConfig = {
    tags: [TEST_CONSTANTS.MEASUREMENT_ID_1],
    ...config,
  };

  return new GtmMartech(defaultConfig);
}
 