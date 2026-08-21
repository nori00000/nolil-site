# Local Lighthouse audit

Date: 2026-08-21 KST
Target: `http://127.0.0.1:4181/`
Viewport/profile: Lighthouse mobile defaults, headless Google Chrome

| Category | Before | After |
| --- | ---: | ---: |
| Performance | 63 | 95 |
| Accessibility | 95 | 100 |
| Best Practices | 96 | 100 |
| SEO | 100 | 100 |

The corrective pass removed the mobile visitor-chat overlap, fixed all reported
color-contrast failures, supplied an empty favicon to prevent a console 404,
and stopped rendering the hero photograph twice through both an image element
and a pseudo-element. A repeated audit exposed a 64–88 performance swing caused
by render-blocking Google Fonts; replacing that external request with local
device fonts produced 95 in two consecutive runs with a 3.0 second LCP.

The audit was run with a transient Lighthouse CLI invocation. It did not add a
package, lockfile, or runtime dependency to the repository.

Remaining performance opportunities are delivery concerns rather than release
blockers: optimize the hero WebP, reduce unused legacy CSS, and tune production
cache headers. Production field data must be checked after release.

## Follow-up gate run

Date: 2026-08-21 KST
Target: `http://127.0.0.1:4173/index.html`
Viewport/profile: Lighthouse 13.4.1 mobile, headless Google Chrome

| Category | Score |
| --- | ---: |
| Performance | 95 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

This run was performed after adding the Playwright layout contract and axe
coverage. It is evidence for the local gate only; the GitHub Actions workflow
will generate a fresh artifact for each pull request and `main` push.
