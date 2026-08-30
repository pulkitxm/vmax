import * as THREE from "three";

type F1CarModel = {
  root: THREE.Group;
  wheels: THREE.Group[];
};

type LoftSection = {
  z: number;
  width: number;
  height: number;
  y: number;
};

function loftGeometry(sections: LoftSection[], radialSegments = 18) {
  const vertices: number[] = [];
  const indices: number[] = [];

  sections.forEach((section) => {
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const angle = (segment / radialSegments) * Math.PI * 2;
      vertices.push(
        Math.cos(angle) * section.width * 0.5,
        section.y + Math.sin(angle) * section.height * 0.5,
        section.z,
      );
    }
  });

  for (let section = 0; section < sections.length - 1; section += 1) {
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const next = (segment + 1) % radialSegments;
      const currentRing = section * radialSegments;
      const nextRing = (section + 1) * radialSegments;
      const a = currentRing + segment;
      const b = currentRing + next;
      const c = nextRing + segment;
      const d = nextRing + next;
      indices.push(a, b, c, b, d, c);
    }
  }

  const rearCenter = vertices.length / 3;
  const rear = sections[0];
  vertices.push(0, rear.y, rear.z);
  const frontCenter = vertices.length / 3;
  const front = sections[sections.length - 1];
  vertices.push(0, front.y, front.z);

  for (let segment = 0; segment < radialSegments; segment += 1) {
    const next = (segment + 1) % radialSegments;
    indices.push(rearCenter, segment, next);
    const ring = (sections.length - 1) * radialSegments;
    indices.push(frontCenter, ring + next, ring + segment);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

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
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7, 1,
    5, 6, 1, 6, 2, 0, 3, 7, 0, 7, 4,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function horizontalPlate(points: Array<[number, number]>, thickness: number) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => {
    if (index === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  });
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -thickness * 0.5, 0);
  geometry.computeVertexNormals();
  return geometry;
}

