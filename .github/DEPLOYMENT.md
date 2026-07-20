# Deployment prerequisites

The landing repository publishes only an explicit static allowlist. Repository
source, package manifests, scripts, tests, reports, and the Cloudflare-only
`_headers` file are not part of the GitHub Pages artifact.

## GitHub Pages migration

1. In **Settings → Pages → Build and deployment**, change the legacy branch/root
   source to **GitHub Actions**. The equivalent API operation is a Pages update
   with `build_type` set to `workflow`.
2. Keep the `github-pages` environment and permit deployments from `main`.
3. `.github/workflows/pages.yml` is the sole Pages publisher. It audits locked
   dependencies, proves generated bundles/pages are synchronized, runs the
   Chromium/Pixel/Firefox/WebKit suite plus EN/KO Lighthouse checks, and grants
   Pages/OIDC write scope only to the final deploy job.

The coordinated release workflow only validates, commits an exact allowlist of
evidence-derived files, and tags. Its push is deliberately handed to the single
Pages workflow instead of racing a second deployment path.

## Cloudflare mirror

Configure the `cloudflare-pages` environment with:

- secret `CLOUDFLARE_API_TOKEN` limited to the landing Pages project;
- secret `CLOUDFLARE_ACCOUNT_ID`;
- variable `CLOUDFLARE_MIRROR_URL` containing the canonical HTTPS probe URL.

Missing configuration fails with an explicit job summary. A successful deploy
is followed by live COOP, COEP, and `nosniff` header assertions. This optional
mirror runs only from an explicit workflow dispatch, so missing mirror secrets
never make the canonical GitHub Pages release fail.

## Evidence automation and governance

The simulation repository sends authenticated `repository_dispatch` events.
Incoming payloads are pinned to a full simulator commit/tag, and coordinated
releases also verify the evidence SHA-256. Evidence synchronization writes only
its documented generated-file allowlist.

After the first hardened run, add a default-branch ruleset requiring Landing CI,
Node Compatibility, dependency review, CodeQL, one review, resolved discussions,
linear history, and no force pushes/deletions. If evidence sync remains a direct
bot push, explicitly authorize only that GitHub Actions workflow or migrate it
to a reviewed pull-request lane; do not grant a broad branch-protection bypass.
