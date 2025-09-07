/**
 * Tests for initRailSim in railsim/src/main.js
 * Framework: Jest + jsdom (no new dependencies introduced).
 * We mock three.js and OrbitControls to make rendering side-effect-free and observable.
 */

jest.useFakeTimers();

function setRAF() {
  // Tie rAF to timers so we can deterministically advance frames
  global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
}

beforeEach(() => {
  document.body.innerHTML = "";
  jest.resetModules();
  jest.clearAllTimers();
  setRAF();
});

afterEach(() => {
  jest.clearAllMocks();
});

jest.mock('three', () => {
  const registry = {
    materials: [],
    geometries: [],
    meshes: [],
    scenes: [],
    renderers: [],
  };

  class MeshBasicMaterial {
    constructor(opts = {}) {
      this.color = opts.color;
      this.disposed = false;
      this.dispose = jest.fn(() => { this.disposed = true; });
      registry.materials.push(this);
    }
    clone() {
      return new MeshBasicMaterial({ color: this.color });
    }
  }

  class BoxGeometry {
    constructor(a, b, c) {
      this.args = [a, b, c];
      this.disposed = false;
      this.dispose = jest.fn(() => { this.disposed = true; });
      registry.geometries.push(this);
    }
  }

  class Mesh {
    constructor(geometry, material) {
      this.geometry = geometry;
      this.material = material;
      this.position = {
        x: 0, y: 0, z: 0,
        set: (x, y, z) => { this.position.x = x; this.position.y = y; this.position.z = z; }
      };
    }
    clone() {
      return new Mesh(this.geometry, this.material);
    }
  }

  class Scene {
    constructor() {
      this.objects = new Set();
      registry.scenes.push(this);
    }
    add(obj) { this.objects.add(obj); }
    remove(obj) { this.objects.delete(obj); }
  }

  class PerspectiveCamera {
    constructor() {
      this.position = { z: 0 };
      this.aspect = 1;
      this.updateProjectionMatrix = jest.fn();
    }
  }

  class WebGLRenderer {
    constructor() {
      this.domElement = (() => {
        const c = document.createElement('canvas');
        c.getContext = () => ({});
        return c;
      })();
      this.setSize = jest.fn();
      this.render = jest.fn();
      this.dispose = jest.fn();
      registry.renderers.push(this);
    }
  }

  return {
    __esModule: true,
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    MeshBasicMaterial,
    BoxGeometry,
    Mesh,
    // Helpful registry for assertions
    __REGISTRY: registry,
  };
});

jest.mock('three/examples/jsm/controls/OrbitControls.js', () => {
  const OrbitControls = jest.fn().mockImplementation(() => ({
    enableDamping: true,
    update: jest.fn(),
    dispose: jest.fn(),
  }));
  return { __esModule: true, OrbitControls };
});

function makeContainer(w = 800, h = 600) {
  const el = document.createElement('div');
  Object.defineProperty(el, 'clientWidth', { value: w, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: h, configurable: true });
  // Ensure keyboard events can target it
  el.tabIndex = 0;
  document.body.appendChild(el);
  return el;
}

