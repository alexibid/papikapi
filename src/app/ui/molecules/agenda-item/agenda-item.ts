import { Component, computed, input } from '@angular/core';
import { HandDrawnDirective } from 'ibid-ui';
import { AgendaEvent, AgendaEventKind } from '@domain/models/backoffice';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';
import { PictogramName } from '@ui/atoms/pictogram/paper-icons';

const KIND_PICTOGRAM: Readonly<Record<AgendaEventKind, PictogramName>> = {
  meeting: 'calendar',
  health: 'health',
  test: 'book',
};

@Component({
  selector: 'papikapi-agenda-item',
  standalone: true,
  imports: [HandDrawnDirective, PictogramComponent],
  templateUrl: './agenda-item.html',
  styleUrl: './agenda-item.scss',
})
export class AgendaItemComponent {
  readonly event = input.required<AgendaEvent>();
  readonly kindLabel = input.required<string>();

  protected readonly pictogram = computed(() => KIND_PICTOGRAM[this.event().kind]);
}
