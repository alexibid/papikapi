import { Component, computed, input } from '@angular/core';
import { PAPER_ICONS, PictogramName } from './paper-icons';

@Component({
  selector: 'papikapi-pictogram',
  standalone: true,
  templateUrl: './pictogram.html',
  styleUrl: './pictogram.scss',
})
export class PictogramComponent {
  readonly name = input.required<PictogramName>();

  protected readonly icon = computed(() => PAPER_ICONS[this.name()]);
  protected readonly viewBox = computed(() => `0 0 ${this.icon().size} ${this.icon().size}`);
}
