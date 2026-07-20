# GitHub Actions supply-chain policy

- Every third-party action is pinned to a reviewed full commit SHA. The major
  version comment is informational and supports auditable Dependabot updates.
- Workflows default to `contents: read`; only the isolated Pages deploy job or
  the evidence synchronization job receives the write scope it needs.
- Dependabot reviews npm and Actions weekly. Dependency Review blocks newly
  introduced moderate-or-higher advisories, while CodeQL analyzes JavaScript
  on pushes, pull requests, and a weekly schedule.
- A new action must have a reviewed upstream, full-SHA pin, minimal permission,
  bounded timeout, and explicit artifact failure/retention behavior.
- GitHub Pages deploys only the explicit `_site` allowlist; repository source,
  tests, scripts, package manifests, and Cloudflare-only `_headers` stay private.
