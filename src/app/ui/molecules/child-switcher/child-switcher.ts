import { Component, computed, input, output, signal } from '@angular/core';
import { ButtonComponent, HandDrawnDirective, ScrimComponent } from 'ibid-ui';
import { ChildProfile } from '@domain/models/child-profile';
import { ChildBustComponent } from '@ui/atoms/child-bust/child-bust';

@Component({
  selector: 'papikapi-child-switcher',
  standalone: true,
  imports: [ButtonComponent, ChildBustComponent, HandDrawnDirective, ScrimComponent],
  templateUrl: './child-switcher.html',
  styleUrl: './child-switcher.scss',
})
export class ChildSwitcherComponent {
  readonly children = input.required<readonly ChildProfile[]>();
  readonly activeChildId = input.required<string>();
  readonly switchLabel = input.required<string>();
  readonly closeLabel = input.required<string>();
  readonly childSelected = output<ChildProfile>();

  protected readonly isOpen = signal(false);

  protected readonly activeChild = computed(() =>
    this.children().find((child) => child.id === this.activeChildId())
  );

  protected readonly triggerLabel = computed(
    () => `${this.switchLabel()}: ${this.activeChild()?.name ?? ''}`
  );

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((open) => !open);
  }

  protected toggleDrawer(): void {
    this.toggle();
  }

  protected closeDrawer(): void {
    this.close();
  }

  protected selectChild(child: ChildProfile): void {
    this.childSelected.emit(child);
    this.closeDrawer();
  }
}
