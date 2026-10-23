import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import {
  IBID_TACTILE_MOTION_CONFIG,
  InteractionAnimationStrategy,
  TactileMotionConfig,
  TactileRole
} from 'ibid-ui';

export const PAPIKAPI_TACTILE_MOTION_CONFIG: TactileMotionConfig = {
  pressScaleX: 0.9,
  pressScaleY: 0.94,
  releaseOvershootScale: 1.07,
  pressDurationMs: 90,
  releaseDurationMs: 360,
  springEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
};

@Injectable({ providedIn: 'root' })
export class PapikapiPlayfulAnimationStrategy implements InteractionAnimationStrategy {
  private readonly doc = inject(DOCUMENT);
  private readonly motionConfig = inject(IBID_TACTILE_MOTION_CONFIG);

  animatePress(element: HTMLElement, role: TactileRole): void {
    element.setAttribute('data-motion-phase', 'pressed');
    if (this.prefersReducedMotion()) {
      return;
    }
    const tilt = role === 'keypad' || role === 'primary' ? '-1deg' : '0deg';
    const { pressScaleX, pressScaleY, pressDurationMs } = this.motionConfig;
    element.style.setProperty('--ibid-active-scale-x', `${pressScaleX}`);
    element.style.setProperty('--ibid-active-scale-y', `${pressScaleY}`);
    this.runKeyframes(
      element,
      [
        { transform: 'scale(1, 1) translateY(0) rotate(0deg)' },
        { transform: `scale(${pressScaleX}, ${pressScaleY}) translateY(2.5px) rotate(${tilt})` }
      ],
      { duration: pressDurationMs, easing: 'ease-out', fill: 'forwards' }
    );
  }

  animateRelease(element: HTMLElement, _role: TactileRole): void {
    element.setAttribute('data-motion-phase', 'releasing');
    element.style.removeProperty('--ibid-active-scale-x');
    element.style.removeProperty('--ibid-active-scale-y');
    if (this.prefersReducedMotion()) {
      element.setAttribute('data-motion-phase', 'resting');
      return;
    }
    const { pressScaleX, pressScaleY, releaseOvershootScale, releaseDurationMs, springEasing } =
      this.motionConfig;
    this.runKeyframes(
      element,
      [
        { transform: `scale(${pressScaleX}, ${pressScaleY}) translateY(2.5px)` },
        { transform: `scale(${releaseOvershootScale}, 0.96) translateY(-2px)` },
        { transform: 'scale(0.98, 1.02) translateY(0)' },
        { transform: 'scale(1, 1) translateY(0)' }
      ],
      { duration: releaseDurationMs, easing: springEasing, fill: 'none' }
    );
  }

  animateBlocked(element: HTMLElement): void {
    element.setAttribute('data-motion-phase', 'blocked');
    if (this.prefersReducedMotion()) {
      return;
    }
    this.runKeyframes(
      element,
      [
        { transform: 'translateX(0) rotate(0deg)' },
        { transform: 'translateX(-6px) rotate(-3.5deg)' },
        { transform: 'translateX(6px) rotate(3.5deg)' },
        { transform: 'translateX(-4px) rotate(-2deg)' },
        { transform: 'translateX(4px) rotate(2deg)' },
        { transform: 'translateX(0) rotate(0deg)' }
      ],
      { duration: 340, easing: 'ease-in-out' }
    );
  }

  animateMissingRequired(element: HTMLElement): void {
    element.setAttribute('data-motion-alert', 'missing-required');
    if (this.prefersReducedMotion()) {
      return;
    }
    this.runKeyframes(
      element,
      [
        { transform: 'translateX(0) scale(1, 1) rotate(0deg)' },
        { transform: 'translateX(-9px) scale(1.03, 0.97) rotate(-1.5deg)' },
        { transform: 'translateX(9px) scale(0.97, 1.03) rotate(1.5deg)' },
        { transform: 'translateX(-6px) scale(1.02, 0.98) rotate(-1deg)' },
        { transform: 'translateX(6px) scale(0.99, 1.01) rotate(1deg)' },
        { transform: 'translateX(0) scale(1, 1) rotate(0deg)' }
      ],
      { duration: 420, easing: this.motionConfig.springEasing }
    );
  }

  animateInvalid(element: HTMLElement): void {
    element.setAttribute('data-motion-alert', 'invalid');
    if (this.prefersReducedMotion()) {
      return;
    }
    this.runKeyframes(
      element,
      [
        { transform: 'translateX(0) rotate(0deg)' },
        { transform: 'translateX(-8px) rotate(-1.2deg)' },
        { transform: 'translateX(8px) rotate(1.2deg)' },
        { transform: 'translateX(-5px) rotate(-0.8deg)' },
        { transform: 'translateX(0) rotate(0deg)' }
      ],
      { duration: 360, easing: 'ease-in-out' }
    );
  }

  animateSuccess(element: HTMLElement): void {
    element.setAttribute('data-motion-alert', 'success');
    if (this.prefersReducedMotion()) {
      return;
    }
    this.runKeyframes(
      element,
      [
        { transform: 'translateY(0) scale(1, 1)' },
        { transform: 'translateY(-6px) scale(1.08, 0.95)' },
        { transform: 'translateY(1px) scale(0.97, 1.03)' },
        { transform: 'translateY(0) scale(1, 1)' }
      ],
      { duration: 380, easing: this.motionConfig.springEasing }
    );
  }

  private prefersReducedMotion(): boolean {
    const view = this.doc.defaultView;
    if (!view || typeof view.matchMedia !== 'function') {
      return false;
    }
    return view.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private runKeyframes(
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions
  ): void {
    if (typeof element.animate === 'function') {
      element.animate(keyframes, options);
    }
  }
}
