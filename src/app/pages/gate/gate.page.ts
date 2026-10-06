import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent, HandDrawnDirective } from 'ibid-ui';
import { I18nService } from '@ibid/services';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';

const PIN_LENGTH = 4;
const KEYPAD_DIGITS: readonly string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const ADULT_ROUTE = '/pais';

@Component({
  selector: 'papikapi-gate-page',
  standalone: true,
  imports: [ButtonComponent, HandDrawnDirective, PictogramComponent, RouterModule],
  templateUrl: './gate.page.html',
  styleUrl: './gate.page.scss',
})
export class GatePage {
  protected readonly i18n = inject(I18nService);
  protected readonly digits = KEYPAD_DIGITS;
  protected readonly pin = signal('');

  protected readonly slots = computed(() =>
    Array.from({ length: PIN_LENGTH }, (_, index) => index < this.pin().length)
  );

  private readonly router = inject(Router);

  protected press(digit: string): void {
    if (this.pin().length >= PIN_LENGTH) return;
    this.pin.update((current) => current + digit);
    if (this.pin().length === PIN_LENGTH) void this.router.navigateByUrl(ADULT_ROUTE);
  }

  protected erase(): void {
    this.pin.update((current) => current.slice(0, -1));
  }
}
