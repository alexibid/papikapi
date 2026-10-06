import { Component } from '@angular/core';
import { StickerComponent } from '@ui/atoms/sticker/sticker';
import { STAGE_ORNAMENTS } from './ornaments';

@Component({
  selector: 'papikapi-scenery',
  standalone: true,
  imports: [StickerComponent],
  templateUrl: './scenery.html',
  styleUrl: './scenery.scss',
})
export class SceneryComponent {
  protected readonly ornaments = STAGE_ORNAMENTS;
}
