import * as THREE from "three";

type F1CarModel = {
  root: THREE.Group;
  wheels: THREE.Group[];
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
    new THREE.CylinderGeometry(radius, radius, direction.length(), 8),
    material,
    [midpoint.x, midpoint.y, midpoint.z],
  );
  result.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  return result;
}

function halo(material: THREE.Material) {
  const result = new THREE.Group();
  const ringPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34, 0.48, -0.13),
    new THREE.Vector3(-0.4, 0.55, 0.06),
    new THREE.Vector3(-0.29, 0.58, 0.31),
    new THREE.Vector3(0, 0.59, 0.42),
    new THREE.Vector3(0.29, 0.58, 0.31),
    new THREE.Vector3(0.4, 0.55, 0.06),
    new THREE.Vector3(0.34, 0.48, -0.13),
  ]);
  result.add(
    new THREE.Mesh(new THREE.TubeGeometry(ringPath, 40, 0.032, 8), material),
  );
  result.add(
    rod(
      new THREE.Vector3(0, 0.58, 0.41),
      new THREE.Vector3(0, 0.22, 0.68),
      0.032,
      material,
    ),
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
  stripe: THREE.Material,
) {
  const result = new THREE.Group();
  const tireMesh = mesh(
    new THREE.CylinderGeometry(radius, radius, width, 32, 1),
    tire,
    [0, 0, 0],
    [0, 0, Math.PI / 2],
  );
  const rimMesh = mesh(
    new THREE.CylinderGeometry(radius * 0.52, radius * 0.52, width + 0.012, 20),
    rim,
    [0, 0, 0],
    [0, 0, Math.PI / 2],
  );
  result.add(tireMesh, rimMesh);

  for (const side of [-1, 1]) {
    const sidewallStripe = mesh(
      new THREE.TorusGeometry(radius * 0.76, 0.014, 6, 32),
      stripe,
      [(width / 2 + 0.009) * side, 0, 0],
      [0, Math.PI / 2, 0],
    );
    result.add(sidewallStripe);
  }

  result.position.set(x, 0, z);
  return result;
}

