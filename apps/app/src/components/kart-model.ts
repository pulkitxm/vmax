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
  helmet: THREE.Material,
  visor: THREE.Material,
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

  steering.position.set(0, 0.78, 0.42);
  steering.add(steeringWheel);

  head.position.set(0, 1.21, -0.08);
  head.add(
    mesh(new THREE.IcosahedronGeometry(0.35, 2), helmet, [0, 0, 0]),
    mesh(
      new THREE.BoxGeometry(0.42, 0.16, 0.09),
      visor,
      [0, 0.03, 0.3],
      [-0.08, 0, 0],
    ),
    mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.07),
      suit,
      [0, -0.2, 0.31],
      [-0.08, 0, 0],
    ),
  );

  driver.add(
    mesh(new THREE.CapsuleGeometry(0.24, 0.34, 4, 10), suit, [0, 0.69, -0.2]),
    mesh(
      new THREE.CapsuleGeometry(0.32, 0.42, 4, 10),
      dark,
      [0, 0.64, -0.48],
      [0.12, 0, 0],
    ),
    rod(
      new THREE.Vector3(-0.2, 0.87, -0.08),
      new THREE.Vector3(-0.16, 0.79, 0.4),
      0.07,
      suit,
    ),
    rod(
      new THREE.Vector3(0.2, 0.87, -0.08),
      new THREE.Vector3(0.16, 0.79, 0.4),
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
  const visor = new THREE.MeshPhysicalMaterial({
    color: palette.visor,
    roughness: 0.13,
    metalness: 0.64,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
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

  root.add(
    mesh(new THREE.BoxGeometry(1.78, 0.18, 2.18), dark, [0, 0.02, 0]),
    mesh(taperedBox(0.55, 1.1, 0.42, 0.3, 1.48), paint, [0, 0.32, 0.48]),
    mesh(taperedBox(0.18, 0.58, 0.21, 0.38, 0.84), accent, [0, 0.48, 1.42]),
    mesh(taperedBox(1.28, 1.4, 0.39, 0.44, 0.82), paint, [0, 0.28, -0.7]),
    mesh(new THREE.BoxGeometry(1.88, 0.12, 0.22), dark, [0, -0.02, 1.61]),
    mesh(new THREE.BoxGeometry(1.74, 0.11, 0.2), dark, [0, 0.04, -1.31]),
  );

  for (const side of [-1, 1]) {
    root.add(
      mesh(
        new THREE.BoxGeometry(0.34, 0.34, 1.08),
        paint,
        [side * 0.72, 0.29, -0.15],
        [0, 0, side * -0.06],
      ),
      mesh(
        new THREE.BoxGeometry(0.14, 0.14, 1.2),
        accent,
        [side * 0.86, 0.2, -0.08],
      ),
      mesh(
        new THREE.BoxGeometry(0.38, 0.13, 0.13),
        dark,
        [side * 0.91, 0.08, 1.58],
      ),
      mesh(
        new THREE.BoxGeometry(0.38, 0.13, 0.13),
        dark,
        [side * 0.91, 0.1, -1.29],
      ),
      rod(
        new THREE.Vector3(side * 0.28, 0.22, 0.7),
        new THREE.Vector3(side * 0.82, 0.04, 0.92),
        0.025,
        rim,
      ),
      rod(
        new THREE.Vector3(side * 0.36, 0.2, -0.56),
        new THREE.Vector3(side * 0.82, 0.04, -0.84),
        0.028,
        rim,
      ),
    );
  }

  const wheelSpecs = [
    { radius: 0.33, width: 0.26, x: 0.94, z: 0.94 },
    { radius: 0.33, width: 0.26, x: -0.94, z: 0.94 },
    { radius: 0.38, width: 0.31, x: 0.94, z: -0.84 },
    { radius: 0.38, width: 0.31, x: -0.94, z: -0.84 },
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
      mesh(
        new THREE.CylinderGeometry(0.09, 0.12, 0.58, 8),
        rim,
        [side * 0.34, 0.58, -1.12],
        [Math.PI / 2, 0, 0],
      ),
      mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.18, 8),
        dark,
        [side * 0.34, 0.58, -1.45],
        [Math.PI / 2, 0, 0],
      ),
    );
  }

  const { driver, steering } = createDriver(suit, helmet, visor, dark);
  root.add(driver);
  root.position.y = 0.38;
  return { root, wheels, steering, driver };
}
