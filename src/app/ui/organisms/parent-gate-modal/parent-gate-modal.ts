import { Component, computed, inject, output, signal } from '@angular/core';
import { ButtonComponent, HandDrawnDirective } from 'ibid-ui';
import { I18nService } from '@ibid/services';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';

const PIN_LENGTH = 4;
const KEYPAD_DIGITS: readonly string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

@Component({
  selector: 'papikapi-parent-gate-modal',
  standalone: true,
  imports: [ButtonComponent, HandDrawnDirective, PictogramComponent],
  templateUrl: './parent-gate-modal.html',
  styleUrl: './parent-gate-modal.scss',
})
export class ParentGateModalComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly digits = KEYPAD_DIGITS;
  protected readonly pin = signal('');

  readonly unlocked = output<void>();
  readonly dismissed = output<void>();

  protected readonly slots = computed(() =>
    Array.from({ length: PIN_LENGTH }, (_, index) => index < this.pin().length)
  );

  protected press(digit: string): void {
    if (this.pin().length >= PIN_LENGTH) return;
    const next = this.pin() + digit;
    this.pin.set(next);
    if (next.length === PIN_LENGTH) {
      this.unlocked.emit();
    }
  }

  protected erase(): void {
    this.pin.update((current) => current.slice(0, -1));
  }

  protected close(): void {
    this.dismissed.emit();
  }
}
