# Vercel deployment

Deployment was authorized on 23 November 2026. Vercel is the selected provider; the prepared
Sites project is not being published as part of this deployment.

## Configuration

Import `Manav2209/bangkok-plot-feasibility` from GitHub using the repository root (`.`), not
`apps/web`. The tracked `vercel.json` selects a custom static build:

- Node.js: 22.x, declared by the root `package.json`.
- Install: `npx --yes pnpm@10.28.2 install --frozen-lockfile`.
- Build: `npx --yes pnpm@10.28.2 build`.
- Output: `dist`, prepared from the Vite application's output by the existing build script.
- Framework preset: Other (`null`), with the commands above providing the monorepo build.
- No application environment variables, database or geographic API key is required.

The pinned pnpm commands avoid using a different globally selected pnpm release. Map tiles
still require network access; bundled zone/context files and calculation workers are deployed
with the static assets. Scenario sharing uses URL fragments and does not require route rewrites.
Missing files should retain their normal error status rather than being rewritten to HTML.

`.vercel/` is ignored by Git. `.vercelignore` excludes local credentials/configuration,
dependencies, scratch downloads and generated artifacts from CLI source uploads. The public
build contains only the configured output directory.

## Publication status

The user completed deployment on 23 November 2026. Live URL:
https://bangkok-plot-feasibility.vercel.app/

The existing Brave window visibly displayed the deployed application, calculated example areas,
both design choices, the map and 2D/3D controls. A separate unauthenticated HTTPS request returned
200 with the expected page title and Vercel server header. All four zone/context data and manifest
URLs, both worker scripts, the application entry script and its stylesheet returned 200 with
appropriate content types. The local production build also passed.

The hosted asset names match the local build. The exact Vercel deployment ID and source SHA
were not retrieved, so no stronger source-revision match is claimed. The installed CLI is not
authenticated; CLI sign-in is unnecessary for the deployment the user already completed.
The root configuration above supports future repository-root builds; the existing dashboard's
root/build settings were not inspected. The recorded 25 browser flows were run against local
production assets, not rerun against this public origin.

## Verification after deployment

- Confirm the deployment reaches Ready and record its production URL and source revision.
- Load the app, JavaScript/CSS chunks, both worker bundles and all four zone/context data and
  manifest files through the deployed origin.
- Check example calculations, visible 2D/3D controls, design comparison and a shared scenario.
- Confirm source attribution and unresolved site/legal evidence remain visible.
- Record the observed access policy; verify signed-out access if the deployment is public.

The app remains a research preview. Deploying it does not verify the illustrative site's
vacancy, legal road width or unresolved statutory checks.

Provider references: [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json),
[build settings](https://vercel.com/docs/builds/configure-a-build) and
[CLI deployment](https://vercel.com/docs/cli/deploy).
