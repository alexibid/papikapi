import { Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '@ibid/services';
import { HandDrawnDirective, SegmentOption, SegmentedControlComponent } from 'ibid-ui';
import { CutSheetComponent, SheetVariant } from '@ui/organisms/cut-sheet/cut-sheet';

interface SheetSlide {
  readonly variant: SheetVariant;
  readonly labelKey: string;
}

@Component({
  selector: 'papikapi-sheet-page',
  standalone: true,
  imports: [CutSheetComponent, HandDrawnDirective, SegmentedControlComponent],
  templateUrl: './sheet.page.html',
  styleUrl: './sheet.page.scss',
})
export class SheetPage {
  protected readonly i18n = inject(I18nService);
  protected readonly current = signal(0);

  protected readonly slides: readonly SheetSlide[] = [
    { variant: 'coloured', labelKey: 'sheetColoured' },
    { variant: 'outline', labelKey: 'sheetOutline' },
  ];

  protected readonly options = computed<readonly SegmentOption[]>(() =>
    this.slides.map((slide, index) => ({
      value: String(index),
      label: this.i18n.translate(slide.labelKey),
    }))
  );

  protected show(value: string): void {
    this.current.set(Number(value));
  }
}
