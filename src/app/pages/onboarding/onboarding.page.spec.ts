import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HouseholdStore } from '@application/services/household-store';
import { ChildProfilesStore } from '@application/services/child-profiles-store';
import { OnboardingPage } from './onboarding.page';

describe('OnboardingPage', () => {
  let fixture: ComponentFixture<OnboardingPage>;
  let component: OnboardingPage;
  let householdStore: HouseholdStore;
  let childStore: ChildProfilesStore;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [OnboardingPage],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingPage);
    component = fixture.componentInstance;
    householdStore = TestBed.inject(HouseholdStore);
    childStore = TestBed.inject(ChildProfilesStore);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('initializes with default 1-child preset and family mode', () => {
    expect(component.householdType()).toBe('family');
    expect(component.children().length).toBe(1);
    expect(component.children()[0].name).toBe('Tomás');
    expect(component.iconPreset()).toBe('single_child');
  });

  it('switches to daycare mode and updates icon preset', () => {
    component.setType('daycare');

    expect(component.householdType()).toBe('daycare');
    expect(component.iconPreset()).toBe('daycare');
  });

  it('switches family structure between single_parent and two_parents', () => {
    component.setStructure('two_parents');

    expect(component.structure()).toBe('two_parents');
    expect(component.caregiverNames()).toEqual(['Mamã', 'Papá']);
    expect(component.iconPreset()).toBe('two_parents');

    component.setStructure('single_parent');
    expect(component.structure()).toBe('single_parent');
    expect(component.caregiverNames()).toEqual(['Papá']);
    expect(component.iconPreset()).toBe('single_parent');
  });

  it('adds and removes children keeping at least one child', () => {
    component.addChild();
    expect(component.children().length).toBe(2);

    const firstKidId = component.children()[0].id;
    component.removeChild(firstKidId);
    expect(component.children().length).toBe(1);

    // Try removing the last remaining child
    const lastKidId = component.children()[0].id;
    component.removeChild(lastKidId);
    expect(component.children().length).toBe(1);
  });

  it('completes onboarding, saves to stores and navigates to home', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    component.setType('family');
    component.setStructure('single_parent');
    component.updateChildName(component.children()[0].id, 'Inês');
    component.finish();

    expect(householdStore.isConfigured()).toBe(true);
    expect(householdStore.household().type).toBe('family');
    expect(childStore.profiles().length).toBe(1);
    expect(childStore.profiles()[0].name).toBe('Inês');
    expect(navigateSpy).toHaveBeenCalledWith('/');
  });
});
