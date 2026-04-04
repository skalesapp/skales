## Description
Provides a high-performance, memory-efficient Manifest V3 Chrome Extension offering a persistent "Sidekick" Side Panel for navigating Skales documentation.

### Value to the Skales Ecosystem
- **Zero-Dependency**: Maximizes speed and lowers security attack surface.
- **Enhanced Developer Experience**: Developers browsing the Skales API docs can save snippets directly with one click, without losing context.
- **Persistent Search**: Allows cross-page document search right inside the Side Panel, reducing tab bloat.

## QA & Testing
- [x] Tested locally via `chrome://extensions` "Load Unpacked".
- [x] Passed Jest validation tests (`npm test`).
- [x] Contains no malicious `innerHTML` injections.
- [x] Follows Skales minimal design system (Primary: #000).

## Notes to Reviewers
If a search backend API is provided in the future, the DOM scraper can be hot-swapped for a fetch call to the endpoint within `src/sidepanel.js`.
