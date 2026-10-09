export class BuildAnimation {
  private frameId?: number;

  constructor(private readonly durationMs: number) {}

  run(
    onFrame: (progress: number) => void,
    onFinish: () => void,
    durationMs = this.durationMs
  ): void {
    this.stop();
    const startedAt = performance.now();
    const step = (): void => {
      const progress = Math.min(1, (performance.now() - startedAt) / durationMs);
      onFrame(progress);
      if (progress >= 1) {
        this.frameId = undefined;
        onFinish();
        return;
      }
      this.frameId = requestAnimationFrame(step);
    };
    this.frameId = requestAnimationFrame(step);
  }

  stop(): void {
    if (this.frameId === undefined) return;
    cancelAnimationFrame(this.frameId);
    this.frameId = undefined;
  }
}
