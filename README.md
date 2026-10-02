# Germination Notebook

A synthetic observation notebook that distinguishes an observed zero from a missing observation and compares completed same-lot replicates with matching protocol, criterion and conditions. Astro supplies the viewer; ordinary Sanity Studio Structure supplies the six-type authoring model.

## Current demonstration

Public Sanity project ID: **pa0x69l2**. Dataset: **production**. The recorded live demonstration has **26 published documents: 25 initial synthetic records plus one append-only correction**.

Replicate A's original observation remains observed16/20. The saved correction records previous observed16, replacement observed15, and the reason: “Synthetic demonstration correction: endpoint recount revised from 16 to 15. No physical experiment was performed.” A token-free published SDK read and the live browser render the effective value as **15/20 (75%)**, alongside Replicate B **14/20 (70%)**. The protocol criterion is preserved. Refreshing retains the published correction; a local trial affects only the current tab.

Measured zero stays complete at0/20. Unobserved day shows Day3 as not observed, remains incomplete, and is withheld from comparison. All cultivar/lot labels, conditions and observations are invented. The criterion is **Observer-marked radicle visible. Synthetic definition; not physically validated.** No physical experiment, user interview, agricultural impact or statistical superiority is claimed.

The included NDJSON is the initial25-document synthetic fixture, not a snapshot of the later26-document live dataset. Its export script refuses to overwrite it. The model and fixture libraries are byte-identical copies of the reviewed original implementation.

## Source layout

- viewer/: Astro frontend, domain/GROQ modules, schemas, current fixture, tests and pinned lockfile.
- studio/: standard Structure-only Sanity configuration and byte-identical model modules, with its own pinned lockfile. No seed, approval, staging or diagnostic custom tool is registered.
- third-party-licenses/: recognized public dependency LICENSE copies; see NOTICE.md and LICENSE_STATUS.md.

No operational approvals, private review screenshots, tokens, account profiles, unrelated conversations or local runtime paths are included. No original-code license was newly assigned.

## Run the viewer

Use Node24 and pnpm11, then install the pinned dependencies deliberately. Installation and these commands have not been rerun inside this export package.

```sh
cd viewer
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
PUBLIC_SANITY_PROJECT_ID=pa0x69l2 PUBLIC_SANITY_DATASET=production pnpm dev
```

Those public settings contain no secret. No token is needed for the viewer. Without a configured public project, the page explicitly uses invented local fixtures. With Sanity configured, a failed or empty response is an error, not a fixture fallback.

A different localhost origin must be authorized in the project CORS configuration by its owner before a browser can read that project. CORS was verified for the original local live demonstration; it is not a claim that every clone's origin or a future hosting origin is already authorized. The source contains no CORS-changing operation.

## Reproduce the live result

1. Start the configured viewer and check its source label says synthetic published dataset.
2. Open Replicate A: the endpoint effective count is15/20 and the saved correction history retains16→15 and its synthetic reason. Compare B:75% versus70% is a descriptive pair, not evidence of superiority.
3. Select Measured zero:0/20, complete. Select Unobserved day: Day3 missing, incomplete.
4. Try a local endpoint count21 for sample20: rejected. A valid local trial is visibly separate from the published record. Refresh reads the stored correction again.
5. Inspect the standard Studio model separately if authorized. Never publish a new correction into the shared demonstration merely to reproduce the read-only viewer.

A future public app URL and repository URL are **not yet created or verified**. The planned GitHub Pages repository slug is `germination-observation-notebook-2026`; that plan is not a working link. No Netlify service or credits are used by this package.

## Standard Studio

```sh
cd studio
pnpm install --frozen-lockfile --ignore-scripts
DO_NOT_TRACK=1 pnpm dev
```

Studio is configured for the public project/dataset above, but editing requires the owner's normal authenticated permissions. No credentials or shared login are provided. Reading this package or starting Studio grants no write authorization. This export's Structure-only configuration was statically reviewed; its build/runtime is for the release owner to verify. Existing project data must not be replaced, imported or reset.

The types are cultivar, seedLot, testProtocol, testBatch, observation and observationRevision. Batch references connect lot/cultivar and protocol; a correction references its original observation and retains previous/new values and reason. Completion, cumulative validity and compatibility are derived from these relationships.

The original actual Studio check rejected changes to published frozen experimental facts, then restored their original values. An attempted revision count21 with sample20 was blocked; count15 was valid and one correction was published. Public SDK and browser readback preserved the original observation16 and protocol while displaying the effective15. This is evidence for these exact scenarios, not exhaustive Studio QA or server-enforced immutability. Direct API writers can bypass Studio validation; concurrent edits require coordination.

## Validation and limits

The unchanged original viewer implementation passed39 local automated checks:29 domain,4 offline GROQ/adapter and6 mocked Studio-schema checks. The mocks are not authenticated Studio tests. Earlier9 browser cases and5 current frontend rechecks cover different source versions and are not added to those39. The actual live correction/SDK/browser evidence is separate from the local fixture checks. No test suite has been rerun on this source export; byte-for-byte copies were hash-verified instead.

Codex generated/revised the implementation and operated the recorded browser checks under the participant's instructions. No human manual programming, specialist expertise, physical observation work or human technical QA is invented. There is no model inference in the app, no included AI-credit use, and no paid model/API integration. Framework/browser telemetry was not comprehensively measured.

## Planned static build

The default Astro config stays byte-identical to the original. A separate export-only config sets the planned GitHub Pages base path:

```sh
cd viewer
PUBLIC_SANITY_PROJECT_ID=pa0x69l2 PUBLIC_SANITY_DATASET=production pnpm exec astro build --config astro.config.pages.mjs
```

The release owner must supply the real site URL if needed, verify the resulting assets and actual hosting-origin CORS, retain appropriate dependency notices, and inspect public content before deployment. There is no compiled output, install, deployment, remote repository change or competition submission in this package-preparation step.
