# Instructions for coding agents (Claude Code, Codex, Cursor, …)

You are helping one of three students build **TradeMe**, a school project. **The people you work with are not developers.** Explain what you do in plain language, avoid jargon, and do the technical steps (git, terminal, installs) for them instead of asking them to.

Read `README.md` for the architecture, business rules and who owns which screens.

---

## 1. First-time setup on a new computer

When the person asks to "set me up", work through this list. Check each step first and skip what already works.

1. **Tools.** Check `git --version`, `node --version` (needs v20 or newer) and `gh --version`. Install what's missing:
   - macOS: `xcode-select --install` (git); Node.js LTS from https://nodejs.org or `brew install node`; `brew install gh` (install Homebrew first if needed: https://brew.sh).
   - Windows: `winget install Git.Git OpenJS.NodeJS.LTS GitHub.cli`, then restart the terminal.
2. **GitHub login.** Run `gh auth status`. If not logged in, ask the person to run `gh auth login` themselves, because it's interactive. In Claude Code they type `! gh auth login` and choose GitHub.com → HTTPS → "Login with a web browser". Then run `gh auth setup-git`.
3. **Repo invitation.** If cloning fails with "not found" or "permission denied", the person still has to accept the invitation at https://github.com/AarKro/trademe/invitations.
4. **Get the code.** `gh repo clone AarKro/trademe` into a sensible folder (e.g. `~/projects/trademe`), then work inside it.
5. **Git identity.** If `git config user.name` is empty, ask for their name and set `git config --global user.name "…"` and `git config --global user.email "…"` (the email of their GitHub account).
6. **Install and start.** `cd app && npm install && npm run dev`. Show them the `Local:` link to open in the browser and the `Network:` link for their phone (same Wi-Fi). `app/.env` is already configured, so no keys are needed.
7. **Log in.** In the app, create an account with any email and password. Email confirmation is turned off.
8. **Figma (optional, very useful).** If the Figma MCP/connector is available, use it to read the designs. File key `dETgmOrzpSrCUgGTq8XBj5`, page «Screens V4». Every route's frame IDs are in `app/src/screens/registry.ts`.

Finally, tell them in 2–3 sentences what works now and how to start the app next time (`cd app && npm run dev`).

---

## 2. Daily workflow: always through pull requests

**Never commit directly to `main`.** Every change goes through a branch and a pull request (PR), so the others can look at it first.

### Start of every session
```bash
git switch main && git pull           # get the latest version
cd app && npm install                 # in case someone added packages
```
If the person has unfinished work on another branch, ask whether to continue there.

### Building something
1. Create a branch named after the owner letter and the task: `git switch -c b/trade-erstellen` (A = profile/ratings, B = client screens, C = helper screens).
2. Build in small steps and show the person the result in the browser often.
3. Before committing, run `npm run build` and `npm run lint` in `app/`. Fix errors before you continue.
4. Commit with a short, clear message in English or German: `git add -A && git commit -m "Trade erstellen: Formular + Speichern"`.

### Opening a pull request
```bash
git push -u origin HEAD
gh pr create --title "…" --body "…"
```
Write the PR body for non-developers: **what** changed (which screens/Figma frames), **how to test it** (steps in the app), and what is **not done yet**. Then give the person the PR link and tell them to share it with the team.

### Reading PRs and feedback
- List open PRs: `gh pr list`
- Read a PR with its discussion: `gh pr view <number> --comments`
- See the code changes: `gh pr diff <number>`
- Read inline review comments: `gh api repos/AarKro/trademe/pulls/<number>/comments --jq '.[] | {path, line, body, user: .user.login}'`
- Check the automatic checks / Vercel preview: `gh pr checks <number>`. The Vercel bot also posts a preview link as a comment, which the person can open on their phone.

When someone left feedback on *your* person's PR: summarise it in plain language, propose what to change, make the changes on the same branch, then `git push`. The PR updates automatically.

### Reviewing someone else's PR
When asked to review: read it with `gh pr view` and `gh pr diff`, try it locally with `gh pr checkout <number>` + `npm run dev`, then explain to your person what it does and whether something looks wrong. Only post a review when they agree:
`gh pr review <number> --comment --body "…"` or `--approve`. Afterwards switch back with `git switch -`.

### Merging
Only merge when the person explicitly says so **and** at least one other team member approved it or said OK:
`gh pr merge <number> --squash --delete-branch`, then `git switch main && git pull`.

### Conflicts
If `git pull` or a merge reports a conflict, don't panic and don't discard anyone's work. Explain what happened in one sentence, resolve it so that both changes are kept, run `npm run build`, and ask the person to check the result in the browser.

---

## 3. Project rules (follow them strictly)

- **Stay in your area.** Only change screens owned by your person's letter (see `app/src/screens/registry.ts`). Shared files (`components/`, `styles/tokens.css`, `routes.tsx`, `lib/`) may be changed, but mention it in the PR so the others notice.
- **New screen:** create it in `app/src/screens/<area>/…tsx` and register it in `app/src/routes.tsx` under `built`. The route already exists in `registry.ts`.
- **Look:** use only the CSS variables from `app/src/styles/tokens.css` and the text classes (`text-h1`, `text-body`, …). No raw colours like `#8e2d7a` or pixel values in components. If Figma has a value that's missing, add it to `tokens.css` under the Figma variable name. Icons come from `lucide-react`.
- **Texts in the UI are German (Swiss spelling, «ss» instead of «ß»).** Code and comments are English.
- **Data:** read and write with the Supabase client from `app/src/lib/supabase.ts`. **Never** change a trade's `status` directly. Use the functions (`supabase.rpc('accept_offer' | 'report_done' | 'release_trade' | 'report_problem' | 'cancel_trade', …)`), see the README table.
- **Database changes** (new tables/columns) affect everyone. Create a new file in `supabase/migrations/` and **ask the person to check with Aaron** before running `npx supabase db push --remote`. Never edit or delete existing migration files.
- **Secrets:** never put keys other than the ones already in `app/.env` into the code or commit them. The Supabase *service_role/secret* key and Stripe secret keys belong only in Vercel.
- Keep changes small and focused. One PR per screen or feature is ideal.
