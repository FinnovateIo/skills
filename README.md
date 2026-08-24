# Finnovate.io Skills

Repo for standardizing Claude Code agent configs for Finnovate.io.

Contains a shared set of **rules** and **skills** for Claude Code, plus an interactive installer for easy installation locally or globally.

## What's Included

### Rules

Located in [`rules/`](rules): coding standards and conventions, with language-agnostic `common`rules plus language/framework-specific extensions (`css`, `react`, `scss`, `typescript`, ...). Language-specific rules override `common` where conventions differ. Glob patterns are used to apply rules automatically.

### Skills

Located in [`skills/`](skills): tools Claude or the user can invoke, such as `review-code`, `to-spec`, `to-tickets`, and `whiteboard`.

## Getting Started

### One-line install (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/FinnovateIo/skills/main/install.sh | bash
```

This downloads the repo, installs its dependencies, and launches the interactive installer.

### Local clone

```bash
git clone https://github.com/FinnovateIo/skills.git
cd skills
./install.sh
```

Requires [Node.js](https://nodejs.org) 24+ (see `.nvmrc`) and `npm`.

## Usage

With no options, the installer installs everything and prompts for a destination. You can also drive it non-interactively:

```bash
# See what's available
./install.sh --list

# Install everything to ~/.claude
./install.sh --global

# Install everything to ./.claude in the current project
./install.sh --local

# Only specific rules/skills
./install.sh --rules typescript,react --skills review-code --local

# Preview without writing anything
./install.sh --dry-run --global

# Overwrite conflicting files without prompting
./install.sh --force --global
```

Run `./install.sh --help` for the full option list.

## License

MIT — see [LICENSE](LICENSE). Third-party licenses used by this project are listed in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