function verticalPlate(points: Array<[number, number]>, thickness: number) {
  const shape = new THREE.Shape();
  points.forEach(([z, y], index) => {
    if (index === 0) shape.moveTo(-z, y);
    else shape.lineTo(-z, y);
  });
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geometry.rotateY(Math.PI / 2);
  geometry.translate(-thickness * 0.5, 0, 0);
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
  segments = 10,
) {
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start);
  const result = mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), segments),
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
  const ringPath = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-0.35, 0.51, -0.23),
      new THREE.Vector3(-0.43, 0.61, 0.01),
      new THREE.Vector3(-0.33, 0.67, 0.32),
      new THREE.Vector3(0, 0.69, 0.51),
      new THREE.Vector3(0.33, 0.67, 0.32),
      new THREE.Vector3(0.43, 0.61, 0.01),
      new THREE.Vector3(0.35, 0.51, -0.23),
    ],
    false,
    "centripetal",
  );
  result.add(
    new THREE.Mesh(new THREE.TubeGeometry(ringPath, 56, 0.034, 10), material),
    rod(
      new THREE.Vector3(0, 0.69, 0.5),
      new THREE.Vector3(0, 0.25, 0.77),
      0.035,
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
  rimEdge: THREE.Material,
  brake: THREE.Material,
  caliper: THREE.Material,
) {
  const result = new THREE.Group();
  result.add(
    mesh(
      new THREE.CylinderGeometry(radius, radius, width, 48, 2),
      tire,
      [0, 0, 0],
      [0, 0, Math.PI / 2],
    ),
    mesh(
      new THREE.CylinderGeometry(
        radius * 0.57,
        radius * 0.57,
        width + 0.014,
        40,
      ),
      rim,
      [0, 0, 0],
      [0, 0, Math.PI / 2],
    ),
    mesh(
      new THREE.CylinderGeometry(
        radius * 0.39,
        radius * 0.39,
        width + 0.022,
        32,
      ),
      brake,
      [0, 0, 0],
      [0, 0, Math.PI / 2],
    ),
    mesh(
      new THREE.CylinderGeometry(
        radius * 0.12,
        radius * 0.12,
        width + 0.05,
        20,
      ),
      rimEdge,
      [0, 0, 0],
      [0, 0, Math.PI / 2],
    ),
  );

  for (const side of [-1, 1]) {
    const face = side * (width * 0.5 + 0.012);
    result.add(
      mesh(
        new THREE.TorusGeometry(radius * 0.78, 0.012, 6, 48),
        rimEdge,
        [face, 0, 0],
        [0, Math.PI / 2, 0],
      ),
    );
    for (let spoke = 0; spoke < 10; spoke += 1) {
      const angle = (spoke / 10) * Math.PI * 2;
      result.add(
        rod(
          new THREE.Vector3(face, 0, 0),
          new THREE.Vector3(
            face,
            Math.cos(angle) * radius * 0.49,
            Math.sin(angle) * radius * 0.49,
          ),
          0.012,
          rimEdge,
          6,
        ),
      );
    }
  }

  result.add(
    scaledMesh(
      new THREE.BoxGeometry(1, 1, 1),
      caliper,
      [width * 0.52, 0.03, -radius * 0.25],
      [0.045, radius * 0.26, radius * 0.14],
    ),
  );
  result.position.set(x, 0, z);
  return result;
}

function mirror(
  side: number,
  shell: THREE.Material,
  glass: THREE.Material,
  carbon: THREE.Material,
) {
  const result = new THREE.Group();
  const x = side * 0.66;
  result.add(
    rod(
      new THREE.Vector3(side * 0.38, 0.43, 0.2),
      new THREE.Vector3(x, 0.49, 0.29),
      0.015,
      carbon,
      8,
    ),
    scaledMesh(
      new THREE.SphereGeometry(0.18, 20, 12),
      shell,
      [x, 0.5, 0.31],
      [1.05, 0.38, 0.52],
    ),
    scaledMesh(
      new THREE.CircleGeometry(0.14, 20),
      glass,
      [x + side * 0.17, 0.5, 0.31],
      [1, 0.8, 1],
      [0, side * Math.PI * 0.5, 0],
    ),
  );
  return result;
}

export function createF1CarModel(): F1CarModel {
  const root = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const whitePaint = new THREE.MeshPhysicalMaterial({
    color: 0xf2f0eb,
    metalness: 0.18,
    roughness: 0.19,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const redPaint = new THREE.MeshPhysicalMaterial({
    color: 0xe62035,
    metalness: 0.3,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.07,
  });
  const darkRed = new THREE.MeshPhysicalMaterial({
    color: 0x770d19,
    metalness: 0.36,
    roughness: 0.26,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
  });
  const carbon = new THREE.MeshStandardMaterial({
    color: 0x090b0e,
    metalness: 0.62,
    roughness: 0.32,
  });
  const carbonEdge = new THREE.MeshStandardMaterial({
    color: 0x252b31,
    metalness: 0.72,
    roughness: 0.22,
  });
  const tire = new THREE.MeshStandardMaterial({
    color: 0x050607,
    roughness: 0.96,
    metalness: 0,
  });
  const rim = new THREE.MeshStandardMaterial({
    color: 0x0c0f12,
    roughness: 0.24,
    metalness: 0.9,
  });
  const brake = new THREE.MeshStandardMaterial({
    color: 0x3b3d40,
    roughness: 0.52,
    metalness: 0.82,
  });
  const cyan = new THREE.MeshStandardMaterial({
    color: 0x39e7f2,
    emissive: 0x0b7379,
    emissiveIntensity: 1.4,
    metalness: 0.22,
    roughness: 0.28,
  });
  const visor = new THREE.MeshPhysicalMaterial({
    color: 0x101b22,
    metalness: 0.7,
    roughness: 0.09,
    clearcoat: 1,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x21363e,
    metalness: 0.45,
    roughness: 0.08,
    clearcoat: 1,
  });
  const redLight = new THREE.MeshBasicMaterial({ color: 0xff3045 });

  root.add(
    mesh(
      horizontalPlate(
        [
          [-0.9, -1.55],
          [-0.98, -0.6],
          [-0.87, 0.55],
          [-0.53, 1.62],
          [-0.42, 2.2],
          [0.42, 2.2],
          [0.53, 1.62],
          [0.87, 0.55],
          [0.98, -0.6],
          [0.9, -1.55],
        ],
        0.075,
      ),
      carbon,
      [0, -0.31, 0],
    ),
    mesh(
      loftGeometry([
        { z: -1.45, width: 0.66, height: 0.42, y: 0.02 },
        { z: -0.85, width: 0.94, height: 0.55, y: 0.07 },
        { z: -0.2, width: 0.76, height: 0.51, y: 0.08 },
        { z: 0.55, width: 0.62, height: 0.43, y: 0.02 },
        { z: 1.25, width: 0.46, height: 0.3, y: -0.04 },
        { z: 1.92, width: 0.25, height: 0.2, y: -0.08 },
        { z: 2.52, width: 0.12, height: 0.12, y: -0.1 },
      ]),
      whitePaint,
      [0, 0, 0],
    ),
    mesh(
      loftGeometry(
        [
          { z: 0.5, width: 0.12, height: 0.035, y: 0.235 },
          { z: 1.15, width: 0.12, height: 0.035, y: 0.12 },
          { z: 1.9, width: 0.09, height: 0.028, y: 0.03 },
          { z: 2.48, width: 0.055, height: 0.022, y: -0.035 },
        ],
        10,
      ),
      redPaint,
      [0, 0, 0],
    ),
    mesh(
      loftGeometry([
        { z: -1.5, width: 0.28, height: 0.32, y: 0.48 },
        { z: -1.04, width: 0.51, height: 0.66, y: 0.42 },
        { z: -0.5, width: 0.58, height: 0.76, y: 0.36 },
        { z: -0.08, width: 0.44, height: 0.52, y: 0.34 },
      ]),
      whitePaint,
      [0, 0, 0],
    ),
    mesh(
      verticalPlate(
        [
          [-1.48, 0.39],
          [-1.2, 0.94],
          [-0.58, 0.78],
          [-0.03, 0.47],
          [-0.18, 0.33],
          [-1.36, 0.3],
        ],
        0.075,
      ),
      redPaint,
      [0, 0, 0],
    ),
    mesh(
      loftGeometry([
        { z: -0.86, width: 0.36, height: 0.42, y: 0.7 },
        { z: -0.54, width: 0.45, height: 0.5, y: 0.72 },
        { z: -0.23, width: 0.39, height: 0.45, y: 0.67 },
      ]),
      redPaint,
      [0, 0, 0],
    ),
    scaledMesh(
      new THREE.CapsuleGeometry(0.22, 0.34, 8, 24),
      carbon,
      [0, 0.36, 0.03],
      [1.22, 1.1, 1],
      [Math.PI / 2, 0, 0],
    ),
  );

  for (const side of [-1, 1]) {
    root.add(
      mesh(
        loftGeometry([
          { z: -1.28, width: 0.35, height: 0.23, y: -0.05 },
          { z: -0.7, width: 0.56, height: 0.42, y: 0.02 },
          { z: -0.08, width: 0.66, height: 0.48, y: 0.05 },
          { z: 0.43, width: 0.48, height: 0.34, y: 0.02 },
        ]),
        whitePaint,
        [side * 0.49, 0, 0],
      ),
      mesh(
        taperedBox(0.36, 0.5, 0.055, 0.075, 1.32),
        redPaint,
        [side * 0.62, 0.09, -0.42],
        [0, 0, side * 0.035],
      ),
      scaledMesh(
        new THREE.CapsuleGeometry(0.16, 0.26, 6, 18),
        carbon,
        [side * 0.71, 0.12, 0.4],
        [1.08, 0.7, 0.44],
        [Math.PI / 2, 0, 0],
      ),
      mesh(taperedBox(0.07, 0.1, 0.055, 0.075, 2.15), carbonEdge, [
        side * 0.91,
        -0.24,
        -0.28,
      ]),
      mesh(
        new THREE.BoxGeometry(0.035, 0.42, 0.34),
        carbon,
        [side * 0.84, -0.03, 0.55],
        [0, side * 0.09, side * -0.07],
      ),
      mirror(side, redPaint, glass, carbonEdge),
    );

    for (let vane = 0; vane < 3; vane += 1) {
      root.add(
        mesh(
          new THREE.BoxGeometry(0.028, 0.26 - vane * 0.035, 0.46),
          carbon,
          [side * (0.91 + vane * 0.035), -0.04, -0.75 - vane * 0.18],
          [0, side * 0.06, 0],
        ),
      );
    }
  }

  root.add(
    scaledMesh(
      new THREE.CapsuleGeometry(0.2, 0.28, 7, 20),
      darkRed,
      [0, 0.35, -0.01],
      [0.9, 1, 0.78],
      [Math.PI / 2, 0, 0],
    ),
    mesh(new THREE.SphereGeometry(0.205, 28, 18), redPaint, [0, 0.59, 0.02]),
    mesh(
      new THREE.SphereGeometry(0.211, 28, 12, 0, Math.PI * 2, 0, 1.25),
      visor,
      [0, 0.6, 0.095],
      [Math.PI / 2, 0, 0],
    ),
    mesh(
      new THREE.TorusGeometry(0.115, 0.018, 8, 24),
      carbonEdge,
      [0, 0.34, 0.32],
      [-0.42, 0, 0],
    ),
    halo(carbonEdge),
  );

  root.add(
    mesh(
      horizontalPlate(
        [
          [-1.08, 2.25],
          [-1.02, 2.63],
          [-0.48, 2.72],
          [0.48, 2.72],
          [1.02, 2.63],
          [1.08, 2.25],
        ],
        0.055,
      ),
      carbon,
      [0, -0.24, 0],
    ),
    mesh(
      taperedBox(1.83, 2.02, 0.045, 0.055, 0.33),
      whitePaint,
      [0, -0.16, 2.43],
      [-0.05, 0, 0],
    ),
    mesh(
      taperedBox(1.66, 1.88, 0.04, 0.05, 0.28),
      redPaint,
      [0, -0.08, 2.34],
      [-0.12, 0, 0],
    ),
    mesh(
      taperedBox(1.45, 1.7, 0.035, 0.045, 0.24),
      carbonEdge,
      [0, -0.01, 2.27],
      [-0.18, 0, 0],
    ),
  );

  for (const side of [-1, 1]) {
    root.add(
      mesh(
        new THREE.BoxGeometry(0.06, 0.38, 0.56),
        redPaint,
        [side * 1.03, -0.06, 2.46],
        [0, 0, side * 0.05],
      ),
      mesh(new THREE.BoxGeometry(0.025, 0.22, 0.47), carbon, [
        side * 0.88,
        -0.06,
        2.48,
      ]),
    );
  }

  root.add(
    mesh(
      taperedBox(1.58, 1.5, 0.12, 0.1, 0.38),
      redPaint,
      [0, 0.77, -1.58],
      [-0.09, 0, 0],
    ),
    mesh(
      taperedBox(1.48, 1.4, 0.07, 0.06, 0.34),
      carbon,
      [0, 0.61, -1.5],
      [-0.18, 0, 0],
    ),
    mesh(
      taperedBox(1.27, 1.18, 0.06, 0.05, 0.28),
      carbonEdge,
      [0, 0.46, -1.46],
      [-0.22, 0, 0],
    ),
  );

  for (const side of [-1, 1]) {
    root.add(
      mesh(new THREE.BoxGeometry(0.075, 0.82, 0.48), whitePaint, [
        side * 0.76,
        0.4,
        -1.56,
      ]),
      mesh(new THREE.BoxGeometry(0.04, 0.58, 0.34), carbon, [
        side * 0.68,
        0.38,
        -1.5,
      ]),
      rod(
        new THREE.Vector3(side * 0.3, 0.3, -1.42),
        new THREE.Vector3(side * 0.7, 0.73, -1.52),
        0.023,
        carbonEdge,
      ),
    );
  }

  root.add(
    mesh(new THREE.BoxGeometry(0.16, 0.1, 0.08), redLight, [0, -0.02, -1.75]),
    mesh(
      verticalPlate(
        [
          [-1.72, -0.25],
          [-1.48, 0.08],
          [-1.08, 0.02],
          [-1.35, -0.28],
        ],
        0.06,
      ),
      carbon,
      [0, 0, 0],
    ),
  );

  for (const side of [-1, 1]) {
    for (let diffuser = 0; diffuser < 3; diffuser += 1) {
      root.add(
        mesh(
          new THREE.BoxGeometry(0.035, 0.21 + diffuser * 0.035, 0.72),
          carbon,
          [side * (0.26 + diffuser * 0.2), -0.17, -1.35],
          [-0.18, 0, 0],
        ),
      );
    }
  }

  const wheelSpecs = [
    { radius: 0.41, width: 0.29, x: 1.01, z: 1.42 },
    { radius: 0.41, width: 0.29, x: -1.01, z: 1.42 },
    { radius: 0.45, width: 0.38, x: 1, z: -1.17 },
    { radius: 0.45, width: 0.38, x: -1, z: -1.17 },
  ];

  wheelSpecs.forEach((spec) => {
    const wheelGroup = wheel(
      spec.radius,
      spec.width,
      spec.x,
      spec.z,
      tire,
      rim,
      cyan,
      brake,
      redPaint,
    );
    wheels.push(wheelGroup);
    root.add(wheelGroup);
  });

  for (const side of [-1, 1]) {
    const frontHub = new THREE.Vector3(side * 0.84, 0, 1.42);
    const rearHub = new THREE.Vector3(side * 0.81, 0, -1.17);
    root.add(
      rod(
        new THREE.Vector3(side * 0.19, -0.12, 1.12),
        frontHub,
        0.018,
        carbonEdge,
      ),
      rod(
        new THREE.Vector3(side * 0.25, 0.22, 1.08),
        frontHub,
        0.018,
        carbonEdge,
      ),
      rod(
        new THREE.Vector3(side * 0.31, -0.1, -0.82),
        rearHub,
        0.021,
        carbonEdge,
      ),
      rod(
        new THREE.Vector3(side * 0.36, 0.23, -0.88),
        rearHub,
        0.021,
        carbonEdge,
      ),
      rod(
        new THREE.Vector3(side * 0.28, 0.06, 1.28),
        new THREE.Vector3(side * 0.8, -0.08, 1.42),
        0.014,
        carbon,
      ),
    );
  }

  root.add(
    rod(
      new THREE.Vector3(0, 0.62, -0.78),
      new THREE.Vector3(0, 0.87, -0.8),
      0.035,
      carbonEdge,
    ),
    scaledMesh(
      new THREE.CapsuleGeometry(0.08, 0.18, 5, 14),
      carbon,
      [0, 0.91, -0.8],
      [1.8, 0.45, 0.65],
      [0, 0, Math.PI / 2],
    ),
    rod(
      new THREE.Vector3(0, 0.27, 1.02),
      new THREE.Vector3(0, 0.58, 1.04),
      0.008,
      carbonEdge,
      6,
    ),
    rod(
      new THREE.Vector3(0, 0.28, 0.93),
      new THREE.Vector3(0, 0.47, 0.94),
      0.006,
      carbonEdge,
      6,
    ),
  );

  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  root.position.y = 0.03;
  return { root, wheels };
}
