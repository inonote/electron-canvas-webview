import { OffscreenWebViewClient } from "../owv-client.js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSM } from "three/addons/csm/CSM.js";
import { CSMHelper } from "three/addons/csm/CSMHelper.js";

async function main() {
  OffscreenWebViewClient.$_init();

  const owv = new OffscreenWebViewClient();
  const owvWidth = 512;
  const owvHeight = 512;
  const owvWidthPhysical = Math.floor(owvWidth * window.devicePixelRatio);
  const owvHeightPhysical = Math.floor(owvHeight * window.devicePixelRatio);
  
  const owvMousePosition = [ null, 0 ];

  const clientRect = document.getElementsByClassName("canvas-container")[0].getBoundingClientRect();

  const owvSurfaceData = new Uint8Array(owvWidthPhysical * owvHeightPhysical * 4);
  const owvSurface = new THREE.DataTexture(owvSurfaceData, owvWidthPhysical, owvHeightPhysical,
    THREE.RGBAFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
    THREE.LinearFilter, THREE.LinearFilter);
  owvSurface.flipY = true;


  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, clientRect.width / clientRect.height, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(clientRect.width, clientRect.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.getElementsByClassName("canvas-container")[0].appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const csm = new CSM({
    maxFar: 1000,
    cascades: 4,
    mode: "practical",
    parent: scene,
    shadowMapSize: 1024,
    lightDirection: new THREE.Vector3(-1, -1, -1).normalize(),
    camera: camera });

  const csmHelper = new CSMHelper(csm);
  csmHelper.visible = false;
  scene.add(csmHelper);


  const floorMaterial = new THREE.MeshPhongMaterial({ color: "#f5f6f7" });
  csm.setupMaterial(floorMaterial);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(500, 500, 8, 8), floorMaterial);
  floor.rotation.x = - Math.PI / 2;
  floor.castShadow = true;
  floor.receiveShadow = true;
  scene.add(floor);

  const cubeGroup = new THREE.Group();

  const cubeMaterial = new THREE.MeshPhongMaterial({ map: owvSurface });
  csm.setupMaterial(cubeMaterial);
  const cube = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), cubeMaterial);
  cube.position.x = -7.0;
  cube.position.y = 6.0;
  cube.castShadow = true;
  cube.receiveShadow = true;
  cubeGroup.add(cube);
  
  const cube2 = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), cubeMaterial);
  cube2.position.x = 7.0;
  cube2.position.y = 10.0;
  cube2.castShadow = true;
  cube2.receiveShadow = true;
  cubeGroup.add(cube2);
  
  const cube3 = new THREE.Mesh(new THREE.BoxGeometry(40, 40, 2), cubeMaterial);
  cube3.position.x = 30.0;
  cube3.position.y = 20.0;
  cube3.position.z = 18.0;
  cube3.castShadow = true;
  cube3.receiveShadow = true;
  cubeGroup.add(cube3);

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(8, 32, 32), cubeMaterial);
  sphere.position.x = -15;
  sphere.position.y = 10;
  sphere.position.z = 22.0;
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  cubeGroup.add(sphere);

  scene.add(cubeGroup);

  const raycaster = new THREE.Raycaster();
  const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.set(15.41320543820741, 21.68683703148168, 52.27975885289095);
  controls.target.set(25.48841537573061, 17.653444897413667, -11.50244067534696);
  controls.update();
  
  owv.$_setOnPaintHandler((owv, image, width, height, dirtyX, dirtyY, dirtyWidth, dirtyHeight) => {
    // copy pixels
    for(let y = dirtyY; y < dirtyY + dirtyHeight; ++y) {
      for(let x = dirtyX; x < dirtyX + dirtyWidth; ++x) {
        let srcOffset = ((x - dirtyX) + (y - dirtyY) * dirtyWidth) * 4;
        let destOffset = (x + y * width) * 4;
        owvSurfaceData[destOffset] = image[srcOffset + 2];
        owvSurfaceData[destOffset + 1] = image[srcOffset + 1];
        owvSurfaceData[destOffset + 2] = image[srcOffset];
        owvSurfaceData[destOffset + 3] = image[srcOffset + 3];
      }  
    }
    owvSurface.needsUpdate = true;
  });

  owv.$_setOnCursorChangedHandler((owv, type) => {
    if (type === "pointer")
      renderer.domElement.style.cursor = "default";
    else if (type === "hand")
      renderer.domElement.style.cursor = "pointer";
    else
    renderer.domElement.style.cursor = type;
  });

  await owv.$_create(owvWidth, owvHeight);
  await owv.$_navigate("https://inonote.jp/files/canvas-webview-test.html");

  owv.$_setFocus(true);

  function mainLoop() {
    cube.rotation.x += 0.002;
    cube.rotation.y += 0.002;

    cube2.rotation.x -= 0.002;
    cube2.rotation.y -= 0.002;

    csm.update();
    csmHelper.update();

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(mainLoop);

  window.addEventListener("unload", e => {
    owv.$_destroy();
  });
  window.addEventListener("resize", e => {
    onSize();
  });
  renderer.domElement.addEventListener("mousedown", e => {
    if (owvMousePosition[0] !== null) {
      owv.$_setFocus(true);
      sendMouseEvent(owv, "mouseDown", e);
    }
    else {
      owv.$_setFocus(false);
    }
  });
  renderer.domElement.addEventListener("mouseup", e => {
    if (owvMousePosition[0] !== null)
      sendMouseEvent(owv, "mouseUp", e);
  });
  renderer.domElement.addEventListener("mouseenter", e => {
    if (owvMousePosition[0] !== null)
      sendMouseEvent(owv, "mouseEnter", e);
  });
  renderer.domElement.addEventListener("mouseleave", e => {
    if (owvMousePosition[0] !== null)
      sendMouseEvent(owv, "mouseLeave", e);
  });
  renderer.domElement.addEventListener("mousemove", e => {
    const rect = renderer.domElement.getBoundingClientRect();

    const mouseX = (e.offsetX / rect.width) * 2 - 1;
    const mouseY = -(e.offsetY / rect.height) * 2 + 1;
    
    raycaster.setFromCamera({ x: mouseX, y: mouseY }, camera);
    const intersects = raycaster.intersectObjects(cubeGroup.children);
    if (intersects.length > 0 && intersects[0].uv) {
      owvMousePosition[0] = intersects[0].uv.x * owvWidth;
      owvMousePosition[1] = (1.0 - intersects[0].uv.y) * owvHeight;
    
      // notify
      sendMouseEvent(owv, "mouseMove", e);

      controls.enablePan = controls.enableRotate = controls.enableZoom = false;
    }
    else {
      owvMousePosition[0] = null;
      controls.enablePan = controls.enableRotate = controls.enableZoom = true;
      renderer.domElement.style.cursor = "default";
    }
  });
  renderer.domElement.addEventListener("wheel", e => {
    if (owvMousePosition[0] !== null)
      sendMouseEvent(owv, "mouseWheel", e);
  }, true);
  renderer.domElement.addEventListener("keydown", e => {
    owv.$_sendKbdEvent("keyDown", e.key, getModifiersFromInputEvent(e));
  });
  renderer.domElement.addEventListener("keyup", e => {
    owv.$_sendKbdEvent("keyUp", e.key, getModifiersFromInputEvent(e));
  });
  renderer.domElement.addEventListener("focus", e => {
    owv.$_setFocus(true);
  });
  renderer.domElement.addEventListener("blur", e => {
    owv.$_setFocus(false);
  });

  document.getElementById("btnGo").addEventListener("click", () => {
    owv.$_navigate(document.getElementById("addrbar").value, false);
  });

  /** @type {(owv: OffscreenWebViewClient, eventName: string, inputEvent: MouseEvent|WheelEvent) => void} */
  function sendMouseEvent(owv, eventName, inputEvent) {
    if (eventName !== "mouseWheel")
      owv.$_sendMouseEvent(eventName, owvMousePosition[0], owvMousePosition[1], inputEvent.button, getModifiersFromInputEvent(inputEvent), 0, 0);
    else
      owv.$_sendMouseEvent(eventName, owvMousePosition[0], owvMousePosition[1], inputEvent.button, getModifiersFromInputEvent(inputEvent), -inputEvent.deltaX, -inputEvent.deltaY);
  }

  /** @type {(inputEvent: MouseEvent|WheelEvent|KeyboardEvent) => []]} */
  function getModifiersFromInputEvent(inputEvent) {
    let mods = [];
    if (inputEvent.shiftKey)
      mods.push("shift");
    if (inputEvent.ctrlKey)
      mods.push("ctrl");
    if (inputEvent.altKey)
      mods.push("alt");
    return mods;
  }

  function onSize() {
    const rect = renderer.domElement.parentElement.getBoundingClientRect();
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height);
  }
}

setTimeout(main);
