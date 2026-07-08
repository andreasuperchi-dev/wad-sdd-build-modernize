# wad-sdd-build-modernize

**WeAreDevelopers Full-Day Hands-On Lab — Spec-Driven Development: Building & Modernizing with Agentic AI.**

This is a [MoaW](https://moaw.dev) workshop. The best way to read it is rendered:

👉 **[Open the workshop on MoaW](https://moaw.dev/workshop/gh:jkordick/wad-sdd-build-modernize/main/docs/)**

Or read the raw markdown: [`docs/workshop.md`](docs/workshop.md).

The lab is deliberately **open at the agentic-AI-tool level**. Hands-on exercises are covered for the three currently dominant surfaces:

- **GitHub Copilot** in VS Code
- **GitHub Copilot CLI**
- **Claude Code** (Anthropic)

## What you'll learn

1. **Getting started with agentic coding**: completions, chat, agent/plan modes, terminal agents, project-level instructions (`copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md`), reusable prompts / slash commands, custom agents / subagents, skills and MCP — on all three surfaces.
2. **Spec-Driven Development (SDD)**: Make specifications, not vibes, drive what the agent builds. End-to-end TypeScript/Node example, portable across Copilot and Claude Code.
3. **spec-kit**: an open-source toolkit by the GitHub team that formalizes the SDD loop across many agentic coding tools.
4. (coming) **SDD for app modernization**: a dedicated hands-on chapter on using SDD to modernize legacy apps.

## Pre-reqs

- A GitHub account with Copilot access (Free, Pro, Business or Enterprise)
- VS Code with the GitHub Copilot + Copilot Chat extensions
- Node.js 20+
- GitHub CLI (`gh`) and the GitHub Copilot CLI (`copilot`)
- Optional but recommended: **Claude Code** (`@anthropic-ai/claude-code`) with an Anthropic account that has Claude Code access

See [the Pre-requisites section of the workshop](docs/workshop.md#pre-requisites) for full details.

## Credits

Based on the [`jkordick/ghcp-advanced`](https://github.com/jkordick/ghcp-advanced) workshop (Chapters 1–3 and the modernization placeholder), extended to be tool-agnostic across GitHub Copilot, the Copilot CLI and Claude Code for the WeAreDevelopers full-day lab.

Originally inspired by the excellent [GitHub Copilot HoL by @Philess](https://moaw.dev/workshop/gh:Philess/GHCopilotHoL/main/docs/).

## License

MIT — see [LICENSE](LICENSE).

## Advanced feature endpoints (stories 06–09)

The project now includes additional endpoints for curator tools and customer engagement:

- `POST /admin/ducks` — curator-only duck creation (requires `x-admin-password` matching `ADMIN_PASSWORD`)
- `GET /ducks/featured` — deterministic Duck of the Day
- `POST /quiz/result` — deterministic personality quiz recommendation
- `GET /` — static no-build web frontend shell

See [specs/001-curator-quiz-frontend/contracts/advanced-features.openapi.yaml](specs/001-curator-quiz-frontend/contracts/advanced-features.openapi.yaml) for request/response details.
