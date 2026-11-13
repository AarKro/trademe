# Getting started (for the team)

You don't need to know how to code. Your AI agent (e.g. Claude Code) does the setup and the technical steps. You tell it what to build and check the result.

## Once: before you start

1. **Accept the GitHub invitation** at https://github.com/AarKro/trademe/invitations (no GitHub account yet? Create one at github.com and send Aaron your username).
2. **Install Claude Code** (or open the agent you already use) and start it in a folder where your projects should live, e.g. `projects`.
3. **Paste this prompt:**

   > Set me up for the TradeMe project: install whatever is missing, log me in to GitHub, clone https://github.com/AarKro/trademe, and then follow the instructions in its AGENTS.md (section 1). Explain each step in simple words. At the end, start the app and show me how to open it.

   The agent will at some point ask you to log in to GitHub in the browser. Just follow its instructions.

## Every time you work on it

Start your agent **inside the `trademe` folder** and tell it what you want, for example:

- *"Get the latest version and start the app."*
- *"Build screen B/01 Trade erstellen exactly like in Figma."*
- *"Show me what the others changed since yesterday."*
- *"Open a pull request for my changes."*
- *"Read the feedback on my pull request and fix it."*
- *"Review Fazli's open pull request and explain it to me."*

The agent knows the team rules (from `AGENTS.md`): it works on its own branch, opens pull requests and doesn't change other people's screens.

## Who builds what

| You are | Your screens |
|---|---|
| **A** | Profile & ratings (A/10–A/16) |
| **B** | Client screens: create trade, my trades, trade detail, checkout (B/01–B/16) |
| **C** | Helper screens: discover, offer, chat, assignment (C/01–C/09) |

## Testing on your phone

- **Same Wi-Fi as your laptop:** while the app is running, open the `Network:` link (e.g. `http://192.168.1.23:5173`) on your phone.
- **As a real app icon:** once Vercel is set up, every pull request gets its own link. Open it on your phone → Safari: Share → **Add to Home Screen** / Chrome: ⋮ → **Install app**.

## If something goes wrong

Tell your agent exactly what you see (or send a screenshot), e.g. *"The app shows a white page"* or *"git says conflict"*. It knows what to do. If it still doesn't work: ask Aaron.
