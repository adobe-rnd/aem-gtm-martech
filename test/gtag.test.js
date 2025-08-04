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

describe('gtag function', () => {
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

  describe('when GtmMartech is initialized', () => {
    it('should be available on window object', async () => {
      // Initialize GtmMartech
      const gtmMartech = createGtmMartech();

      // Verify gtag function is available on window
      expect(window.gtag).to.be.a('function');
    });

    it('should push arguments to datalayer', async () => {
      // Initialize GtmMartech
      const gtmMartech = createGtmMartech();

      const initialLength = window.gtmDataLayer.length;

      // Call gtag with various arguments
      window.gtag('event', 'test_event', { event_category: 'test' });

      // Verify arguments were pushed to datalayer
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);

      // The gtag function pushes the arguments object to the data layer
      const lastEntry = window.gtmDataLayer[window.gtmDataLayer.length - 1];
      expect(lastEntry[0]).to.equal('event');
      expect(lastEntry[1]).to.equal('test_event');
      expect(lastEntry[2]).to.deep.equal({ event_category: 'test' });

      // Verify no warnings were logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should handle multiple calls', async () => {
      // Initialize GtmMartech
      const gtmMartech = createGtmMartech();

      const initialLength = window.gtmDataLayer.length;

      // Test multiple calls
      window.gtag('config', TEST_CONSTANTS.MEASUREMENT_ID_1, { custom_parameter: 'value' });
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      window.gtag('js', new Date('2023-01-01T00:00:00Z'));

      // Verify all calls were pushed to datalayer
      expect(window.gtmDataLayer).to.have.length(initialLength + 3);

      // Check the last three entries
      const lastThreeEntries = window.gtmDataLayer.slice(-3);
      expect(lastThreeEntries[0][0]).to.equal('config');
      expect(lastThreeEntries[1][0]).to.equal('consent');
      expect(lastThreeEntries[2][0]).to.equal('js');

      // Verify no warnings were logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should work with custom datalayer instance name', async () => {
      // Create new instance with custom datalayer name
      const customGtmMartech = createGtmMartech({
        dataLayerInstanceName: 'customDataLayer',
      });

      const initialLength = window.customDataLayer.length;

      // Call gtag with custom datalayer
      window.gtag('event', 'custom_event', { category: 'test' });

      // Verify event was pushed to custom datalayer
      expect(window.customDataLayer).to.have.length(initialLength + 1);

      const lastEntry = window.customDataLayer[window.customDataLayer.length - 1];
      expect(lastEntry[0]).to.equal('event');
      expect(lastEntry[1]).to.equal('custom_event');
      expect(lastEntry[2]).to.deep.equal({ category: 'test' });

      // Verify no warning was logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should handle complex ecommerce events', async () => {
      // Initialize GtmMartech
      const gtmMartech = createGtmMartech();

      const initialLength = window.gtmDataLayer.length;

      // Call gtag with complex ecommerce event
      window.gtag('event', 'purchase', {
        transaction_id: 'T_12345',
        value: 35.43,
        currency: 'USD',
        items: [
          {
            item_id: 'SKU_12345',
            item_name: 'Stan and Friends Tee',
            item_category: 'Apparel',
            price: 35.43,
            quantity: 1,
          },
        ],
      });

      // Verify complex event was pushed to datalayer
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);

      const lastEntry = window.gtmDataLayer[window.gtmDataLayer.length - 1];
      expect(lastEntry[0]).to.equal('event');
      expect(lastEntry[1]).to.equal('purchase');
      expect(lastEntry[2]).to.deep.include({
        transaction_id: 'T_12345',
        value: 35.43,
        currency: 'USD',
      });
      expect(lastEntry[2].items).to.have.length(1);
      expect(lastEntry[2].items[0].item_id).to.equal('SKU_12345');

      // Verify no warning was logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should handle large arguments', async () => {
      // Initialize GtmMartech
      const gtmMartech = createGtmMartech();

      const initialLength = window.gtmDataLayer.length;

      // Test large arguments
      const largeData = Array(1000).fill('test_data').map((item, index) => ({ id: index, value: item }));
      window.gtag('event', 'large_event', { data: largeData });

      // Verify large event was pushed to datalayer
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);

      const lastEntry = window.gtmDataLayer[window.gtmDataLayer.length - 1];
      expect(lastEntry[1]).to.equal('large_event');
      expect(lastEntry[2].data).to.have.length(1000);

      // Verify no warnings were logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should handle circular references', async () => {
      // Initialize GtmMartech
      const gtmMartech = createGtmMartech();

      const initialLength = window.gtmDataLayer.length;

      // Test circular references
      const circularData = { event: 'circular_event' };
      circularData.self = circularData;
      window.gtag('event', 'circular_event', circularData);

      // Verify circular event was pushed to datalayer
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);

      const lastEntry = window.gtmDataLayer[window.gtmDataLayer.length - 1];
      expect(lastEntry[1]).to.equal('circular_event');
      expect(lastEntry[2]).to.equal(circularData);

      // Verify no warnings were logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should handle function arguments', async () => {
      // Initialize GtmMartech
      const gtmMartech = createGtmMartech();

      const initialLength = window.gtmDataLayer.length;

      // Test function arguments
      const functionData = {
        event: 'function_event',
        callback: () => 'test',
        timestamp: Date.now(),
      };
      window.gtag('event', 'function_event', functionData);

      // Verify function event was pushed to datalayer
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);

      const lastEntry = window.gtmDataLayer[window.gtmDataLayer.length - 1];
      expect(lastEntry[1]).to.equal('function_event');
      expect(lastEntry[2]).to.deep.equal(functionData);

      // Verify no warnings were logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should handle null and undefined arguments', async () => {
      // Initialize GtmMartech
      const gtmMartech = createGtmMartech();

      const initialLength = window.gtmDataLayer.length;

      // Test null and undefined
      window.gtag('event', null, undefined);

      // Verify null/undefined event was pushed to datalayer
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);

      const lastEntry = window.gtmDataLayer[window.gtmDataLayer.length - 1];
      expect(lastEntry[1]).to.be.null;
      expect(lastEntry[2]).to.be.undefined;

      // Verify no warnings were logged
      sinon.assert.notCalled(consoleWarnSpy);
    });

    it('should handle empty strings', async () => {
      // Initialize GtmMartech
      const gtmMartech = createGtmMartech();

      const initialLength = window.gtmDataLayer.length;

      // Test empty strings
      window.gtag('', '', '');

      // Verify empty string event was pushed to datalayer
      expect(window.gtmDataLayer).to.have.length(initialLength + 1);

      const lastEntry = window.gtmDataLayer[window.gtmDataLayer.length - 1];
      expect(lastEntry[0]).to.equal('');
      expect(lastEntry[1]).to.equal('');
      expect(lastEntry[2]).to.equal('');

      // Verify no warnings were logged
      sinon.assert.notCalled(consoleWarnSpy);
    });
  });

  describe('when GtmMartech is not initialized', () => {
    it('should not have gtag function available on window', () => {
      // Verify gtag function is not available on window when not initialized
      expect(window.gtag).to.be.undefined;
    });

    it('should not have datalayer available when not initialized', () => {
      // Verify datalayer is not available when not initialized
      expect(window.gtmDataLayer).to.be.undefined;
    });

    it('should throw error when trying to call gtag directly', () => {
      // Verify that calling gtag directly throws an error
      expect(() => {
        window.gtag('event', 'test_event', { event_category: 'test' });
      }).to.throw(TypeError, 'window.gtag is not a function');
    });

    it('should not log any warnings when gtag is not available', () => {
      // Verify no warnings are logged when gtag doesn't exist
      sinon.assert.notCalled(consoleWarnSpy);
    });
  });
});
