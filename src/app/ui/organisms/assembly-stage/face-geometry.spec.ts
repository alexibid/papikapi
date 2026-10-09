import { describe, expect, it } from 'vitest';
import { AssemblyFace } from '@domain/assembly/assembly-plan';
import { figureBounds, pieceWireframeGeometry } from './face-geometry';

describe('face-geometry wireframe', () => {
  const dummyFaceA: AssemblyFace = {
    id: 1,
    parent: -1,
    depth: 0,
    polygon: [
      [0, 0],
      [10, 0],
      [10, 10],
    ],
    solid: [
      [0, 0, 0],
      [10, 0, 50],
      [10, 10, 100],
    ],
    colour: '#ff0000',
  };

  const dummyFaceB: AssemblyFace = {
    id: 2,
    parent: 1,
    depth: 1,
    polygon: [
      [0, 0],
      [10, 10],
      [0, 10],
    ],
    solid: [
      [0, 0, 0],
      [10, 10, 100],
      [0, 10, 200],
    ],
    colour: '#00ff00',
  };

  describe('figureBounds', () => {
    it('calculates min and max Z across all faces', () => {
      const bounds = figureBounds([dummyFaceA, dummyFaceB]);
      expect(bounds.minZ).toBe(0);
      expect(bounds.maxZ).toBe(200);
    });

    it('falls back to default bounds when face list is empty', () => {
      const bounds = figureBounds([]);
      expect(bounds.minZ).toBe(0);
      expect(bounds.maxZ).toBe(1);
    });
  });

  describe('pieceWireframeGeometry', () => {
    it('creates BufferGeometry with position and color attributes', () => {
      const bounds = figureBounds([dummyFaceA]);
      const geometry = pieceWireframeGeometry([dummyFaceA], bounds);

      const positions = geometry.getAttribute('position');
      const colors = geometry.getAttribute('color');

      expect(positions).toBeDefined();
      expect(colors).toBeDefined();
      // Triangle has 3 edges, 2 vertices each = 6 vertices (18 position values)
      expect(positions.count).toBe(6);
      expect(colors.count).toBe(6);
    });

    it('deduplicates shared edges between faces in the same piece', () => {
      const bounds = figureBounds([dummyFaceA, dummyFaceB]);
      const geometry = pieceWireframeGeometry([dummyFaceA, dummyFaceB], bounds);

      const positions = geometry.getAttribute('position');
      // Face A has 3 edges, Face B has 3 edges. They share the edge between (0,0,0) and (10,10,100).
      // Total unique edges = 5 edges, 2 vertices each = 10 vertices.
      expect(positions.count).toBe(10);
    });

    it('applies rainbow vertex colors based on height', () => {
      const bounds = { minZ: 0, maxZ: 100 };
      const geometry = pieceWireframeGeometry([dummyFaceA], bounds);
      const colors = geometry.getAttribute('color');

      // The first vertex of the first edge is at z = 0 (bottom -> Red)
      expect(colors.getX(0)).toBeGreaterThan(0.8); // High red
      expect(colors.getY(0)).toBeLessThan(0.3); // Low green
      expect(colors.getZ(0)).toBeLessThan(0.3); // Low blue
    });
  });
});