describe('initRailSim', () => {
  test('throws when container is missing', async () => {
    const { initRailSim } = await import('../main.js');
    expect(() => initRailSim()).toThrow(/Container element not provided/);
  });

  test('throws when container has zero width/height', async () => {
    const { initRailSim } = await import('../main.js');
    const c = makeContainer(0, 0);
    expect(() => initRailSim(c)).toThrow(/Container must have non-zero width and height/);
  });

  test('initializes renderer canvas and UI controls, and toggles Pause/Start', async () => {
    const { initRailSim } = await import('../main.js');
    const THREE = (await import('three')).__REGISTRY;
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

    const c = makeContainer();
    const { dispose } = initRailSim(c);

    // Renderer canvas appended
    expect(c.querySelector('canvas')).toBeTruthy();

    // UI controls exist: two buttons and a range input
    const buttons = c.querySelectorAll('button');
    const range = c.querySelector('input[type="range"]');
    expect(buttons.length).toBe(2);
    expect(range).toBeTruthy();

    // Toggle button changes label Pause <-> Start
    const toggleBtn = buttons[0];
    expect(toggleBtn.textContent).toBe('Pause');
    toggleBtn.click();
    expect(toggleBtn.textContent).toBe('Start');
    toggleBtn.click();
    expect(toggleBtn.textContent).toBe('Pause');

    // OrbitControls constructed
    expect(OrbitControls).toHaveBeenCalledTimes(1);

    dispose();
  });

  test('multi-train support: Add Train adds trains and they animate within track bounds', async () => {
    const { initRailSim } = await import('../main.js');
    const THREE = (await import('three')).__REGISTRY;

    const c = makeContainer();
    const { dispose } = initRailSim(c);

    // One train exists initially. Identify trains by their geometry dimensions (0.5, 0.5, 1)
    const countTrains = () =>
      [...THREE.scenes[0].objects].filter(
        (m) => m.geometry && Array.isArray(m.geometry.args) &&
               m.geometry.args[0] === 0.5 && m.geometry.args[1] === 0.5 && m.geometry.args[2] === 1
      ).length;

    expect(countTrains()).toBe(1);

    // Click "Add Train" three times -> total should be 4
    const addBtn = [...c.querySelectorAll('button')].find(b => /Add Train/i.test(b.textContent));
    addBtn.click(); addBtn.click(); addBtn.click();
    expect(countTrains()).toBe(4);

    // Increase speed to max and advance enough frames to hit/bounce boundary
    const speed = c.querySelector('input[type="range"]');
    speed.value = '0.1';
    speed.dispatchEvent(new Event('input', { bubbles: true }));

    // Advance ~51 frames (from -2.5 to >= 2.5 with speed 0.1)
    jest.advanceTimersByTime(51 * 16);

    // All trains remain clamped within [-2.5, 2.5]
    const trains = [...THREE.scenes[0].objects].filter(
      (m) => m.geometry && m.geometry.args && m.geometry.args[0] === 0.5
    );
    for (const t of trains) {
      expect(t.position.x).toBeGreaterThanOrEqual(-2.5);
      expect(t.position.x).toBeLessThanOrEqual(2.5);
    }

    dispose();
  });

  test('resize handler updates camera aspect and renderer size; no updates when width/height become 0', async () => {
    const { initRailSim } = await import('../main.js');
    const THREE = await import('three');

    const c = makeContainer(640, 480);
    const { dispose } = initRailSim(c);

    // Renderer instance
    const renderer = THREE.__REGISTRY.renderers[0];
    renderer.setSize.mockClear();

    // Trigger resize with new non-zero size
    Object.defineProperty(c, 'clientWidth', { value: 320, configurable: true });
    Object.defineProperty(c, 'clientHeight', { value: 240, configurable: true });
    window.dispatchEvent(new Event('resize'));
    expect(renderer.setSize).toHaveBeenCalledWith(320, 240);

    // Now simulate zero size -> handler should early-return and not call setSize again
    renderer.setSize.mockClear();
    Object.defineProperty(c, 'clientWidth', { value: 0, configurable: true });
    Object.defineProperty(c, 'clientHeight', { value: 0, configurable: true });
    window.dispatchEvent(new Event('resize'));
    expect(renderer.setSize).not.toHaveBeenCalled();

    dispose();
  });

  test('dispose removes UI and canvas, disposes controls/renderer and rail/train resources', async () => {
    const { initRailSim } = await import('../main.js');
    const THREE = await import('three');
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

    const c = makeContainer();
    const { dispose } = initRailSim(c);

    const renderer = THREE.__REGISTRY.renderers[0];

    // Capture references to original rail/train materials/geometries by color/size
    const rails = THREE.__REGISTRY.materials.filter(m => m.color === 0x555555);
    const trains = THREE.__REGISTRY.materials.filter(m => m.color === 0xff0000);
    const railGeoms = THREE.__REGISTRY.geometries.filter(g => g.args[0] === 5 && g.args[1] === 0.05 && g.args[2] === 0.05);
    const trainGeoms = THREE.__REGISTRY.geometries.filter(g => g.args[0] === 0.5 && g.args[1] === 0.5 && g.args[2] === 1);

    // Sanity: created resources exist
    expect(rails.length).toBeGreaterThanOrEqual(1);
    expect(trains.length).toBeGreaterThanOrEqual(1);
    expect(railGeoms.length).toBeGreaterThanOrEqual(1);
    expect(trainGeoms.length).toBeGreaterThanOrEqual(1);

    // Ensure UI + canvas present before dispose
    expect(c.querySelector('canvas')).toBeTruthy();
    expect(c.querySelector('button')).toBeTruthy();

    dispose();

    // UI and renderer canvas removed
    expect(c.querySelector('canvas')).toBeFalsy();
    expect(c.querySelector('button')).toBeFalsy();
    expect(c.childElementCount).toBe(0);

    // Renderer disposed
    expect(renderer.dispose).toHaveBeenCalled();

    // Controls disposed
    const controlsInstance = OrbitControls.mock.results[0]?.value;
    expect(controlsInstance.dispose).toHaveBeenCalled();

    // Rail resources disposed
    expect(rails[0].dispose).toHaveBeenCalled();
    expect(railGeoms[0].dispose).toHaveBeenCalled();

    // Train base resources disposed (note: cloned materials used by trains are not disposed by current implementation)
    expect(trains[0].dispose).toHaveBeenCalled();
    expect(trainGeoms[0].dispose).toHaveBeenCalled();
  });
});