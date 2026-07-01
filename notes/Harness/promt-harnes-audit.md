Please do a full harness audit before we rewrite the AGENTS.md files.

Report the following:

1. DOCUMENTATION STATUS
    - List all files in docs/ and docs/architecture/ with their last modified date
    - For each file: one line summary of what it contains
    - Which files look outdated vs current git activity (check last 10 commits)
    - Does .planning/ contain anything or is it empty?

2. SKILLS INVENTORY
    - List all skills in ~/.config/opencode/skills/
    - Group them: custom (written by us) vs installed packages
    - Which skills are currently referenced in AGENTS.md (global and project)?
    - Which skills exist but are never mentioned in any AGENTS.md?

3. MCP STATUS
    - List all connected MCP servers from your config
    - Which ones do you actually use regularly vs which are configured but rarely used?

4. JSDOC STATUS
    - Scan composables in app/composables/ and components in app/components/
    - How many have JSDoc comments vs how many don't?
    - List files with zero documentation

5. YOUR ASSESSMENT
    - What documentation is missing that should exist based on current codebase?
    - Is .planning/ folder actually being used or is it dead weight?
    - What would you recommend as the minimal required docs set for this project?

Be honest and direct. This audit will be used to rewrite AGENTS.md files.
