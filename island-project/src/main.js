import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

//model loader
const mtlLoader = new MTLLoader();
const objLoader = new OBJLoader();

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 3, 25);

// Contorls
const controls = new PointerLockControls(camera, document.body);

document.body.addEventListener('click', () => {
  controls.lock();
});

const keysPressed = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  fastForward: false
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
    case 'Space': //fast forward
      keysPressed.fastForward = true;
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
    case 'Space':
      keysPressed.fastForward = false;
      break;
  }
});

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Island
const islandGeometry = new THREE.CylinderGeometry(30, 200, 50, 32);
const islandMaterial = new THREE.MeshStandardMaterial({ color: 0xffd966}); //sand color
const island = new THREE.Mesh(islandGeometry, islandMaterial);
island.position.y = -25;
scene.add(island);

// Water
const waterGeometry = new THREE.PlaneGeometry(1000, 1000, 200, 200);

const waterUniforms = {
  uTime: { value: 0 }
};
const waterMaterial = new THREE.ShaderMaterial({
  uniforms: waterUniforms, // Pass time into the shader for animation
  vertexShader: `
    uniform float uTime; // Time since start
    varying vec2 vUv; //UV coordinates (0-1 range over surface)

    void main() {
      vUv = uv; // Pass UVs to fragment shader
      vec3 pos = position; // Gte vertex position

      // Move vertices up/down to create waves
      pos.z += sin(pos.x * 2.0 + uTime) * 0.2;
      pos.z += cos(pos.y * 2.0 + uTime) * 0.2;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0); // Final position
    }
  `,
  fragmentShader: `
    varying vec2 vUv; // UVs from vertex shader

    void main() {
      gl_FragColor = vec4(0.0, 0.5, 0.7, 0.8); // Light blue color
    }
  `,
  transparent: true // Enable partial transparency
});
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

// Campfire light
const campfireLight = new THREE.PointLight(0xffa500, 3, 20);
campfireLight.position.set(25, 1, 0);
scene.add(campfireLight);

// Campfire smoke
const smokeParticles = [];
const smokeGeometry = new THREE.PlaneGeometry(1, 1);
const smokeMaterial = new THREE.MeshBasicMaterial({
  color: 0x555555, // grey smoke
  transparent: true,
  opacity: 0.5,
  depthWrite: false, //make blending look better
  side: THREE.DoubleSide
});

for (let i = 0; i < 25; i++) { //creating smoke planes
  const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial.clone());
  smoke.position.set(
    25 + (Math.random() - 0.5), // Slight random spread around campfire
    1 + Math.random() * 2,
    0 + (Math.random() - 0.5)
  );
  smoke.rotation.x = Math.random() * Math.PI;
  smoke.rotation.y = Math.random() * Math.PI;
  smoke.rotation.z = Math.random() * Math.PI;
  scene.add(smoke);
  smokeParticles.push(smoke);
}
//Campfire obj
mtlLoader.load('/objs/campfire.mtl', (materials) => {
  materials.preload();
  objLoader.setMaterials(materials);

  objLoader.load('/objs/campfire.obj', (object) => {
    object.position.set(25, 0, 0);
    scene.add(object);
  }, undefined, (error) => {
    console.error('Error loading OBJ:', error);
  });
});

//Coral obj
mtlLoader.load('/objs/coral.mtl', (coralMaterials) => {
  coralMaterials.preload();

  const coralLoader = new OBJLoader(); //making a new object loader because for some reason its intefering with the other objects
  coralLoader.setMaterials(coralMaterials);

  coralLoader.load('/objs/coral.obj', (coral) => {
    coral.position.set(30, -2, 10);
    scene.add(coral);

  }, undefined, (error) => {
    console.error('Error loading coral OBJ:', error);
  });
});

//Beachball obj
mtlLoader.load('/objs/beachball.mtl', (ballMaterials) => {
  ballMaterials.preload();

  const ballLoader = new OBJLoader();
  ballLoader.setMaterials(ballMaterials);

  ballLoader.load('/objs/beachball.obj', (beachball) => {
    beachball.position.set(0, 5, 25);
    scene.add(beachball);
  }, undefined, (error) => {
    console.error('Error loading beach ball OBJ:', error);
  });
});

// Boat obj
let boat = null; //declaring it globally
 //Three.js doesnt understand map_Bump, map_Ns, refl when loading textures apparently, instead overwrit the material color in .mtl
mtlLoader.load('/objs/BoatOBJ.mtl', (boatMaterials) => {
  boatMaterials.preload();

  const boatLoader = new OBJLoader();
  boatLoader.setMaterials(boatMaterials);

  
  boatLoader.load('/objs/BoatOBJ.obj', (loadedBoat) => {
    loadedBoat.position.set(0, -2, 60);
    scene.add(loadedBoat);
    boat = loadedBoat;
  }, undefined, (error) => {
    console.error('Error loading boat OBJ:', error);
  });
});
// Boat bobbing setup
let boatTime = 0;

//lighthouse
mtlLoader.load('/objs/LightHouse_CGTRader.mtl', (lighthouseMaterials) => {
  lighthouseMaterials.preload();

  const lighthouseLoader = new OBJLoader();
  lighthouseLoader.setMaterials(lighthouseMaterials);

  lighthouseLoader.load('/objs/LightHouse_CGTRader.obj', (lighthouse) => {
    lighthouse.position.set(0, 0, 0);
    lighthouse.scale.set(0.01,0.01,0.01)
    lighthouse.rotation.x = -Math.PI / 2;
    lighthouse.rotation.z = -Math.PI;
    scene.add(lighthouse);
  }, undefined, (error) => {
    console.error('Error loading lighthouse OBJ:', error);
  });
});

// Lighthouse light
//const lighthouseLight = new THREE.SpotLight(0xffffff, 5, 100, Math.PI / 8, 0.5);
//lighthouseLight.position.set(0, 100, 0);
//scene.add(lighthouseLight);

// Add a target for the light to aim at
//const lightTarget = new THREE.Object3D();
//lightTarget.position.set(50, 100, 0);
//scene.add(lightTarget);

//lighthouseLight.target = lightTarget;
//const lightRadius = 50;
//let lightAngle = 0;

//Clock for normalizing speeds
const clock = new THREE.Clock();

// Render loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta(); // seconds since last frame
  const frameSpeed = moveSpeed * delta * 60;

  // Tiem of day update
  if (keysPressed.fastForward) {
  timeOfDay += delta * 0.5; //Fast forward when space held
  } else {
  timeOfDay += delta * 0.01; // Normal day cycle
  }

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

  // Update rotating light
  // lightAngle += delta;
  //lightTarget.position.set(
  //  Math.cos(lightAngle) * lightRadius,
  //  100,
  //  Math.sin(lightAngle) * lightRadius
  //);
  
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

  // Boat bobbing
  boatTime += delta;
  boat.position.y = -2 + Math.sin(boatTime * 2) * 0.5; 
  // (sine wave, speed=2, bobbing up/down by 0.5 units)

  // Water
  waterUniforms.uTime.value += delta;

  // Smoke
  smokeParticles.forEach((smoke) => {
    smoke.position.y += 0.01; // Slowly rise upward
    smoke.material.opacity -= 0.001; // Slowly fade out
    
    if (smoke.material.opacity <= 0) {
      //Reset particle when faded out
      smoke.position.set(
        25 + (Math.random() - 0.5),
        1 + (Math.random() - 0.5) * 2,
        0 + (Math.random() - 0.5)
      );
      smoke.material.opacity = 0.5;
    }
  });
  renderer.render(scene, camera);
}
animate();

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
