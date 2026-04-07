# AgentScore — Product Document

## Overview

**AgentScore** is a public scoring and discovery platform for Claude Code power users. It answers the question: "How optimized is your Claude Code setup?"

**Who it's for:** Developers who use Claude Code (Anthropic's AI coding assistant) and want to understand the sophistication of their agent ecosystem, benchmark it against the community, and discover how others build.

**Core problem it solves:** There is no standard way to evaluate or compare Claude Code setups. Users cannot easily tell whether their configuration — agents, MCP servers, hooks, commands, memory structure — is basic or highly optimized. AgentScore gives that a number, a tier, and actionable next steps.

**How it works in one sentence:** Run the CLI to export a privacy-safe manifest of your `~/.claude/` directory, get scored across 6 dimensions, and publish a shareable public profile.

---

## Features

### 1. Manifest Export (CLI)

**Description:** A Node.js CLI tool (`npx agentscore export`) that scans the user's `~/.claude/` directory, builds a structured manifest of their Claude Code setup, shows a score preview, and submits it to AgentScore.

**User flow:**
1. User runs `npx agentscore export` in their terminal.
2. CLI scans `~/.claude/` and collects agents, MCP servers, hooks, commands, memory structure, and workflow config.
3. A score preview is printed to the terminal.
4. The full manifest JSON is printed with syntax highlighting.
5. CLI prompts: "Submit this manifest to AgentScore? (y/n)"
6. If the user is not logged in, a GitHub OAuth login flow is triggered in the browser.
7. On confirmation, the manifest is POSTed to `/api/profiles`. The profile URL is printed.

**Flags:**
- `--save` — writes the manifest to `agentscore-manifest.json` locally without submitting, so the user can inspect it first.
- `--auto` — skips the display and confirmation prompt (for scripted/CI use).

**Acceptance criteria:**
- [ ] User can run `npx agentscore export` without installing anything globally.
- [ ] CLI scans `~/.claude/` and produces a manifest with all required sections: `agents`, `memory`, `mcpServers`, `hooks`, `commands`, `projects`, `workflows`.
- [ ] Score preview is printed before submission.
- [ ] Manifest JSON is displayed with syntax highlighting before the confirmation prompt.
- [ ] User is prompted "Submit this manifest to AgentScore? (y/n)".
- [ ] Answering "n" cancels submission without error.
- [ ] Answering "y" triggers a login flow if no valid token exists.
- [ ] After successful submission, the profile URL is printed.
- [ ] `--save` writes `agentscore-manifest.json` to the current directory and exits without submitting.
- [ ] `--auto` skips display and confirmation prompt, submits immediately if authenticated.

---

### 2. Scoring Engine

**Description:** A deterministic, server-side scoring engine that evaluates a manifest across 6 dimensions and produces a composite score (0–10) and tier assignment.

**Dimensions scored:**
- **Automation (D1):** Hooks configured, hook event types (UserPromptSubmit, PreToolUse, Stop), hook count thresholds, status line, cron jobs, custom proxy.
- **Memory (D2):** MEMORY.md index file, memory file count thresholds, memory categories, project-specific memory directories.
- **Agent Coverage (D3):** Agent count thresholds, shared agent directory, role-based agent names, distinct role categories covered.
- **Tool Integrations (D4):** MCP server count thresholds, presence of code/dev tools, design tools, communication tools, and browser/testing tools.
- **Skill Breadth (D5):** Custom command count thresholds, presence of workflow-type commands (deploy, build, review, test, cycle) and meta/management commands (status, daily, start, switch).
- **Workflow Depth (D6):** Plugins, channels, combination signals (hooks + commands, agents + MCP + hooks + commands), project memory depth.

**Tier thresholds:**
- Beginner: 0–2.0
- Intermediate: 2.1–4.0
- Advanced: 4.1–6.0
- Expert: 6.1–8.0
- Master: 8.1–10.0

**Acceptance criteria:**
- [ ] `scoreManifest(manifest)` returns `{ composite, tier, dimensions }`.
- [ ] Each dimension score is capped at 10.
- [ ] Composite score is the mean of all 6 dimension scores, rounded to one decimal place.
- [ ] The same manifest always produces the same score (deterministic — no AI, no randomness).
- [ ] Tier assignment matches the defined thresholds.
- [ ] All 6 dimension scoring functions return a `signals` array with per-signal `earned` and `max` point values.

---

### 3. Public Profile Page

