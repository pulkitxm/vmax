import * as THREE from "three";

export type KartModel = {
  root: THREE.Group;
  wheels: THREE.Group[];
  steering: THREE.Group;
  driver: THREE.Group;
};

function taperedBox(
  frontWidth: number,
  rearWidth: number,
  frontHeight: number,
  rearHeight: number,
  depth: number,
) {
  const frontZ = depth / 2;
  const rearZ = -depth / 2;
  const vertices = new Float32Array([
    -rearWidth / 2,
    -rearHeight / 2,
    rearZ,
    rearWidth / 2,
    -rearHeight / 2,
    rearZ,
    rearWidth / 2,
    rearHeight / 2,
    rearZ,
    -rearWidth / 2,
    rearHeight / 2,
    rearZ,
    -frontWidth / 2,
    -frontHeight / 2,
    frontZ,
    frontWidth / 2,
    -frontHeight / 2,
    frontZ,
    frontWidth / 2,
    frontHeight / 2,
    frontZ,
    -frontWidth / 2,
    frontHeight / 2,
    frontZ,
  ]);
  const indices = [
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 3, 2, 6, 3,
    6, 7, 1, 5, 6, 1, 6, 2, 0, 3, 7, 0, 7, 4,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
) {
  const result = new THREE.Mesh(geometry, material);
  result.position.set(...position);
  result.rotation.set(...rotation);
  return result;
}

function scaledMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  scale: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
) {
  const result = mesh(geometry, material, position, rotation);
  result.scale.set(...scale);
  return result;
}

function rod(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
) {
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start);
  const result = mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 10),
    material,
    [midpoint.x, midpoint.y, midpoint.z],
  );
  result.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  return result;
}

function exhaust(
  start: THREE.Vector3,
  end: THREE.Vector3,
  pipe: THREE.Material,
  tip: THREE.Material,
) {
  const result = new THREE.Group();
  const direction = end.clone().sub(start).normalize();
  const tipEnd = end.clone().addScaledVector(direction, 0.18);
  const midpoint = end.clone().add(tipEnd).multiplyScalar(0.5);
  const flare = mesh(
    new THREE.CylinderGeometry(0.1, 0.06, end.distanceTo(tipEnd), 10),
    tip,
    [midpoint.x, midpoint.y, midpoint.z],
  );
  flare.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction,
  );
  result.add(rod(start, end, 0.052, pipe), flare);
  return result;
}

function frontBumper(material: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-0.8, 0.09, 0.88),
      new THREE.Vector3(-0.94, 0.08, 1.06),
      new THREE.Vector3(-0.7, 0.07, 1.29),
      new THREE.Vector3(0, 0.065, 1.38),
      new THREE.Vector3(0.7, 0.07, 1.29),
      new THREE.Vector3(0.94, 0.08, 1.06),
      new THREE.Vector3(0.8, 0.09, 0.88),
    ],
    false,
    "centripetal",
  );
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.072, 10), material);
}

function wheel(
  radius: number,
  width: number,
  x: number,
  z: number,
  tire: THREE.Material,
  rim: THREE.Material,
  hub: THREE.Material,
) {
  const result = new THREE.Group();
  result.add(
    mesh(
      new THREE.CylinderGeometry(radius, radius, width, 20),
      tire,
      [0, 0, 0],
      [0, 0, Math.PI / 2],
    ),
    mesh(
      new THREE.CylinderGeometry(radius * 0.52, radius * 0.52, width + 0.018, 18),
      rim,
      [0, 0, 0],
      [0, 0, Math.PI / 2],
    ),
    mesh(
      new THREE.CylinderGeometry(radius * 0.19, radius * 0.19, width + 0.03, 14),
      hub,
      [0, 0, 0],
      [0, 0, Math.PI / 2],
    ),
  );
  result.position.set(x, 0, z);
  return result;
}

function wheelArch(
  radius: number,
  x: number,
  z: number,
  material: THREE.Material,
) {
  return mesh(
    new THREE.TorusGeometry(radius, 0.075, 8, 20, Math.PI),
    material,
    [x, 0, z],
    [0, Math.PI / 2, 0],
  );
}

