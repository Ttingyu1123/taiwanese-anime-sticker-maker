---
description: Install my 11 essential skills (React, Design, Marketing, Engineering)
---

1. Create skills directories

   ```powershell
   if (!(Test-Path .agent/skills)) { New-Item -ItemType Directory -Force -Path .agent/skills }
   if (Test-Path .agent/skills/_temp) { Remove-Item -Path .agent/skills/_temp -Recurse -Force }
   New-Item -ItemType Directory -Force -Path .agent/skills/_temp
   ```

2. Clone Repositories
   // turbo-all

   ```powershell
   git clone https://github.com/vercel-labs/agent-skills .agent/skills/_temp/vercel
   git clone https://github.com/anthropics/skills .agent/skills/_temp/anthropics
   git clone https://github.com/coreyhaines31/marketingskills .agent/skills/_temp/marketing
   git clone https://github.com/nextlevelbuilder/ui-ux-pro-max-skill .agent/skills/_temp/ui-ux
   git clone https://github.com/obra/superpowers .agent/skills/_temp/obra
   git clone https://github.com/softaworks/agent-toolkit .agent/skills/_temp/softaworks
   ```

3. Install Vercel Skills (React Best Practices, Web Design)

   ```powershell
   Move-Item -Path .agent/skills/_temp/vercel/skills/react-best-practices -Destination .agent/skills/vercel-react-best-practices -Force
   Move-Item -Path .agent/skills/_temp/vercel/skills/web-design-guidelines -Destination .agent/skills/web-design-guidelines -Force
   ```

4. Install Anthropic Skills (Frontend Design, Canvas, Testing, PDF)

   ```powershell
   Move-Item -Path .agent/skills/_temp/anthropics/skills/frontend-design -Destination .agent/skills/frontend-design -Force
   Move-Item -Path .agent/skills/_temp/anthropics/skills/canvas-design -Destination .agent/skills/canvas-design -Force
   Move-Item -Path .agent/skills/_temp/anthropics/skills/webapp-testing -Destination .agent/skills/webapp-testing -Force
   Move-Item -Path .agent/skills/_temp/anthropics/skills/pdf -Destination .agent/skills/pdf -Force
   ```

5. Install Marketing Skills (Psychology, Free Tool)

   ```powershell
   Move-Item -Path .agent/skills/_temp/marketing/skills/marketing-psychology -Destination .agent/skills/marketing-psychology -Force
   Move-Item -Path .agent/skills/_temp/marketing/skills/free-tool-strategy -Destination .agent/skills/free-tool-strategy -Force
   ```

6. Install Engineering Skills (Debugging, Commit)

   ```powershell
   Move-Item -Path .agent/skills/_temp/obra/skills/systematic-debugging -Destination .agent/skills/systematic-debugging -Force
   Move-Item -Path .agent/skills/_temp/softaworks/skills/commit-work -Destination .agent/skills/commit-work -Force
   ```

7. Install UI/UX Pro Max (Manual Setup)

   ```powershell
   Move-Item -Path .agent/skills/_temp/ui-ux/src/ui-ux-pro-max -Destination .agent/skills/ui-ux-pro-max -Force
   ```

8. Create SKILL.md for UI/UX Pro Max
   Use the `write_to_file` tool to create `.agent/skills/ui-ux-pro-max/SKILL.md` with the following content:

   ```markdown
   ---
   name: ui-ux-pro-max
   description: AI-powered design intelligence with 50+ styles, 95+ color palettes, and automated design system generation. Use this skill when the user asks for design systems, UI styles, color palettes, or specific industry design advice.
   ---

   # UI/UX Pro Max

   This skill uses a Python-based reasoning engine to generate professional design systems and UI recommendations.

   ## Usage

   To use this skill, you run the python script located in `scripts/search.py`.

   ### Generate Design System

   When the user asks for a design system or UI plan for a project:

   ```bash
   python .agent/skills/ui-ux-pro-max/scripts/search.py "YOUR SEARCH QUERY" --design-system -p "PROJECT_NAME"
   ```

   ### Domain-Specific Search

   For specific design elements:

   ```bash
   # Colors
   python .agent/skills/ui-ux-pro-max/scripts/search.py "pastel soothing" --domain color

   # Typography
   python .agent/skills/ui-ux-pro-max/scripts/search.py "modern sans serif" --domain typography
   ```

   ```

9. Cleanup

   ```powershell
   Remove-Item -Path .agent/skills/_temp -Recurse -Force
   ```

10. Verify Installation

    ```powershell
    Get-ChildItem .agent/skills | Select-Object Name
    ```
