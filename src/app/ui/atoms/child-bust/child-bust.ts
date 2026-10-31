import { Component, input } from '@angular/core';
import { HandDrawnDirective } from 'ibid-ui';
import { ChildProfile } from '@domain/models/child-profile';
import { StickerComponent } from '@ui/atoms/sticker/sticker';

@Component({
  selector: 'papikapi-child-bust',
  standalone: true,
  imports: [HandDrawnDirective, StickerComponent],
  templateUrl: './child-bust.html',
  styleUrl: './child-bust.scss',
})
export class ChildBustComponent {
  readonly child = input.required<ChildProfile>();
}
