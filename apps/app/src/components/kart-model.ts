import * as THREE from "three";

export type KartModel = {
  root: THREE.Group;
  wheels: THREE.Group[];
  steering: THREE.Group;
  driver: THREE.Group;
};

export type KartPalette = {
  paint: number;
  accent: number;
  suit: number;
  helmet: number;
  visor: number;
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

function rod(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
) {
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start);
  const result = mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 7),
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
  const tipEnd = end.clone().addScaledVector(direction, 0.2);
  const midpoint = end.clone().add(tipEnd).multiplyScalar(0.5);
  const flare = mesh(
    new THREE.CylinderGeometry(0.1, 0.06, end.distanceTo(tipEnd), 8),
    tip,
    [midpoint.x, midpoint.y, midpoint.z],
  );
  flare.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction,
  );
  result.add(rod(start, end, 0.055, pipe), flare);
  return result;
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
      new THREE.CylinderGeometry(radius, radius, width, 14),
      tire,
      [0, 0, 0],
      [0, 0, Math.PI / 2],
    ),
    mesh(
      new THREE.CylinderGeometry(radius * 0.54, radius * 0.54, width + 0.018, 12),
      rim,
      [0, 0, 0],
      [0, 0, Math.PI / 2],
    ),
    mesh(
      new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, width + 0.028, 10),
      hub,
      [0, 0, 0],
      [0, 0, Math.PI / 2],
    ),
  );
  result.position.set(x, 0, z);
  return result;
}

function createDriver(
  suit: THREE.Material,
  headMaterial: THREE.Material,
  face: THREE.Material,
  detail: THREE.Material,
  dark: THREE.Material,
) {
  const driver = new THREE.Group();
  const head = new THREE.Group();
  const steering = new THREE.Group();
  const steeringWheel = mesh(
    new THREE.TorusGeometry(0.19, 0.035, 7, 16),
    dark,
    [0, 0, 0],
    [-0.34, 0, 0],
  );

  steering.position.set(0, 0.76, 0.34);
  steering.add(steeringWheel);

  const facePatch = mesh(
    new THREE.SphereGeometry(0.34, 12, 8),
    face,
    [0, -0.01, 0.25],
  );
  facePatch.scale.set(0.82, 0.72, 0.28);
  head.position.set(0, 1.23, -0.16);
  head.add(
    mesh(new THREE.IcosahedronGeometry(0.38, 2), headMaterial, [0, 0, 0]),
    mesh(new THREE.IcosahedronGeometry(0.13, 1), detail, [-0.35, 0.02, 0]),
    mesh(new THREE.IcosahedronGeometry(0.13, 1), detail, [0.35, 0.02, 0]),
    facePatch,
    mesh(
      new THREE.SphereGeometry(0.115, 12, 8),
      face,
      [-0.12, 0.08, 0.34],
    ),
    mesh(
      new THREE.SphereGeometry(0.115, 12, 8),
      face,
      [0.12, 0.08, 0.34],
    ),
    mesh(
      new THREE.SphereGeometry(0.052, 10, 7),
      dark,
      [-0.12, 0.08, 0.435],
    ),
    mesh(
      new THREE.SphereGeometry(0.052, 10, 7),
      dark,
      [0.12, 0.08, 0.435],
    ),
    mesh(
      new THREE.TorusGeometry(0.105, 0.025, 6, 12, Math.PI),
      dark,
      [0, -0.12, 0.43],
      [0, 0, Math.PI],
    ),
  );

  driver.add(
    mesh(new THREE.CapsuleGeometry(0.24, 0.3, 4, 10), suit, [0, 0.67, -0.22]),
    mesh(
      new THREE.CapsuleGeometry(0.31, 0.4, 4, 10),
      dark,
      [0, 0.61, -0.5],
      [0.12, 0, 0],
    ),
    rod(
      new THREE.Vector3(-0.2, 0.84, -0.1),
      new THREE.Vector3(-0.16, 0.77, 0.32),
      0.07,
      suit,
    ),
    rod(
      new THREE.Vector3(0.2, 0.84, -0.1),
      new THREE.Vector3(0.16, 0.77, 0.32),
      0.07,
      suit,
    ),
    head,
    steering,
  );

  return { driver, steering };
}