**Description:** A public page at `/u/{username}` displaying the user's full AgentScore profile: radar chart, score card with tier, ecosystem personality, strengths, growth areas, next steps, level-up roadmap, score breakdown by dimension, and manifest overview.

**User flow:**
1. User navigates to `/u/{username}`.
2. Page loads the profile from the database (falls back to mock data for demo usernames).
3. Hero section shows the radar chart and score card (composite score, tier, tier description).
4. Below the hero: personality blurb, strengths, growth areas, next steps with point-gain estimates.
5. A collapsible "Full Report" section shows all dimension signals.
6. A "Level Up" section shows the roadmap to reach the next tier.
7. Score breakdown shows all 6 dimension cards with signal-level detail.
8. Manifest overview shows lists of agents, MCP servers, commands, and hooks.
9. If the user has published a setup bundle, a "Full Setup Published" card links to `/u/{username}/setup`.
10. A "Benchmark Your Setup" CTA links to `/benchmark`.

**Acceptance criteria:**
- [ ] User can visit `/u/{username}` for any public profile and see the page render.
- [ ] Radar chart renders with all 6 dimension scores.
- [ ] Score card displays the composite score, tier name, and tier description.
- [ ] Personality blurb is displayed.
- [ ] Strengths section shows dimensions with high scores and explanatory text.
- [ ] Growth areas section shows dimensions with low scores and suggestions.
- [ ] Next steps list shows prioritized actions with point-gain estimates.
- [ ] Score breakdown shows per-dimension cards with signal checklist.
- [ ] Manifest overview shows agents, MCP servers, commands, and hooks as tag lists.
- [ ] Page returns 404 for usernames that do not exist in the database or mock data.
- [ ] OG image meta tags are set, using `/api/og/{username}` as the image URL.

---

### 4. Score History

**Description:** On the profile page, shows when the profile was last scored, displays a delta badge when the score has changed since the previous scan, and provides a "Rescan" button visible only to the profile owner.

**User flow:**
1. User visits their own profile page (authenticated via GitHub OAuth).
2. Below the composite score, "Last updated: Xm ago" is displayed.
3. If there is a previous score, a delta badge shows "+X pts" or "-X pts" in green or red.
4. A "Rescan" button is visible only to the profile owner.
5. Clicking "Rescan" re-submits the stored manifest snapshot and reloads the page.
6. The score history chart below the score card plots all historical scores over time.

**Acceptance criteria:**
- [ ] "Last updated" timestamp is shown in human-readable relative format (e.g., "3h ago", "yesterday").
- [ ] Delta badge is shown when current score differs from the previous score.
- [ ] Delta badge is green for positive, red for negative.
- [ ] Delta badge is hidden when there is no previous score.
- [ ] "Rescan" button is visible only when the authenticated user's GitHub ID matches the profile's GitHub ID.
- [ ] Clicking "Rescan" triggers a re-score and reloads the page.
- [ ] Score history chart renders when there are 2 or more historical scores.

---

### 5. Explore Page

**Description:** A discovery page at `/explore` showing a paginated grid of public profiles with sort and filter controls and username search.

**User flow:**
1. User navigates to `/explore`.
2. A grid of profile cards is shown (6 per page), defaulting to sort by newest.
3. User can sort by: Newest, Highest Score, Most Imports.
4. User can filter by top dimension (Automation, Memory, Agent Coverage, Tool Integrations, Skill Breadth, Workflow Depth, or All).
5. User can search by username via the search bar, which filters the grid in real time.
6. Pagination controls (Prev / Next) appear when there are more than 6 matching profiles.
7. If the database is unavailable or empty, mock profile data is shown with a "(showing demo data)" label.

**Acceptance criteria:**
- [ ] User can visit `/explore` and see a grid of profile cards.
- [ ] Each profile card links to the profile's `/u/{username}` page.
- [ ] Sort by "Newest" orders profiles by `createdAt` descending.
- [ ] Sort by "Highest Score" orders profiles by `totalScore` descending.
- [ ] Sort by "Most Imports" orders profiles by bundle `importCount` descending (only profiles with published bundles appear).
- [ ] Dimension filter hides profiles whose top-scoring dimension does not match.
- [ ] Username search returns profiles whose username contains the search string (case-insensitive).
- [ ] Pagination shows 6 profiles per page with Prev/Next controls.
- [ ] Total profile count is displayed (e.g., "42 engineers scored").
- [ ] Page falls back to mock data when the database is empty or unreachable.

---

### 6. Bundle Publish / Import

