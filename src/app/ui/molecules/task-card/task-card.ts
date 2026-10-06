import { Component, computed, input } from '@angular/core';
import { HandDrawnDirective } from 'ibid-ui';
import { RoutinePictogram, RoutineTask } from '@domain/models/routine-task';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';
import { PictogramName } from '@ui/atoms/pictogram/paper-icons';
import { StickerComponent } from '@ui/atoms/sticker/sticker';
import { StickerName } from '@ui/atoms/sticker/stickers';

const STATUS_GLYPH: Readonly<Record<RoutineTask['status'], PictogramName | null>> = {
  done: 'check',
  next: 'hourglass',
  upcoming: null,
};

const TASK_STICKERS: Readonly<Partial<Record<RoutinePictogram, StickerName>>> = {
  toothbrush: 'task-toothbrush',
  bed: 'task-bed',
  backpack: 'task-backpack',
  plate: 'task-plate',
};

@Component({
  selector: 'papikapi-task-card',
  standalone: true,
  imports: [HandDrawnDirective, PictogramComponent, StickerComponent],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCardComponent {
  readonly task = input.required<RoutineTask>();
  readonly ariaLabel = input('');

  protected readonly taskSticker = computed(() => TASK_STICKERS[this.task().pictogram] ?? null);
  protected readonly statusGlyph = computed(() => STATUS_GLYPH[this.task().status]);
}
