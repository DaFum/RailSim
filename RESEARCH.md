# Reddit App Development Research

- The [Devvit CLI](https://www.npmjs.com/package/devvit) is the command line interface for building apps on Reddit's Developer Platform.
- Developers sign up at [developers.reddit.com](https://developers.reddit.com) to access documentation and example apps.
- The CLI supports a **playtest** command for local development. Running `devvit playtest` starts a local environment to test apps before submission.
- Projects can integrate libraries like **three.js** for rendering 3D graphics. Installing with `npm install three` adds the library to the project.
- Best practices include version control with Git and ignoring `node_modules` via `.gitignore`.
- Devvit apps require a `devvit.yaml` file that defines at minimum the app's `name`, enabling `devvit playtest` to run.
- Standard DOM elements like `<button>` and `<input type="range">` can provide simple UI controls alongside three.js scenes.

This project sets up a basic Devvit application named *RailSim* and includes three.js to render 3D train simulations.

- `OrbitControls` from `three/examples/jsm/controls/OrbitControls.js` enables mouse-driven camera rotation and zoom for three.js scenes.
- Parsing values from DOM inputs should check for `NaN` to prevent unexpected behavior from invalid user input.
- Canvas sizing should rely on container dimensions instead of `window` measurements to avoid layout issues when the renderer isn't fullscreen.
- Keyboard handlers can call `preventDefault()` on arrow keys to stop the browser from scrolling while using them for simulation controls.
- Cleaning up three.js scenes requires removing event listeners and disposing renderers to avoid memory leaks during repeated mounts.
- `OrbitControls.dispose()` must be called to remove its internally registered DOM listeners.
- Use `element.contains(child)` before calling `removeChild` to avoid exceptions when nodes are already detached.
