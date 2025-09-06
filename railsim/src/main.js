import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function initRailSim(container) {
  if (!container) {
    throw new Error('Container element not provided');
  }
  container.style.position = 'relative';
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width === 0 || height === 0) {
    throw new Error('Container must have non-zero width and height');
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const trackLength = 5;
  let trainSpeed = 0.01;
  let isMoving = true;
  const trains = [];

  // Simple dual-rail track
  const railMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });
  const railGeometry = new THREE.BoxGeometry(trackLength, 0.05, 0.05);
  const leftRail = new THREE.Mesh(railGeometry, railMaterial);
  leftRail.position.z = -0.15;
  const rightRail = leftRail.clone();
  rightRail.position.z = 0.15;
  scene.add(leftRail);
  scene.add(rightRail);

  // Simple train model
  const trainGeometry = new THREE.BoxGeometry(0.5, 0.5, 1);
  const trainMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  function createTrain() {
    const mesh = new THREE.Mesh(trainGeometry, trainMaterial);
    mesh.position.set(-trackLength / 2, 0.3, 0);
    scene.add(mesh);
    trains.push({ mesh, direction: 1 });
  }
  createTrain();

  camera.position.z = 5;
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;

  function clampTrain(mesh) {
    mesh.position.x = Math.max(Math.min(mesh.position.x, trackLength / 2), -trackLength / 2);
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    if (isMoving) {
      for (const t of trains) {
        t.mesh.position.x += trainSpeed * t.direction;
        if (t.mesh.position.x > trackLength / 2 || t.mesh.position.x < -trackLength / 2) {
          t.direction *= -1;
          clampTrain(t.mesh);
        }
      }
    }
    orbit.update();
    renderer.render(scene, camera);
  }
  animate();

  function onWindowResize() {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    if (newWidth === 0 || newHeight === 0) {
      return;
    }
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  }
  window.addEventListener('resize', onWindowResize);

  // Basic keyboard controls
  function onKeyDown(e) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
    }
    const primaryTrain = trains[0]?.mesh;
    switch (e.key) {
      case 'ArrowLeft':
        if (primaryTrain) {
          primaryTrain.position.x -= 0.1;
          clampTrain(primaryTrain);
        }
        break;
      case 'ArrowRight':
        if (primaryTrain) {
          primaryTrain.position.x += 0.1;
          clampTrain(primaryTrain);
        }
        break;
      case 'ArrowUp':
        camera.position.z -= 0.1;
        break;
      case 'ArrowDown':
        camera.position.z += 0.1;
        break;
    }
  }
  window.addEventListener('keydown', onKeyDown);

  // Train management UI controls
  const ui = document.createElement('div');
  ui.style.position = 'absolute';
  ui.style.top = '10px';
  ui.style.left = '10px';
  ui.style.background = 'rgba(255,255,255,0.8)';
  ui.style.padding = '5px';

  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'Pause';
  function toggleHandler() {
    isMoving = !isMoving;
    toggleBtn.textContent = isMoving ? 'Pause' : 'Start';
  }
  toggleBtn.addEventListener('click', toggleHandler);

  const speedInput = document.createElement('input');
  speedInput.type = 'range';
  speedInput.min = '0';
  speedInput.max = '0.1';
  speedInput.step = '0.005';
  speedInput.value = trainSpeed.toString();
  function speedHandler() {
    const value = parseFloat(speedInput.value);
    if (!isNaN(value)) {
      trainSpeed = value;
    }
  }
  speedInput.addEventListener('input', speedHandler);

  const addTrainBtn = document.createElement('button');
  addTrainBtn.textContent = 'Add Train';
  function addTrainHandler() {
    createTrain();
  }
  addTrainBtn.addEventListener('click', addTrainHandler);

  ui.appendChild(toggleBtn);
  ui.appendChild(speedInput);
  ui.appendChild(addTrainBtn);
  container.appendChild(ui);

  function dispose() {
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('keydown', onKeyDown);
    toggleBtn.removeEventListener('click', toggleHandler);
    speedInput.removeEventListener('input', speedHandler);
    addTrainBtn.removeEventListener('click', addTrainHandler);
    orbit.dispose();
    for (const t of trains) {
      scene.remove(t.mesh);
    }
    scene.remove(leftRail);
    scene.remove(rightRail);
    trainGeometry.dispose();
    trainMaterial.dispose();
    railGeometry.dispose();
    railMaterial.dispose();
    if (container.contains(ui)) {
      container.removeChild(ui);
    }
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
    renderer.dispose();
  }
  return { dispose };
}

/*
#1 Actual updates: added multi-train support with an Add Train button and expanded cleanup to remove rail meshes and dispose their resources.
#2 Next steps: implement track switching, richer management UI, and basic collision handling.
#3 Found errors + solutions: single-train logic limited expansion -> refactored to trains array; missing rail cleanup -> remove rails and dispose rail geometry/material.
*/