export function createKartModel(palette: KartPalette): KartModel {
  const root = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const paint = new THREE.MeshStandardMaterial({
    color: palette.paint,
    roughness: 0.44,
    metalness: 0.18,
    flatShading: true,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: palette.accent,
    roughness: 0.38,
    metalness: 0.22,
    flatShading: true,
  });
  const suit = new THREE.MeshStandardMaterial({
    color: palette.suit,
    roughness: 0.58,
    flatShading: true,
  });
  const helmet = new THREE.MeshStandardMaterial({
    color: palette.helmet,
    roughness: 0.34,
    metalness: 0.12,
    flatShading: true,
  });
  const detail = new THREE.MeshStandardMaterial({
    color: palette.visor,
    roughness: 0.5,
    flatShading: true,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x111419,
    roughness: 0.74,
    metalness: 0.16,
    flatShading: true,
  });
  const tire = new THREE.MeshStandardMaterial({
    color: 0x090b0d,
    roughness: 0.96,
    metalness: 0.01,
    flatShading: true,
  });
  const rim = new THREE.MeshStandardMaterial({
    color: 0x90989e,
    roughness: 0.33,
    metalness: 0.78,
    flatShading: true,
  });
  const face = new THREE.MeshStandardMaterial({
    color: 0xfff6e8,
    roughness: 0.62,
    flatShading: true,
  });
  const pipe = new THREE.MeshStandardMaterial({
    color: 0xe6eef0,
    roughness: 0.48,
    metalness: 0.42,
    flatShading: true,
  });

  const cowl = mesh(
    new THREE.SphereGeometry(0.71, 12, 8),
    paint,
    [0, 0.34, 0.76],
  );
  cowl.scale.set(0.62, 0.5, 0.86);
  const stripe = mesh(
    new THREE.SphereGeometry(0.715, 12, 8),
    accent,
    [0, 0.345, 0.765],
  );
  stripe.scale.set(0.15, 0.52, 0.87);

  root.add(
    mesh(new THREE.BoxGeometry(1.64, 0.16, 2.18), dark, [0, 0.02, 0.02]),
    mesh(taperedBox(1.08, 1.3, 0.26, 0.34, 0.88), paint, [0, 0.24, -0.56]),
    mesh(new THREE.BoxGeometry(0.68, 0.42, 0.62), rim, [0, 0.38, -0.94]),
    mesh(
      new THREE.CapsuleGeometry(0.1, 1.38, 4, 10),
      dark,
      [0, 0.02, 1.47],
      [0, 0, Math.PI / 2],
    ),
    mesh(
      new THREE.CapsuleGeometry(0.09, 1.28, 4, 10),
      dark,
      [0, 0.08, -1.29],
      [0, 0, Math.PI / 2],
    ),
    cowl,
    stripe,
  );

  for (const side of [-1, 1]) {
    root.add(
      mesh(
        new THREE.BoxGeometry(0.28, 0.25, 0.92),
        paint,
        [side * 0.63, 0.25, -0.25],
      ),
      mesh(
        new THREE.BoxGeometry(0.1, 0.11, 0.96),
        accent,
        [side * 0.79, 0.16, -0.25],
      ),
      mesh(
        new THREE.BoxGeometry(0.46, 0.28, 0.58),
        accent,
        [side * 0.79, 0.27, -0.65],
      ),
      mesh(
        new THREE.BoxGeometry(0.45, 0.13, 0.28),
        accent,
        [side * 0.79, 0.22, 0.75],
      ),
      rod(
        new THREE.Vector3(side * 0.32, 0.17, 0.48),
        new THREE.Vector3(side * 0.8, 0.01, 0.78),
        0.03,
        pipe,
      ),
      rod(
        new THREE.Vector3(side * 0.34, 0.16, -0.48),
        new THREE.Vector3(side * 0.8, 0.01, -0.72),
        0.032,
        pipe,
      ),
    );
  }

  const wheelSpecs = [
    { radius: 0.29, width: 0.25, x: 0.88, z: 0.78 },
    { radius: 0.29, width: 0.25, x: -0.88, z: 0.78 },
    { radius: 0.36, width: 0.32, x: 0.88, z: -0.72 },
    { radius: 0.36, width: 0.32, x: -0.88, z: -0.72 },
  ];

  for (const spec of wheelSpecs) {
    const wheelGroup = wheel(
      spec.radius,
      spec.width,
      spec.x,
      spec.z,
      tire,
      rim,
      accent,
    );
    wheels.push(wheelGroup);
    root.add(wheelGroup);
  }

  for (const side of [-1, 1]) {
    root.add(
      exhaust(
        new THREE.Vector3(side * 0.26, 0.43, -0.78),
        new THREE.Vector3(side * 0.4, 0.7, -1.08),
        pipe,
        dark,
      ),
      exhaust(
        new THREE.Vector3(side * 0.35, 0.37, -0.76),
        new THREE.Vector3(side * 0.58, 0.55, -1.08),
        pipe,
        dark,
      ),
    );
  }

  const { driver, steering } = createDriver(
    suit,
    helmet,
    face,
    detail,
    dark,
  );
  root.add(driver);
  root.position.y = 0.38;
  return { root, wheels, steering, driver };
}
