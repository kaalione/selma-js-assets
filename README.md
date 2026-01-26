# Selma JS Assets

JavaScript assets for the Selma accessibility scanner widget.

## Files

### Core Scanner Modules
- **`enhanced-scanner-loader.min.js`** - Module loader that orchestrates loading of scanner components. Handles CDN/local loading based on debug mode.
- **`enhanced-scanner-core.min.js`** - Core scanning engine with session management, iframe communication, form handling, and webhook integration.
- **`enhanced-scanner-ui.min.js`** - UI components including contact modal, report modal, and CTA overlays.
- **`enhanced-scanner-resources.min.js`** - Resource definitions and configurations.
- **`enhanced-scanner-tracking.min.js`** - Analytics and tracking functionality.

### Testing Files
- **`test-scanner.html`** - Local development test page with debug mode enabled.
- **`iframe.html`** - Mock scanner iframe for local testing (simulates AccessiBe scanning).

## Local Development

Set `window.selmaDebugLocal = true` to load assets from local files instead of CDN
```javascript
window.selmaDebugLocal = true;
```
Open `test-scanner.html` in your browser to test the scanner locally.

## Architecture

The scanner workflow:
1. User submits a URL for scanning
2. Contact modal appears after short delay
3. User provides email/phone
4. Scan completes in background
5. Report page loads with results