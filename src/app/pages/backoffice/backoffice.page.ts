import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardComponent, HandDrawnDirective, SegmentOption, SegmentedControlComponent, SliderComponent } from 'ibid-ui';
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
import { gradeAverage } from '@domain/services/grade-average';
import { pointsPerPiece } from '@domain/services/pieces-built';
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
    RouterModule,
    SegmentedControlComponent,
    SliderComponent,
  ],
  templateUrl: './backoffice.page.html',
  styleUrl: './backoffice.page.scss',
})
export class BackofficePage {
  protected readonly i18n = inject(I18nService);
  protected readonly child = DEMO_CHILD;
  protected readonly agenda = DEMO_AGENDA;
  protected readonly grades = DEMO_GRADES;
  protected readonly rhythm = inject(RhythmStore);
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
}
