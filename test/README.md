# Testing

This directory contains unit tests for the AEM GTM Martech plugin.

## Setup

The tests use the following testing framework and libraries:

- **Mocha**: Test runner
- **Chai**: Assertion library
- **JSDOM**: DOM implementation for Node.js
- **C8**: Code coverage tool

## Running Tests

To run all tests with coverage:

```bash
npm test
```

To run tests in watch mode (automatically re-run on file changes):

```bash
npm run test:watch
```

## Test Structure

### `eager.test.js`

Tests for the `eager()` function of the `GtmMartech` class. This function is responsible for loading GA4 scripts during the eager phase.

**Test Cases:**

1. **Basic functionality**: Verifies that GA4 scripts are loaded with correct attributes
2. **Analytics disabled**: Ensures no scripts are loaded when analytics is disabled
3. **Empty tags**: Handles empty tags array gracefully
4. **Data layer initialization**: Verifies data layer is properly initialized
5. **String tags**: Handles single tag provided as string
6. **Duplicate prevention**: Prevents duplicate script loading on multiple calls
7. **Custom data layer**: Works with custom data layer instance names
8. **Error handling**: Gracefully handles script loading errors

## Test Environment

Each test runs in an isolated JSDOM environment to simulate a browser environment. The tests:

- Mock the global `window` and `document` objects
- Track script element creation to verify loading behavior
- Clean up after each test to prevent interference

## Code Coverage

The project uses C8 for code coverage reporting by default. Every test run includes coverage analysis and reports are generated in multiple formats:

- **Text**: Console output showing coverage percentages
- **LCOV**: Coverage data for CI/CD integration
- **HTML**: Detailed HTML report in `coverage/` directory

Coverage thresholds are set to 80% for:
- Branches
- Lines
- Functions
- Statements

To view the HTML coverage report, run `npm test` and open `coverage/index.html` in your browser.



## Writing New Tests

When adding new tests:

1. Follow the existing pattern of using `beforeEach` and `afterEach` hooks
2. Mock DOM operations as needed
3. Use descriptive test names that explain the expected behavior
4. Test both success and error scenarios
5. Clean up any global state after tests

## Example Test Structure

```javascript
describe('Feature Name', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Setup JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
    document = dom.window.document;
    window = dom.window;
    
    // Mock globals
    global.window = window;
    global.document = document;
  });

  afterEach(() => {
    // Clean up
    delete global.window;
    delete global.document;
  });

  it('should do something specific', async () => {
    // Test implementation
    expect(result).to.equal(expected);
  });
});
``` 