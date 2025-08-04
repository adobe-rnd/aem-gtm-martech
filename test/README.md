# Testing

This directory contains unit tests for the AEM GTM Martech plugin.

## Setup

The tests use the following testing framework and libraries:

- **Mocha**: Test runner
- **Chai**: Assertion library
- **JSDOM**: DOM implementation for Node.js
- **C8**: Code coverage tool
- **Sinon**: Mocking and spying library

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

### Test Files

#### `constructor.test.js`
Tests for the `GtmMartech` class constructor and configuration initialization.

**Test Cases:**
- Default configuration initialization
- Analytics disabled configuration
- String tag input handling
- Multiple tags handling
- Empty tags array handling
- Custom data layer instance names
- Configuration validation and error handling

#### `eager.test.js`
Tests for the `eager()` function of the `GtmMartech` class. This function is responsible for loading GA4 scripts during the eager phase.

**Test Cases:**
- Basic functionality: Verifies that GA4 scripts are loaded with correct attributes
- Analytics disabled: Ensures no scripts are loaded when analytics is disabled
- Empty tags: Handles empty tags array gracefully
- Data layer initialization: Verifies data layer is properly initialized
- String tags: Handles single tag provided as string
- Duplicate prevention: Prevents duplicate script loading on multiple calls
- Custom data layer: Works with custom data layer instance names
- Error handling: Gracefully handles script loading errors

#### `lazy.test.js`
Tests for the `lazy()` function which handles lazy loading of GTM containers and element observation.

**Test Cases:**
- GTM container loading with correct attributes
- Element observation setup
- Decorate callback execution
- Analytics disabled scenarios
- Error handling for container loading
- Multiple container handling

#### `delayed.test.js`
Tests for the `delayed()` function which handles delayed loading of GTM containers.

**Test Cases:**
- Delayed GTM container loading
- Timing and execution order
- Analytics disabled scenarios
- Error handling
- Multiple container handling

#### `gtag.test.js`
Tests for the `gtag()` function which handles Google Analytics 4 event tracking.

**Test Cases:**
- Basic event tracking functionality
- Custom event parameters
- Multiple measurement IDs
- Analytics disabled scenarios
- Data layer integration
- Error handling

#### `observeElements.test.js`
Tests for the element observation functionality that monitors DOM changes and triggers callbacks.

**Test Cases:**
- Decorate callback execution for loaded elements
- Section element observation and callback triggering
- Block element observation and callback triggering
- MutationObserver setup and cleanup
- Duplicate decoration prevention
- Error handling in callbacks

#### `pushToDataLayer.test.js`
Tests for the `pushToDataLayer()` function which adds events to the data layer.

**Test Cases:**
- Basic data layer pushing functionality
- Custom data layer instance names
- Event object structure validation
- Analytics disabled scenarios
- Error handling

#### `consent.test.js`
Tests for consent management functionality.

**Test Cases:**
- Consent initialization
- Consent state management
- Analytics disabled scenarios
- Error handling

#### `updateUserConsent.test.js`
Tests for user consent update functionality.

**Test Cases:**
- Consent update functionality
- Data layer integration
- Analytics disabled scenarios
- Error handling

## Test Environment

Each test runs in an isolated JSDOM environment to simulate a browser environment. The tests:

- Mock the global `window` and `document` objects
- Track script element creation to verify loading behavior
- Clean up after each test to prevent interference
- Use the `TestSetup` helper class for consistent environment setup

## Test Helpers

### `helpers/setup.js`
Contains shared test utilities and setup functions:

- **`TestSetup` class**: Manages JSDOM environment setup and cleanup
- **`TEST_CONSTANTS`**: Common test constants (measurement IDs, container IDs)
- **`createGtmMartech()`**: Helper function to create GtmMartech instances with test configuration

**Key Features:**
- Automatic JSDOM setup with customizable HTML
- Global mock management (window, document, MutationObserver)
- Spy management and cleanup
- Console warning spying capabilities

## Code Coverage

The project uses C8 for code coverage reporting by default. Every test run includes coverage analysis and reports are generated in multiple formats:

- **Text**: Console output showing coverage percentages
- **LCOV**: Coverage data for CI/CD integration
- **HTML**: Detailed HTML report in `coverage/` directory

Coverage thresholds are set to 100% for:
- Branches
- Lines
- Functions
- Statements

To view the HTML coverage report, run `npm test` and open `coverage/index.html` in your browser.

## Writing New Tests

When adding new tests:

1. Follow the existing pattern of using `beforeEach` and `afterEach` hooks
2. Use the `TestSetup` class for consistent environment setup
3. Mock DOM operations as needed using JSDOM
4. Use descriptive test names that explain the expected behavior
5. Test both success and error scenarios
6. Clean up any global state after tests
7. Use Sinon spies and stubs for mocking external dependencies

## Example Test Structure

```javascript
describe('Feature Name', () => {
  let testSetup;
  let gtmMartech;

  beforeEach(() => {
    // Setup JSDOM environment using TestSetup
    testSetup = new TestSetup();
    testSetup.setup({ includeMain: true });
    
    // Create GtmMartech instance with test configuration
    gtmMartech = createGtmMartech({
      tags: TEST_CONSTANTS.MEASUREMENT_ID_1,
      // Add other test-specific configuration
    });
  });

  afterEach(() => {
    // Clean up using TestSetup
    testSetup.cleanup();
  });

  it('should do something specific', async () => {
    // Test implementation
    const result = await gtmMartech.someFunction();
    expect(result).to.equal(expected);
  });
});
```

## Test Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up after tests to prevent interference
3. **Mocking**: Use Sinon for mocking external dependencies and spying on function calls
4. **Descriptive Names**: Test names should clearly describe what is being tested
5. **Error Scenarios**: Always test error conditions and edge cases
6. **Async Testing**: Use proper async/await patterns for asynchronous operations
7. **Coverage**: Aim for high test coverage, especially for critical paths 