function createPandaDriver(
  black: THREE.Material,
  white: THREE.Material,
  pink: THREE.Material,
  mouth: THREE.Material,
) {
  const driver = new THREE.Group();
  const head = new THREE.Group();
  const steering = new THREE.Group();
  const steeringWheel = mesh(
    new THREE.TorusGeometry(0.19, 0.035, 8, 20),
    black,
    [0, 0, 0],
    [-0.34, 0, 0],
  );

  steering.position.set(0, 0.74, 0.35);
  steering.add(steeringWheel);

  head.position.set(0, 1.31, -0.14);
  head.add(
    scaledMesh(
      new THREE.SphereGeometry(0.46, 16, 11),
      white,
      [0, 0, 0],
      [1.03, 0.94, 0.9],
    ),
    mesh(new THREE.IcosahedronGeometry(0.17, 2), black, [-0.37, 0.2, -0.01]),
    mesh(new THREE.IcosahedronGeometry(0.17, 2), black, [0.37, 0.2, -0.01]),
    mesh(new THREE.IcosahedronGeometry(0.1, 2), pink, [-0.37, 0.2, 0.09]),
    mesh(new THREE.IcosahedronGeometry(0.1, 2), pink, [0.37, 0.2, 0.09]),
    scaledMesh(
      new THREE.SphereGeometry(0.22, 14, 9),
      black,
      [-0.16, 0.08, 0.35],
      [0.92, 1.05, 0.28],
      [0, 0, -0.12],
    ),
    scaledMesh(
      new THREE.SphereGeometry(0.22, 14, 9),
      black,
      [0.16, 0.08, 0.35],
      [0.92, 1.05, 0.28],
      [0, 0, 0.12],
    ),
    scaledMesh(
      new THREE.SphereGeometry(0.17, 14, 9),
      white,
      [-0.16, 0.1, 0.39],
      [0.84, 1.08, 0.3],
    ),
    scaledMesh(
      new THREE.SphereGeometry(0.17, 14, 9),
      white,
      [0.16, 0.1, 0.39],
      [0.84, 1.08, 0.3],
    ),
    mesh(new THREE.SphereGeometry(0.065, 12, 8), black, [-0.16, 0.1, 0.51]),
    mesh(new THREE.SphereGeometry(0.065, 12, 8), black, [0.16, 0.1, 0.51]),
    mesh(new THREE.IcosahedronGeometry(0.085, 1), black, [0, -0.07, 0.46]),
    scaledMesh(
      new THREE.SphereGeometry(0.24, 14, 9),
      black,
      [0, -0.24, 0.34],
      [0.95, 0.46, 0.25],
    ),
    scaledMesh(
      new THREE.SphereGeometry(0.2, 14, 9),
      mouth,
      [0, -0.235, 0.405],
      [0.94, 0.4, 0.18],
    ),
  );

  for (const side of [-1, 1]) {
    const lashX = side * 0.27;
    head.add(
      rod(
        new THREE.Vector3(lashX, 0.25, 0.38),
        new THREE.Vector3(side * 0.32, 0.34, 0.4),
        0.018,
        black,
      ),
      rod(
        new THREE.Vector3(lashX, 0.24, 0.38),
        new THREE.Vector3(side * 0.35, 0.29, 0.4),
        0.018,
        black,
      ),
    );
  }

  driver.add(
    mesh(new THREE.CapsuleGeometry(0.25, 0.31, 5, 12), black, [0, 0.67, -0.22]),
    mesh(
      new THREE.CapsuleGeometry(0.31, 0.42, 5, 12),
      black,
      [0, 0.59, -0.5],
      [0.12, 0, 0],
    ),
    rod(
      new THREE.Vector3(-0.2, 0.84, -0.1),
      new THREE.Vector3(-0.16, 0.75, 0.33),
      0.065,
      white,
    ),
    rod(
      new THREE.Vector3(0.2, 0.84, -0.1),
      new THREE.Vector3(0.16, 0.75, 0.33),
      0.065,
      white,
    ),
    head,
    steering,
  );

  return { driver, steering };
}

