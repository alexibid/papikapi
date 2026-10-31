import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ChildProfile } from '@domain/models/child-profile';
import { ChildSwitcherComponent } from './child-switcher';

const CLASSROOM: readonly ChildProfile[] = [
  { id: 'ines', name: 'Inês', avatarBustUrl: 'scene/ines.webp', paperColor: '#F8E4D6' },
  { id: 'tomas', name: 'Tomás', avatarBustUrl: 'scene/tomas.webp', paperColor: '#D6F0E0' },
  { id: 'leonor', name: 'Leonor', avatarBustUrl: '', paperColor: '#DBEAFE' },
];

describe('ChildSwitcherComponent', () => {
  let fixture: ComponentFixture<ChildSwitcherComponent>;
  let host: HTMLElement;
  let selected: ChildProfile[];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ChildSwitcherComponent] });
    fixture = TestBed.createComponent(ChildSwitcherComponent);
    fixture.componentRef.setInput('children', CLASSROOM);
    fixture.componentRef.setInput('activeChildId', 'tomas');
    fixture.componentRef.setInput('switchLabel', 'Trocar de criança');
    fixture.componentRef.setInput('closeLabel', 'Fechar');
    selected = [];
    fixture.componentInstance.childSelected.subscribe((child) => selected.push(child));
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  function cards(): HTMLElement[] {
    return Array.from(host.querySelectorAll<HTMLElement>('.m-child-switcher__card'));
  }

  function openDrawer(): void {
    fixture.componentInstance.open();
    fixture.detectChanges();
  }

  it('should keep the drawer closed by default', () => {
    expect(host.querySelector('.m-child-switcher__drawer')).toBeNull();
  });

  it('should open a drawer with one paper card per child', () => {
    openDrawer();

    const drawer = host.querySelector('.m-child-switcher__drawer');
    expect(drawer?.getAttribute('role')).toBe('dialog');
    expect(drawer?.getAttribute('aria-label')).toBe('Trocar de criança');
    expect(cards().map((card) => card.textContent?.trim())).toEqual(['Inês', 'Tomás', 'Leonor']);
  });

  it('should mark only the active child card as active', () => {
    openDrawer();

    const activeCards = cards().filter((card) =>
      card.classList.contains('m-child-switcher__card--active')
    );
    expect(activeCards.map((card) => card.textContent?.trim())).toEqual(['Tomás']);
  });

  it('should emit the tapped child and close the drawer', () => {
    openDrawer();

    cards()[2]?.querySelector('button')?.click();
    fixture.detectChanges();

    expect(selected).toEqual([CLASSROOM[2]]);
    expect(host.querySelector('.m-child-switcher__drawer')).toBeNull();
  });

  it('should close the drawer without selecting when the scrim is dismissed', () => {
    openDrawer();

    host.querySelector<HTMLButtonElement>('.a-scrim')?.click();
    fixture.detectChanges();

    expect(selected).toEqual([]);
    expect(host.querySelector('.m-child-switcher__drawer')).toBeNull();
  });

  it('should close the drawer when Escape is pressed', () => {
    openDrawer();

    cards()[0]
      ?.querySelector('button')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(host.querySelector('.m-child-switcher__drawer')).toBeNull();
  });

  it('should toggle the drawer with toggle()', () => {
    fixture.componentInstance.toggle();
    fixture.detectChanges();
    expect(host.querySelector('.m-child-switcher__drawer')).not.toBeNull();

    fixture.componentInstance.toggle();
    fixture.detectChanges();
    expect(host.querySelector('.m-child-switcher__drawer')).toBeNull();
  });
});
