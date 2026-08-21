# Local Lighthouse audit

Date: 2026-08-21 KST
Target: `http://127.0.0.1:4181/`
Viewport/profile: Lighthouse mobile defaults, headless Google Chrome

| Category | Before | After |
| --- | ---: | ---: |
| Performance | 63 | 88 |
| Accessibility | 95 | 100 |
| Best Practices | 96 | 100 |
| SEO | 100 | 100 |

The corrective pass removed the mobile visitor-chat overlap, fixed all reported
color-contrast failures, supplied an empty favicon to prevent a console 404,
and stopped rendering the hero photograph twice through both an image element
and a pseudo-element.

The audit was run with a transient Lighthouse CLI invocation. It did not add a
package, lockfile, or runtime dependency to the repository.

Remaining performance opportunities are delivery concerns rather than release
blockers: optimize the hero WebP, reduce unused legacy CSS, and tune production
cache headers. Production field data must be checked after release.
