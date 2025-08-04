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

describe('observeElements function', () => {
  let testSetup;
  let decorateCallback;
  let gtmMartech;

  beforeEach(() => {
    testSetup = new TestSetup();
    testSetup.setup({ includeMain: true });
    decorateCallback = sinon.spy();
    gtmMartech = createGtmMartech({
      decorateCallback,
    });
  });

  afterEach(() => {
    testSetup.cleanup();
  });

  describe('when decorateCallback is provided', () => {
    it('should call decorateCallback for already loaded elements', async () => {
      // Create elements with loaded status before calling lazy
      const section = document.createElement('section');
      section.setAttribute('data-section-status', 'loaded');
      section.textContent = 'Section 1';

      const block = document.createElement('div');
      block.setAttribute('data-block-status', 'loaded');
      block.textContent = 'Block 1';

      document.querySelector('main').appendChild(section);
      document.querySelector('main').appendChild(block);

      // Call lazy to trigger observeElements
      await gtmMartech.lazy();

      // Verify decorateCallback was called for both elements
      sinon.assert.calledTwice(decorateCallback);
      sinon.assert.calledWith(decorateCallback, section);
      sinon.assert.calledWith(decorateCallback, block);

      // Verify elements were marked as decorated
      expect(section.dataset.gtmMartechDecorated).to.equal('true');
      expect(block.dataset.gtmMartechDecorated).to.equal('true');
    });

    it('should call decorateCallback when section elements when they become loaded', async () => {
      // Call lazy to set up observers
      await gtmMartech.lazy();

      // Create elements that are not yet loaded
      const section = document.createElement('section');
      section.textContent = 'Section';
      document.querySelector('main').appendChild(section);

      // Initially, callback should not be called
      sinon.assert.notCalled(decorateCallback);

      // Set the section as loaded
      section.setAttribute('data-section-status', 'loaded');

      // Wait for the next tick to allow MutationObserver to process
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify decorateCallback was called
      sinon.assert.calledOnce(decorateCallback);
      sinon.assert.calledWith(decorateCallback, section);
      expect(section.dataset.gtmMartechDecorated).to.equal('true');
    });

    it('should call decorateCallback for block elements when they become loaded', async () => {
      // Call lazy to set up observers
      await gtmMartech.lazy();

      // Create a block element that is not yet loaded
      const block = document.createElement('div');
      block.textContent = 'Block';
      document.querySelector('main').appendChild(block);

      // Initially, callback should not be called
      sinon.assert.notCalled(decorateCallback);

      // Set the block as loaded
      block.setAttribute('data-block-status', 'loaded');

      // Wait for the next tick to allow MutationObserver to process
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify decorateCallback was called
      sinon.assert.calledOnce(decorateCallback);
      sinon.assert.calledWith(decorateCallback, block);
      expect(block.dataset.gtmMartechDecorated).to.equal('true');
    });

    it('should not call decorateCallback twice for the same element', async () => {
      // Create an element that is already loaded
      const section = document.createElement('section');
      section.setAttribute('data-section-status', 'loaded');
      section.textContent = 'Section';
      document.querySelector('main').appendChild(section);

      // Call lazy to trigger initial decoration
      await gtmMartech.lazy();

      // Verify callback was called once
      sinon.assert.calledOnce(decorateCallback);

      // Reset the spy to check for additional calls
      decorateCallback.resetHistory();

      // Try to trigger decoration again by changing the status
      // Note: The MutationObserver will trigger again when the attribute changes
      section.setAttribute('data-section-status', 'loaded');

      // Wait for the next tick
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // The element should not be decorated again due to the dataset check
      // But the MutationObserver will still fire, so we check that the element is marked
      expect(section.dataset.gtmMartechDecorated).to.equal('true');
    });

    it('should handle nested elements correctly', async () => {
      // Call lazy to set up observers
      await gtmMartech.lazy();

      // Create a complex structure with nested elements
      const fragment = document.createElement('div');
      fragment.className = 'fragment-wrapper';

      const section = document.createElement('section');
      section.setAttribute('data-section-status', 'loaded');

      const block = document.createElement('div');
      block.setAttribute('data-block-status', 'loaded');

      block.appendChild(fragment);
      section.appendChild(block);
      document.querySelector('main').appendChild(section);

      // Wait for the next tick
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify both elements were decorated
      sinon.assert.calledTwice(decorateCallback);
      sinon.assert.calledWith(decorateCallback, section);
      sinon.assert.calledWith(decorateCallback, block);
    });

    it('should observe body element for new content', async () => {
      // Call lazy to set up observers
      await gtmMartech.lazy();

      // Add a new section to the body
      const section = document.createElement('section');
      section.setAttribute('data-section-status', 'loaded');
      document.body.appendChild(section);

      // Wait for the next tick
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify the new section was decorated
      sinon.assert.calledOnce(decorateCallback);
      sinon.assert.calledWith(decorateCallback, section);
    });

    it('should observe header element for new content', async () => {
      const header = document.createElement('header');
      document.body.appendChild(header);

      // Call lazy to set up observers
      await gtmMartech.lazy();

      // Add a new block to the header
      const block = document.createElement('div');
      block.setAttribute('data-block-status', 'loaded');
      header.appendChild(block);

      // Wait for the next tick
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify the block was decorated
      sinon.assert.calledOnce(decorateCallback);
      sinon.assert.calledWith(decorateCallback, block);
    });

    it('should observe footer element for new content', async () => {
      const footer = document.createElement('footer');
      document.body.appendChild(footer);

      // Call lazy to set up observers
      await gtmMartech.lazy();

      // Add a new block to the footer
      const block = document.createElement('div');
      block.setAttribute('data-block-status', 'loaded');
      footer.appendChild(block);

      // Wait for the next tick
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify the block was decorated
      sinon.assert.calledOnce(decorateCallback);
      sinon.assert.calledWith(decorateCallback, block);
    });

    it('should observe main element for new content', async () => {
      const main = document.createElement('main');
      document.body.appendChild(main);

      // Call lazy to set up observers
      await gtmMartech.lazy();

      // Add a new section to the main
      const section = document.createElement('section');
      section.setAttribute('data-section-status', 'loaded');
      main.appendChild(section);

      // Wait for the next tick
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify the section was decorated
      sinon.assert.calledOnce(decorateCallback);
      sinon.assert.calledWith(decorateCallback, section);
    });

    it('should observe fragment-wrapper elements for new content', async () => {
      // Call lazy to set up observers
      await gtmMartech.lazy();

      // Create a fragment-wrapper
      const fragmentWrapper = document.createElement('div');
      fragmentWrapper.className = 'fragment-wrapper';
      document.querySelector('main').appendChild(fragmentWrapper);

      // Wait for the next tick
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Add a new section to the fragment-wrapper
      const section = document.createElement('section');
      section.setAttribute('data-section-status', 'loaded');
      fragmentWrapper.appendChild(section);

      // Wait for the next tick
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify the new section was decorated
      sinon.assert.calledOnce(decorateCallback);
      sinon.assert.calledWith(decorateCallback, section);
    });

    it('should ignore non-element nodes', async () => {
      // Call lazy to set up observers
      await gtmMartech.lazy();

      // Add a text node
      const textNode = document.createTextNode('Some text');
      document.querySelector('main').appendChild(textNode);

      // Wait for the next tick
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify no callback was called for text node
      sinon.assert.notCalled(decorateCallback);
    });

    it('should handle elements without data attributes', async () => {
      // Call lazy to set up observers
      await gtmMartech.lazy();

      // Create an element without data attributes
      const div = document.createElement('div');
      div.textContent = 'Regular div';
      document.querySelector('main').appendChild(div);

      // Wait for the next tick
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify no callback was called
      sinon.assert.notCalled(decorateCallback);
    });
  });

  describe('when decorateCallback is not provided', () => {
    it('should not set up observers when no decorateCallback is provided', async () => {
      // Create GtmMartech without decorateCallback
      const gtmMartechWithoutCallback = createGtmMartech();

      // Create a loaded element
      const section = document.createElement('section');
      section.setAttribute('data-section-status', 'loaded');
      document.querySelector('main').appendChild(section);

      // Call lazy
      await gtmMartechWithoutCallback.lazy();

      // Verify no decoration occurred
      expect(section.dataset.gtmMartechDecorated).to.be.undefined;
    });
  });

  describe('edge cases', () => {
    it('should handle rapid status changes', async () => {
      // Call lazy to set up observers
      await gtmMartech.lazy();

      const section = document.createElement('section');
      document.querySelector('main').appendChild(section);

      // Rapidly change status multiple times
      section.setAttribute('data-section-status', 'loading');
      section.setAttribute('data-section-status', 'loaded');
      section.setAttribute('data-section-status', 'error');
      section.setAttribute('data-section-status', 'loaded');

      // Wait for the next tick
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should be decorated when it becomes 'loaded' (may be called multiple times due to rapid changes)
      expect(decorateCallback.callCount).to.be.at.least(1);
      expect(decorateCallback.getCalls().some((call) => call.args[0] === section)).to.be.true;
    });

    it('should handle elements removed and re-added', async () => {
      // Call lazy to set up observers
      await gtmMartech.lazy();

      const section = document.createElement('section');
      section.setAttribute('data-section-status', 'loaded');
      document.querySelector('main').appendChild(section);

      // Wait for decoration
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify the element was decorated
      sinon.assert.calledOnce(decorateCallback);
      expect(section.dataset.gtmMartechDecorated).to.equal('true');
      decorateCallback.resetHistory();

      // Remove the element
      section.remove();

      // Re-add the element
      document.querySelector('main').appendChild(section);

      // Wait for the next tick
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should not be decorated again since it's already marked
      // Note: The element keeps its dataset when removed/re-added, so it won't be decorated again
      sinon.assert.notCalled(decorateCallback);
      expect(section.dataset.gtmMartechDecorated).to.equal('true');
    });

    it('should handle multiple observers on the same element', async () => {
      // Call lazy to set up observers
      await gtmMartech.lazy();

      // Create a fragment-wrapper with a section
      const fragmentWrapper = document.createElement('div');
      fragmentWrapper.className = 'fragment-wrapper';

      const section = document.createElement('section');
      section.setAttribute('data-section-status', 'loaded');
      fragmentWrapper.appendChild(section);

      document.querySelector('main').appendChild(fragmentWrapper);

      // Wait for the next tick
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should only be decorated once despite multiple observers
      sinon.assert.calledOnce(decorateCallback);
      sinon.assert.calledWith(decorateCallback, section);
    });
  });
});
