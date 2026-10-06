import { Component, computed, input } from '@angular/core';
import { StickerName, stickerUrl } from './stickers';

@Component({
  selector: 'papikapi-sticker',
  standalone: true,
  templateUrl: './sticker.html',
  styleUrl: './sticker.scss',
})
export class StickerComponent {
  readonly name = input.required<StickerName>();

  protected readonly url = computed(() => stickerUrl(this.name()));
}
