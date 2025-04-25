import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// Scene
const scene = new THREE.Scene();


// Camera
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 10);

// Contorls
const controls = new PointerLockControls(camera, document.body);

document.body.addEventListener('click', () => {
  controls.lock();
});

const keysPressed = {
  forward: false,
  backward: false,
  left: false,
  right: false
};

const moveSpeed = 0.3;

document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW':
      keysPressed.forward = true;
      break;
    case 'KeyS':
      keysPressed.backward = true;
      break;
    case 'KeyA':
      keysPressed.left = true;
      break;
    case 'KeyD':
      keysPressed.right = true;
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW':
      keysPressed.forward = false;
      break;
    case 'KeyS':
      keysPressed.backward = false;
      break;
    case 'KeyA':
      keysPressed.left = false;
      break;
    case 'KeyD':
      keysPressed.right = false;
      break;
  }
});

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Island
const islandGeometry = new THREE.CylinderGeometry(50, 200, 50, 32);
const islandMaterial = new THREE.MeshStandardMaterial({ color: 0xdeb887 }); //sand color
const island = new THREE.Mesh(islandGeometry, islandMaterial);
island.position.y = -25;
scene.add(island);

// Water
const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
const waterMaterial = new THREE.MeshPhongMaterial({ color: 0x1ca3ec, transparent: true, opacity: 0.8 });
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.y = -2;
scene.add(water);

// Sun (directional light)
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
scene.add(sun);

// Soft ambient light
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

// Skydome
const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide });
const skydome = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skydome);
let timeOfDay = 0; // 0 to 1 range: 0 = midnight, 0.5 = noon, 1 = next midnight

//Clock for normalizing speeds
const clock = new THREE.Clock();

// Render loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta(); // seconds since last frame
  const frameSpeed = moveSpeed * delta * 60;

  // Time of day update
  timeOfDay += delta*0.01; // Tiem of day tickrate
  if (timeOfDay > 1) timeOfDay = 0;

  // Sky color: blend from dark (night) to light (day)
  const skyColor = new THREE.Color();
  if (timeOfDay < 0.5) {
    // Sunrise to noon
    skyColor.lerpColors(new THREE.Color(0x000033), new THREE.Color(0x87ceeb), timeOfDay * 2);
  } else {
    // Noon to sunset
    skyColor.lerpColors(new THREE.Color(0x87ceeb), new THREE.Color(0x000033), (timeOfDay - 0.5) * 2);
  }
  skydome.material.color = skyColor;

  // Ambient light intensity
  const brightness = (skyColor.r + skyColor.g + skyColor.b) / 3;
  ambient.intensity = THREE.MathUtils.clamp(brightness, 0.2, 1);

  // Sun direction and brightness
  sun.intensity = ambient.intensity;
  sun.position.set(
    Math.cos(timeOfDay * Math.PI * 2) * 100,
    Math.sin(timeOfDay * Math.PI * 2) * 100,
    0
  );

  
  //Camera movement
  if (controls.isLocked) {
    const direction = new THREE.Vector3();
    const velocity = new THREE.Vector3();

    if (keysPressed.forward) velocity.z -= frameSpeed;
    if (keysPressed.backward) velocity.z += frameSpeed;
    if (keysPressed.left) velocity.x -= frameSpeed;
    if (keysPressed.right) velocity.x += frameSpeed;

    direction.copy(velocity).applyQuaternion(camera.quaternion);
    controls.getObject().position.add(direction);
  }

  renderer.render(scene, camera);
}
animate();

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
