import { Component } from '@angular/core';

@Component({
  selector: 'papikapi-balloon-bunch',
  standalone: true,
  templateUrl: './balloon-bunch.html',
  styleUrl: './balloon-bunch.scss',
})
export class BalloonBunchComponent {
  protected readonly strings: readonly string[] = [
    'M178 213 Q172 330 166 470',
    'M125 308 Q150 390 188 470',
    'M266 303 Q262 390 252 470',
  ];
}
