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

describe('pushToDataLayer function', () => {
  let dom;
  let document;
  let window;
  let consoleWarnSpy;

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

    // Spy on console.warn
    consoleWarnSpy = sinon.spy(console, 'warn');
  });

  afterEach(() => {
    // Clean up
    delete global.window;
    delete global.document;
    delete global.Node;
    consoleWarnSpy.restore();
  });

  describe('when GtmMartech is initialized with datalayer enabled', () => {
    it('should push payload to datalayer successfully', async () => {
      // Initialize GtmMartech
      const gtmMartech = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
      });

      const payload = { event: 'test_event', event_category: 'test' };
      const initialLength = window.gtmDataLayer.length;

      gtmMartech.pushToDataLayer(payload);

      // Verify payload was added to datalayer
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);
      expect(window.gtmDataLayer[window.gtmDataLayer.length - 1]).to.deep.equal(payload);

      // Verify no warning was logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should handle multiple payloads', async () => {
      // Initialize GtmMartech
      const gtmMartech = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
      });

      const payload1 = { event: 'first_event', category: 'test' };
      const payload2 = { event: 'second_event', category: 'test' };
      const payload3 = { event: 'third_event', category: 'test' };

      const initialLength = window.gtmDataLayer.length;

      gtmMartech.pushToDataLayer(payload1);
      gtmMartech.pushToDataLayer(payload2);
      gtmMartech.pushToDataLayer(payload3);

      // Verify all payloads were added
      expect(window.gtmDataLayer).to.have.length(initialLength + 3);
      expect(window.gtmDataLayer[window.gtmDataLayer.length - 3]).to.deep.equal(payload1);
      expect(window.gtmDataLayer[window.gtmDataLayer.length - 2]).to.deep.equal(payload2);
      expect(window.gtmDataLayer[window.gtmDataLayer.length - 1]).to.deep.equal(payload3);

      // Verify no warnings were logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should handle complex payload objects', async () => {
      // Initialize GtmMartech
      const gtmMartech = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
      });

      const complexPayload = {
        event: 'purchase',
        ecommerce: {
          purchase: {
            actionField: {
              id: 'T_12345',
              affiliation: 'Online Store',
              revenue: 35.43,
              tax: 4.90,
              shipping: 5.99,
              coupon: 'SUMMER_SALE',
            },
            products: [{
              name: 'Triblend Android T-Shirt',
              id: '12345',
              price: 15.25,
              brand: 'Google',
              category: 'Apparel',
              variant: 'Gray',
              quantity: 1,
            }],
          },
        },
      };

      const initialLength = window.gtmDataLayer.length;

      gtmMartech.pushToDataLayer(complexPayload);

      // Verify complex payload was added correctly
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);
      expect(window.gtmDataLayer[window.gtmDataLayer.length - 1]).to.deep.equal(complexPayload);

      // Verify no warning was logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should handle primitive payloads', async () => {
      // Initialize GtmMartech
      const gtmMartech = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
      });

      const stringPayload = 'test_string';
      const numberPayload = 42;
      const booleanPayload = true;

      const initialLength = window.gtmDataLayer.length;

      gtmMartech.pushToDataLayer(stringPayload);
      gtmMartech.pushToDataLayer(numberPayload);
      gtmMartech.pushToDataLayer(booleanPayload);

      // Verify primitive payloads were added
      expect(window.gtmDataLayer).to.have.length(initialLength + 3);
      expect(window.gtmDataLayer[window.gtmDataLayer.length - 3]).to.equal(stringPayload);
      expect(window.gtmDataLayer[window.gtmDataLayer.length - 2]).to.equal(numberPayload);
      expect(window.gtmDataLayer[window.gtmDataLayer.length - 1]).to.equal(booleanPayload);

      // Verify no warnings were logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should handle null and undefined payloads', async () => {
      // Initialize GtmMartech
      const gtmMartech = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
      });

      const initialLength = window.gtmDataLayer.length;

      gtmMartech.pushToDataLayer(null);
      gtmMartech.pushToDataLayer(undefined);

      // Verify null and undefined were added
      expect(window.gtmDataLayer).to.have.length(initialLength + 2);
      expect(window.gtmDataLayer[window.gtmDataLayer.length - 2]).to.be.null;
      expect(window.gtmDataLayer[window.gtmDataLayer.length - 1]).to.be.undefined;

      // Verify no warnings were logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should work with custom datalayer instance name', async () => {
      // Create new instance with custom datalayer name
      const customGtmMartech = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
        dataLayerInstanceName: 'customDataLayer',
      });

      const payload = { event: 'custom_event' };
      const initialLength = window.customDataLayer.length;

      customGtmMartech.pushToDataLayer(payload);

      // Verify payload was added to custom datalayer
      expect(window.customDataLayer).to.have.length(initialLength + 1);
      expect(window.customDataLayer[window.customDataLayer.length - 1]).to.deep.equal(payload);

      // Verify no warning was logged
      sinon.assert.notCalled(consoleWarnSpy);
    });
  });

  describe('edge cases', () => {
    it('should handle large payload', async () => {
      // Initialize GtmMartech
      const gtmMartech = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
      });

      const initialLength = window.gtmDataLayer.length;

      // Test large payload
      const largePayload = {
        event: 'large_event',
        data: Array(1000).fill('test_data').map((item, index) => ({ id: index, value: item })),
      };
      gtmMartech.pushToDataLayer(largePayload);

      // Verify large payload was added
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);
      expect(window.gtmDataLayer[window.gtmDataLayer.length - 1]).to.deep.equal(largePayload);

      // Verify no warnings were logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should handle circular reference payload', async () => {
      // Initialize GtmMartech
      const gtmMartech = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
      });

      const initialLength = window.gtmDataLayer.length;

      // Test circular reference
      const circularPayload = { event: 'circular_event' };
      circularPayload.self = circularPayload;
      gtmMartech.pushToDataLayer(circularPayload);

      // Verify circular payload was added
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);
      expect(window.gtmDataLayer[window.gtmDataLayer.length - 1]).to.equal(circularPayload);

      // Verify no warnings were logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should handle function payload', async () => {
      // Initialize GtmMartech
      const gtmMartech = new GtmMartech({
        tags: [MEASUREMENT_ID_1],
      });

      const initialLength = window.gtmDataLayer.length;

      // Test function payload
      const functionPayload = { event: 'function_event', callback: () => 'test' };
      gtmMartech.pushToDataLayer(functionPayload);

      // Verify function payload was added
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);
      expect(window.gtmDataLayer[window.gtmDataLayer.length - 1]).to.deep.equal(functionPayload);

      // Verify no warnings were logged
      sinon.assert.notCalled(consoleWarnSpy);
    });
  });
});
