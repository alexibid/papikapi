import { isStaticAsset, parseFigureUrl, studioFigureUrl } from './figures';

describe('figures', () => {
  it('splits a bundled figure url and drops the cache buster', () => {
    expect(parseFigureUrl('/figures/fox/assembly.json?v=12')).toEqual({
      figureId: 'fox',
      file: 'assembly.json',
    });
    expect(parseFigureUrl('/scene/cloud.webp')).toBeNull();
  });

  it('points the local studio at the same figure file', () => {
    expect(studioFigureUrl({ figureId: 'fox', file: 'model.glb' })).toBe(
      'http://localhost:4500/models/fox/model.glb'
    );
  });

  it('rejects a hosting rewrite that answers html with 200', () => {
    const html = new Response('<html>', { headers: { 'content-type': 'text/html' } });
    const json = new Response('{}', { headers: { 'content-type': 'application/json' } });

    expect(isStaticAsset(html)).toBe(false);
    expect(isStaticAsset(json)).toBe(true);
    expect(isStaticAsset(new Response('x', { status: 404 }))).toBe(false);
  });
});
