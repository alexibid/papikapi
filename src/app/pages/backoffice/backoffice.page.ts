import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  CardComponent,
  HandDrawnDirective,
  IconButtonComponent,
  SegmentOption,
  SegmentedControlComponent,
  SliderComponent,
} from 'ibid-ui';
import { I18nService } from '@ibid/services';
import {
  DEMO_AGENDA,
  DEMO_CHILD,
  DEMO_GRADES,
  DEMO_ROUTINES,
  WEEKDAYS,
} from '@domain/data/backoffice-demo';
import { WeekdayId } from '@domain/models/backoffice';
import { RhythmStore } from '@application/services/rhythm-store';
import { RoutineProgressStore } from '@application/services/routine-progress-store';
import { gradeAverage } from '@domain/services/grade-average';
import { pointsPerPiece } from '@domain/services/pieces-built';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';
import { StickerComponent } from '@ui/atoms/sticker/sticker';
import { ProgressPipsComponent } from '@ui/molecules/progress-pips/progress-pips';
import { AgendaItemComponent } from '@ui/molecules/agenda-item/agenda-item';
import { GradeTileComponent } from '@ui/molecules/grade-tile/grade-tile';

@Component({
  selector: 'papikapi-backoffice-page',
  standalone: true,
  imports: [
    AgendaItemComponent,
    CardComponent,
    GradeTileComponent,
    HandDrawnDirective,
    IconButtonComponent,
    PictogramComponent,
    ProgressPipsComponent,
    RouterModule,
    SegmentedControlComponent,
    SliderComponent,
    StickerComponent,
  ],
  templateUrl: './backoffice.page.html',
  styleUrl: './backoffice.page.scss',
})
export class BackofficePage {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  protected readonly child = DEMO_CHILD;
  protected readonly agenda = DEMO_AGENDA;
  protected readonly grades = DEMO_GRADES;
  protected readonly rhythm = inject(RhythmStore);
  private readonly routineStore = inject(RoutineProgressStore);
  protected readonly tasks = this.routineStore.tasks;
  protected readonly doneCount = this.routineStore.doneCount;
  protected readonly pointsPerPiece = computed(() => pointsPerPiece(this.rhythm.rhythm()));
  protected readonly average = gradeAverage(DEMO_GRADES);
  protected readonly selectedDay = signal<WeekdayId>('tue');

  protected readonly dayOptions = computed<readonly SegmentOption[]>(() =>
    WEEKDAYS.map((day) => ({ value: day, label: this.i18n.translate(`boDay_${day}`) }))
  );

  protected readonly backpack = computed(
    () => DEMO_ROUTINES.find((routine) => routine.day === this.selectedDay())?.backpack ?? ''
  );

  protected setSpeed(speed: number): void {
    this.rhythm.setSpeed(speed);
  }

  protected selectDay(value: string): void {
    this.selectedDay.set(value as WeekdayId);
  }

  protected kindLabel(kind: string): string {
    return this.i18n.translate(`boKind_${kind}`);
  }

  protected goBack(): void {
    void this.router.navigate(['/']);
  }
}
