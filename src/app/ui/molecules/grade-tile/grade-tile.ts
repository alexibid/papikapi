import { Component, input } from '@angular/core';
import { HandDrawnDirective } from 'ibid-ui';
import { SubjectGrade } from '@domain/models/backoffice';

@Component({
  selector: 'papikapi-grade-tile',
  standalone: true,
  imports: [HandDrawnDirective],
  templateUrl: './grade-tile.html',
  styleUrl: './grade-tile.scss',
})
export class GradeTileComponent {
  readonly grade = input.required<SubjectGrade>();
}