export function createKartModel(): KartModel {
  const root = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const blue = new THREE.MeshStandardMaterial({
    color: 0x0878f7,
    roughness: 0.43,
    metalness: 0.06,
    flatShading: true,
  });
  const red = new THREE.MeshStandardMaterial({
    color: 0xff3345,
    roughness: 0.4,
    metalness: 0.05,
    flatShading: true,
  });
  const black = new THREE.MeshStandardMaterial({
    color: 0x17171b,
    roughness: 0.72,
    metalness: 0.08,
    flatShading: true,
  });
  const tire = new THREE.MeshStandardMaterial({
    color: 0x343238,
    roughness: 0.9,
    metalness: 0.01,
  });
  const rim = new THREE.MeshStandardMaterial({
    color: 0x9b9aa0,
    roughness: 0.3,
    metalness: 0.7,
  });
  const engine = new THREE.MeshStandardMaterial({
    color: 0x747279,
    roughness: 0.48,
    metalness: 0.45,
    flatShading: true,
  });
  const white = new THREE.MeshStandardMaterial({
    color: 0xf8f7f2,
    roughness: 0.55,
    flatShading: true,
  });
  const pink = new THREE.MeshStandardMaterial({
    color: 0xffb7ce,
    roughness: 0.6,
    flatShading: true,
  });
  const mouth = new THREE.MeshStandardMaterial({
    color: 0xff706f,
    roughness: 0.58,
    flatShading: true,
  });

  const cowl = scaledMesh(
    new THREE.SphereGeometry(0.66, 16, 11),
    blue,
    [0, 0.53, 0.78],
    [0.72, 0.8, 0.7],
  );
  const centerPanel = scaledMesh(
    new THREE.SphereGeometry(
      0.668,
      12,
      11,
      Math.PI / 2 - 0.41,
      0.82,
    ),
    red,
    [0, 0.53, 0.78],
    [0.73, 0.81, 0.71],
  );
  root.add(
    mesh(new THREE.BoxGeometry(1.48, 0.14, 2.02), black, [0, 0.02, 0.04]),
    mesh(taperedBox(1.02, 1.28, 0.23, 0.32, 0.88), blue, [0, 0.21, -0.53]),
    mesh(new THREE.BoxGeometry(0.7, 0.4, 0.57), engine, [0, 0.37, -0.92]),
    mesh(
      new THREE.CapsuleGeometry(0.085, 1.18, 5, 12),
      black,
      [0, 0.07, -1.14],
      [0, 0, Math.PI / 2],
    ),
    frontBumper(black),
    cowl,
    centerPanel,
  );

  const wheelSpecs = [
    { radius: 0.32, width: 0.29, x: 0.87, z: 0.72 },
    { radius: 0.32, width: 0.29, x: -0.87, z: 0.72 },
    { radius: 0.38, width: 0.34, x: 0.87, z: -0.68 },
    { radius: 0.38, width: 0.34, x: -0.87, z: -0.68 },
  ];

  for (const spec of wheelSpecs) {
    const wheelGroup = wheel(
      spec.radius,
      spec.width,
      spec.x,
      spec.z,
      tire,
      rim,
      red,
    );
    wheels.push(wheelGroup);
    root.add(wheelGroup);
  }

  for (const side of [-1, 1]) {
    root.add(
      mesh(
        new THREE.BoxGeometry(0.28, 0.2, 0.93),
        blue,
        [side * 0.62, 0.22, -0.23],
      ),
      mesh(
        new THREE.BoxGeometry(0.11, 0.1, 0.98),
        red,
        [side * 0.78, 0.14, -0.2],
      ),
      wheelArch(0.4, side * 0.87, -0.68, red),
      wheelArch(0.33, side * 0.87, 0.72, red),
      rod(
        new THREE.Vector3(side * 0.32, 0.15, 0.5),
        new THREE.Vector3(side * 0.78, 0.01, 0.72),
        0.028,
        engine,
      ),
      rod(
        new THREE.Vector3(side * 0.34, 0.15, -0.47),
        new THREE.Vector3(side * 0.78, 0.01, -0.68),
        0.03,
        engine,
      ),
      exhaust(
        new THREE.Vector3(side * 0.25, 0.42, -0.78),
        new THREE.Vector3(side * 0.4, 0.7, -1.08),
        white,
        black,
      ),
      exhaust(
        new THREE.Vector3(side * 0.34, 0.36, -0.76),
        new THREE.Vector3(side * 0.58, 0.55, -1.08),
        white,
        black,
      ),
    );
  }

  const { driver, steering } = createPandaDriver(black, white, pink, mouth);
  root.add(driver);
  root.position.y = 0.4;
  return { root, wheels, steering, driver };
}
