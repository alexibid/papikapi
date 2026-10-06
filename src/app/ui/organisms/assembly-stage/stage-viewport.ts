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
    const key = new DirectionalLight(0xffffff, 1.9);
    key.position.set(3, 6, 4);
    const rim = new DirectionalLight(0xdfe7f5, 0.9);
    rim.position.set(-4, 2, -5);
    this.scene.add(
      new HemisphereLight(0xfff6e5, 0x8f8f8f, 2.1),
      new AmbientLight(0xffffff, 0.5),
      key,
      rim
    );
  }
}
