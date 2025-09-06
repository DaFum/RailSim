# RailSim Agent Guide

RailSim is a [Devvit](https://www.npmjs.com/package/devvit) app that uses three.js to render a simple train simulation for Reddit. The actual project lives inside the `railsim/` directory.

## Project Structure
- `railsim/src/main.js` – entry module exporting `initRailSim(container)`; returns `dispose()` for cleanup.
- `railsim/package.json` – NPM scripts and three.js dependency.
- `railsim/devvit.yaml` – minimal Devvit configuration.
- `RESEARCH.md` – background notes and useful references.

## Development Workflow
1. `cd railsim`
2. `npm install`
3. `npm test` *(no tests yet; this will report "no test specified")*
4. `npm run dev` to launch a playtest session.
   - You may need to authenticate with Devvit via `npx devvit login` outside the container.

## Current Functionality
- Renders a dual-rail track with one or more train boxes.
- Keyboard arrows move the first train and camera.
- Mouse navigation via `OrbitControls`.
- UI buttons allow pausing, adjusting train speed, and adding trains.
- Cleanup routine removes listeners, DOM nodes, trains, and disposes three.js resources.

## Ongoing Goals
- Implement track switching and basic collision handling.
- Expand the management UI for additional train controls.
- Maintain thorough cleanup to avoid memory leaks in repeated mounts.

## Plan Style Consideration
Three styles were evaluated:
- **Waterfall:** clear phases but too rigid for exploratory feature work.
- **Kanban:** flexible yet can drift without defined milestones.
- **Milestone-based iterative:** groups related tasks into small releases, balancing structure and adaptability.

We will use the milestone-based approach so each iteration delivers a cohesive feature set and provides natural checkpoints for review.

## LLM-Assisted Development Plan
1. **Track Switching Infrastructure**
   - Model track segments and junctions.
   - Allow trains to choose paths at switches via a simple UI.
2. **Collision Detection**
   - Track each train's position along the rails.
   - Halt and highlight trains that occupy the same segment simultaneously.
3. **Enhanced Train Management UI**
   - List all trains with controls for speed, pause, and removal.
   - Persist user changes during the session.
4. **Modularization and Testing**
   - Extract track and train logic into separate modules.
   - Add basic unit tests for pathing and collision checks.
5. **Deployment Prep**
   - Document setup and usage in `README`.
   - Configure CI for linting and tests.

<!--
#1 Actual updates: documented a milestone-based development plan and expanded cleanup to dispose rail resources.
#2 Next steps: implement track switching, add collision handling, and enhance management UI.
#3 Found errors + solutions: rail meshes and materials were not disposed -> removed rails and disposed their resources during teardown.
-->