**Description:** Users can publish their Claude Code configuration files (agents, commands, memory index, hooks structure) as a shareable bundle at `/publish`. Published bundles are viewable at `/u/{username}/setup` and can be imported by other users via the CLI.

**Publish flow (`/publish`):**
1. User enters their GitHub username and an optional description.
2. User adds one or more files, each with a path, category (Agent, Command, Memory Index, Hooks Structure), and pasted content.
3. User clicks "Preview and Publish" to review files before submission.
4. On confirmation, files are POSTed to `/api/bundles`.
5. The server scans all files for credentials and redacts any found before storing.
6. On success, the user sees a success state with a link to view their setup.
7. If any credentials were redacted, a summary is shown.

**View flow (`/u/{username}/setup`):**
1. Visitor navigates to `/u/{username}/setup`.
2. Page shows the published files in collapsible `<details>` sections, categorized and colour-coded by type.
3. File count, agent count, and command count are shown as summary pills.
4. Import count is shown.
5. An "Import" button triggers the CLI import flow.
6. A "Scanned by AgentScore — credentials redacted" badge confirms the safety check.

**Acceptance criteria:**
- [ ] User can add multiple files with path, category, and content at `/publish`.
- [ ] Validation prevents submission if username is empty or no valid files are provided.
- [ ] Preview step shows all files in expandable sections before final submission.
- [ ] Server scans files for API keys, tokens, and credentials before storing.
- [ ] If credentials are found, they are redacted and a summary is shown on the success screen.
- [ ] Published bundle is viewable at `/u/{username}/setup`.
- [ ] Files on the setup page are expandable and display syntax-highlighted content.
- [ ] Import count is displayed on the setup page.
- [ ] The setup page shows a "credentials redacted" badge.
- [ ] The setup page returns 404 if no bundle exists for the username.

---

### 7. Benchmark

**Description:** An interactive page at `/benchmark` where users copy standardized prompts into their Claude Code session, paste the structured output back into the page, and receive a deterministic score. Benchmark results are separate from the config-based AgentScore.

**User flow:**
1. User navigates to `/benchmark` and clicks "Load Benchmark Tasks".
2. Six tasks load, each with a title, description, prompt to copy into Claude Code, output template to fill in, and grading criteria.
3. User copies each prompt into their Claude Code session, runs the task, and fills in the output template with what happened.
4. User enters their GitHub username and clicks "Grade My Results".
5. Outputs are submitted to `/api/benchmarks/grade` as structured JSON.
6. Results are shown: an overall percentage score, pass/fail per task, and per-check pass/fail with failure reasons.

**Acceptance criteria:**
- [ ] User can load the 6 benchmark tasks by clicking "Load Benchmark Tasks".
- [ ] Each task shows a copyable prompt, output template, and grading criteria checklist.
- [ ] Tasks expand/collapse individually.
- [ ] Grading is deterministic — no AI involvement, all checks are boolean assertions.
- [ ] Submitting without filling in any output shows a validation error.
- [ ] Submitting malformed JSON in an output shows a clear error identifying which task is invalid.
- [ ] Results display an overall percentage (passed checks / total checks).
- [ ] Results show pass/fail per task and per check, with failure reasons where applicable.
- [ ] Benchmark score is clearly labelled as separate from the config-based AgentScore.

---

### 8. GitHub OAuth Auth

**Description:** Users sign in with their GitHub account. Authentication is used to determine profile ownership (showing the Rescan button and future owner-only features). The CLI uses a token-based auth flow that opens a browser window for GitHub OAuth.

**User flow (web):**
1. User clicks "Sign In" in the navbar.
2. They are redirected to GitHub OAuth.
3. After authorization, they are redirected back to AgentScore with an active session.
4. Session persists across page loads.
5. Clicking "Sign Out" clears the session.

**User flow (CLI):**
1. On first `npx agentscore export`, if no token is stored, the CLI opens a browser window to complete GitHub OAuth.
2. After authorization, a session token is stored locally.
3. The token is checked on subsequent runs; expired tokens trigger re-authentication.
4. `npx agentscore login` — initiates login explicitly.
5. `npx agentscore logout` — clears the stored token.
6. `npx agentscore whoami` — prints the currently authenticated username.

**Acceptance criteria:**
- [ ] User can sign in via the "Sign In" link in the navbar using GitHub OAuth.
- [ ] After sign-in, the navbar reflects the authenticated state.
- [ ] User can sign out; after sign out, the session is cleared.
- [ ] Profile page shows the Rescan button only when the authenticated user's GitHub ID matches the profile owner's GitHub ID.
- [ ] CLI `npx agentscore login` opens a browser and stores an auth token on completion.
- [ ] CLI `npx agentscore logout` removes the stored token.
- [ ] CLI `npx agentscore whoami` prints the authenticated username or "Not logged in".
- [ ] CLI export flow triggers login if no valid token is stored.

