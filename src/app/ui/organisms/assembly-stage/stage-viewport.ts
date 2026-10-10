import { AmbientLight, DirectionalLight, HemisphereLight, Scene, WebGLRenderer } from 'three';
import { OrbitCamera } from './orbit-camera';
import { RendererFactory } from './renderer-factory';

const MAX_PIXEL_RATIO = 2;

export class StageViewport {
  readonly scene = new Scene();
  readonly camera = new OrbitCamera();

  private readonly renderer: WebGLRenderer;
  private readonly resizeObserver?: ResizeObserver;
  private frameId?: number;

  constructor(
    createRenderer: RendererFactory,
    canvas: HTMLCanvasElement,
    private readonly container: HTMLElement
  ) {
    this.renderer = createRenderer(canvas);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
    this.addLights();
    const view = container.ownerDocument.defaultView;
    if (view?.ResizeObserver) {
      this.resizeObserver = new view.ResizeObserver(() => this.fit());
      this.resizeObserver.observe(container);
    }
  }

  fit(): void {
    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;
    this.renderer.setSize(width, height, false);
    this.camera.resize(width / height);
    this.draw();
  }

  draw(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.frameId = requestAnimationFrame(() => this.renderNow());
  }

  renderNow(): void {
    this.renderer.render(this.scene, this.camera.camera);
  }

  dispose(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
  }

  private addLights(): void {
    const key = new DirectionalLight(0xfffdfa, 2.2);
    key.position.set(3.5, 5.5, 4);

    const fill = new DirectionalLight(0xe8f0ff, 1.5);
    fill.position.set(-3.5, 3.5, 3.5);

    const front = new DirectionalLight(0xffffff, 0.9);
    front.position.set(0, 1.5, 5);

    const rim = new DirectionalLight(0xdbe8ff, 1.3);
    rim.position.set(-3.5, 3.5, -4.5);

    const backRim = new DirectionalLight(0xffeedd, 0.8);
    backRim.position.set(3.5, 2.5, -4);

    const bounce = new DirectionalLight(0xffeedd, 0.7);
    bounce.position.set(0, -4, 2);

    this.scene.add(
      new HemisphereLight(0xfff8ee, 0xa0acbc, 2.4),
      new AmbientLight(0xffffff, 0.8),
      key,
      fill,
      front,
      rim,
      backRim,
      bounce
    );
  }
}
