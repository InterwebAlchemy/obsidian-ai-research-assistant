# Contributor's Guide

This document is a guide for people who want to contribute to the project.

## How to contribute

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v16 or later)
- [Obsidian.md](https://obsidian.md/) (v1.1.0 or later)

## Getting Started

1. [Fork](https://github.com/InterwebAlchemy/obsidian-ai-research-assistant) this repository
2. Clone your fork into a local Obsidian Vault's `.obsidian/plugins` directory
3. `cd` into `obisidan-ai-research-assistant`
4. Create a new branch for your changes with the `feature/*` prefix (**Example**:
   `feature/my-new-feature`)
5. Run `npm install`
6. Run `npm run dev` to start the development server
7. Make your changes locally
8. Test your changes
9. Commit your changes to your branch
10. Push your changes to your fork
11. [Create a Pull Request](https://github.com/InterwebAlchemy/obsidian-ai-research-assistant/compare)
    against the `main` branch of this repository

**Note**: During development, it is recommended to have a separate Obsidian vault for testing the
plugin, and to also install the [Obsidian Hot Reload](https://github.com/pjeby/hot-reload) plugin to
automatically reload the plugin when you make changes.

## Building the plugin

1. Run `npm run build` to build the plugin
2. The built files can be found in `/dist`

## Conventions

This project uses the following tools, standards, and conventions to enforce code style, formatting,
etc.:

- [TypeScript](https://www.typescriptlang.org/)
- [husky](https://typicode.github.io/husky/)
  - `pre-commit`: [`lint-staged`](https://github.com/okonet/lint-staged)
    - [ESLint](https://eslint.org/)
      - [Standard with TypeScript](https://github.com/standard/eslint-config-standard-with-typescript)
    - [Prettier](https://prettier.io/)
    - [yamllint](https://github.com/adrienverge/yamllint)
    - [scriptlint](https://github.com/peerigon/scriptlint)
  - `commit-msg`: [`commitlint`](https://commitlint.js.org/)
    - [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

**Note**: You can use the [`@commitlint/prompt-cli`](https://commitlint.js.org/#/guides-use-prompt)
via `npx commit` if you want help formatting your commit messages properly.

## Releasing New Versions

Releases are automatically generated via [`semantic-release`](https://github.com/semantic-release/semantic-release) when code is pushed to `main`