export function createF1CarModel(): F1CarModel {
  const root = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const paint = new THREE.MeshPhysicalMaterial({
    color: 0xe92c3d,
    metalness: 0.38,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.11,
  });
  const paintDark = new THREE.MeshPhysicalMaterial({
    color: 0x7b101d,
    metalness: 0.48,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.16,
  });
  const carbon = new THREE.MeshStandardMaterial({
    color: 0x111419,
    metalness: 0.52,
    roughness: 0.42,
  });
  const carbonEdge = new THREE.MeshStandardMaterial({
    color: 0x262c31,
    metalness: 0.7,
    roughness: 0.26,
  });
  const warmWhite = new THREE.MeshPhysicalMaterial({
    color: 0xf7f2e8,
    metalness: 0.28,
    roughness: 0.25,
    clearcoat: 0.8,
    clearcoatRoughness: 0.16,
  });
  const cyan = new THREE.MeshStandardMaterial({
    color: 0x39e7f2,
    emissive: 0x0d7b82,
    emissiveIntensity: 0.65,
    metalness: 0.3,
    roughness: 0.28,
  });
  const tire = new THREE.MeshStandardMaterial({
    color: 0x070809,
    roughness: 0.92,
    metalness: 0.02,
  });
  const rim = new THREE.MeshStandardMaterial({
    color: 0x4c5257,
    roughness: 0.3,
    metalness: 0.86,
  });
  const helmet = new THREE.MeshPhysicalMaterial({
    color: 0xf7f2e8,
    metalness: 0.16,
    roughness: 0.2,
    clearcoat: 1,
  });
  const visor = new THREE.MeshPhysicalMaterial({
    color: 0x17262d,
    metalness: 0.75,
    roughness: 0.12,
    clearcoat: 1,
  });
  const redLight = new THREE.MeshBasicMaterial({ color: 0xff3045 });

  root.add(
    mesh(new THREE.BoxGeometry(1.72, 0.07, 2.7), carbon, [0, -0.28, -0.02]),
    mesh(taperedBox(0.52, 0.84, 0.36, 0.42, 1.72), paint, [0, 0, 0.24]),
    mesh(taperedBox(0.16, 0.5, 0.15, 0.28, 1.4), paint, [0, -0.06, 1.54]),
    mesh(taperedBox(0.1, 0.22, 0.08, 0.14, 0.66), warmWhite, [0, -0.07, 2.4]),
    mesh(taperedBox(0.96, 0.72, 0.4, 0.34, 1.24), paintDark, [0, 0.05, -0.9]),
  );

  for (const side of [-1, 1]) {
    root.add(
      mesh(
        taperedBox(0.5, 0.68, 0.28, 0.36, 1.04),
        paint,
        [side * 0.56, -0.01, -0.47],
      ),
      mesh(
        taperedBox(0.32, 0.48, 0.17, 0.24, 0.35),
        carbon,
        [side * 0.56, 0.03, 0.13],
      ),
      mesh(
        new THREE.BoxGeometry(0.08, 0.07, 1.74),
        cyan,
        [side * 0.83, -0.23, -0.16],
      ),
    );
  }

  root.add(
    mesh(
      new THREE.CapsuleGeometry(0.3, 0.45, 6, 18),
      carbon,
      [0, 0.31, -0.03],
      [Math.PI / 2, 0, 0],
    ),
    mesh(new THREE.SphereGeometry(0.2, 24, 16), helmet, [0, 0.52, 0.02]),
    mesh(
      new THREE.SphereGeometry(0.205, 24, 12, 0, Math.PI * 2, 0, 1.24),
      visor,
      [0, 0.53, 0.09],
      [Math.PI / 2, 0, 0],
    ),
    halo(carbonEdge),
    mesh(taperedBox(0.08, 0.34, 0.3, 0.46, 0.72), paint, [0, 0.43, -0.68]),
  );

  root.add(
    mesh(new THREE.BoxGeometry(1.84, 0.055, 0.3), carbon, [0, -0.24, 2.28]),
    mesh(new THREE.BoxGeometry(1.62, 0.045, 0.22), warmWhite, [0, -0.15, 2.16]),
    mesh(new THREE.BoxGeometry(0.06, 0.3, 0.48), carbonEdge, [-0.9, -0.08, 2.23]),
    mesh(new THREE.BoxGeometry(0.06, 0.3, 0.48), carbonEdge, [0.9, -0.08, 2.23]),
    mesh(new THREE.BoxGeometry(1.48, 0.09, 0.32), paint, [0, 0.66, -1.67]),
    mesh(new THREE.BoxGeometry(1.36, 0.055, 0.25), carbon, [0, 0.51, -1.6]),
    mesh(new THREE.BoxGeometry(0.065, 0.66, 0.42), carbonEdge, [-0.69, 0.35, -1.62]),
    mesh(new THREE.BoxGeometry(0.065, 0.66, 0.42), carbonEdge, [0.69, 0.35, -1.62]),
    mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), carbon, [-0.32, 0.27, -1.48]),
    mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), carbon, [0.32, 0.27, -1.48]),
    mesh(new THREE.BoxGeometry(0.13, 0.06, 0.05), redLight, [0, -0.03, -1.76]),
  );

  const wheelSpecs = [
    { radius: 0.38, width: 0.27, x: 0.93, z: 1.34 },
    { radius: 0.38, width: 0.27, x: -0.93, z: 1.34 },
    { radius: 0.43, width: 0.36, x: 0.91, z: -1.15 },
    { radius: 0.43, width: 0.36, x: -0.91, z: -1.15 },
  ];

  for (const spec of wheelSpecs) {
    const wheelGroup = wheel(
      spec.radius,
      spec.width,
      spec.x,
      spec.z,
      tire,
      rim,
      warmWhite,
    );
    wheels.push(wheelGroup);
    root.add(wheelGroup);
  }

  for (const side of [-1, 1]) {
    const frontHub = new THREE.Vector3(side * 0.78, 0, 1.34);
    const rearHub = new THREE.Vector3(side * 0.74, 0, -1.15);
    root.add(
      rod(new THREE.Vector3(side * 0.25, -0.1, 1.02), frontHub, 0.018, carbonEdge),
      rod(new THREE.Vector3(side * 0.28, 0.18, 1.08), frontHub, 0.018, carbonEdge),
      rod(new THREE.Vector3(side * 0.34, -0.13, -0.82), rearHub, 0.021, carbonEdge),
      rod(new THREE.Vector3(side * 0.38, 0.2, -0.89), rearHub, 0.021, carbonEdge),
    );
  }

  root.position.y = 0.02;
  root.scale.setScalar(0.92);
  return { root, wheels };
}