---

### 9. OG Image

**Description:** A dynamic open graph image generated server-side at `/api/og/{username}`. Returns a 1200x630 PNG for social sharing (Twitter/X card, link previews). Also supports a square 1080x1080 format via `?format=square`.

**Content:** Username, avatar, composite score, tier, personality blurb, top strengths as pills, radar chart rendered as SVG, and "agentscore.dev" branding.

**User flow:**
1. User shares their profile URL on social media or messaging.
2. The platform fetches the OG image from `/api/og/{username}`.
3. A branded card renders with the user's score and radar chart.

**Acceptance criteria:**
- [ ] `GET /api/og/{username}` returns a PNG image with status 200 for a valid username.
- [ ] Image is 1200x630 pixels in the default OG format.
- [ ] `GET /api/og/{username}?format=square` returns a 1080x1080 PNG.
- [ ] Image includes: username, composite score, tier, personality text, top 3 strengths, radar chart.
- [ ] Image returns 404 for an unknown username.
- [ ] Profile page `<head>` includes `og:image` and `twitter:image` meta tags pointing to the OG image URL.

---

### 10. Infographic Download

**Description:** On the profile page, a download button lets the user save their profile as a PNG image in either OG (1200x630) or square (1080x1080) format. Implemented as the `DownloadInfographic` component.

**User flow:**
1. On `/u/{username}`, the user sees a format selector (1200x630 / 1080x1080) and a Download button below the score card.
2. Selecting a format and clicking Download fetches `/api/og/{username}?format={format}`.
3. The PNG is saved to the user's machine with the filename `agentscore-{username}-{dimensions}.png`.

**Acceptance criteria:**
- [ ] A format selector with "1200x630" and "1080x1080" options is present on the profile page.
- [ ] Clicking "Download" fetches the OG image in the selected format.
- [ ] The file is saved with the filename `agentscore-{username}-1200x630.png` or `agentscore-{username}-1080x1080.png`.
- [ ] A loading spinner is shown while the download is in progress.
- [ ] Download works for any public profile, not just the owner's.

---

### 11. Manifest Upload (Web)

**Description:** A web-based alternative to the CLI at `/upload`. Users can paste manifest JSON or upload a `.json` file to receive an instant score preview in the browser without submitting to the database.

**User flow:**
1. User navigates to `/upload`.
2. User pastes manifest JSON into the textarea or uploads a `.json` file.
3. Clicking "Score My Manifest" validates the JSON and runs a client-side score calculation.
4. A score preview is shown: composite score, tier, and per-dimension bar chart.
5. A note clarifies this is a preview — submit via CLI for a full profile with radar chart and report.

**Acceptance criteria:**
- [ ] User can paste JSON into the textarea or upload a `.json` file.
- [ ] Uploading a file populates the textarea with its contents.
- [ ] "Score My Manifest" is disabled when the textarea is empty.
- [ ] Invalid JSON shows a clear error message.
- [ ] Missing required sections (agents, memory, mcpServers, hooks, commands, projects, workflows) show a specific validation error.
- [ ] Valid manifest shows a score preview with composite score, tier, and per-dimension bars.
- [ ] A message clarifies this is a preview and not the full profile.

---

## Out of Scope (MVP)

The following are intentionally not built in the current version:

- **Monetisation** — no paid plans, no subscription, no usage limits.
- **Email notifications** — no emails sent for rescan completion, follower activity, or tier changes.
- **Team or organisation profiles** — all profiles are individual GitHub users.
- **Direct manifest editing in the browser** — the web upload page is read-only scoring, not an editor that saves to a profile.
- **Comments or social features** — no likes, follows, or comments on profiles.
- **Leaderboards** — the Explore page sorts and filters but does not show a ranked leaderboard table.
- **Private profiles** — no mechanism to create a profile that is not publicly visible.
- **Profile deletion** — users cannot delete their profile via the web UI.
- **Webhook integrations** — no external webhooks triggered on score events.
- **Mobile app** — web only, no native iOS or Android application.
- **Custom scoring weights** — all dimensions are weighted equally; users cannot adjust the formula.
- **AI-generated insights beyond current report** — insights are generated from deterministic signal logic, not from an LLM at runtime.
