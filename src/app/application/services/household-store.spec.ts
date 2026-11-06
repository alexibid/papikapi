import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_HOUSEHOLD, HouseholdProfile } from '@domain/models/household';
import { HOUSEHOLD_STORAGE_KEY, HouseholdStore } from './household-store';

describe('HouseholdStore', () => {
  let store: HouseholdStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    store = TestBed.inject(HouseholdStore);
  });

  it('initializes with DEFAULT_HOUSEHOLD when storage is empty', () => {
    expect(store.household()).toEqual(DEFAULT_HOUSEHOLD);
    expect(store.isConfigured()).toBe(false);
    expect(store.isDaycare()).toBe(false);
    expect(store.activeIconUrl()).toBe('favicon-32x32.png');
  });

  it('configures household and persists to localStorage', () => {
    const profile: HouseholdProfile = {
      type: 'family',
      name: 'Família Silva',
      caregivers: [
        { id: '1', name: 'Mãe', role: 'parent' },
        { id: '2', name: 'Pai', role: 'parent' },
      ],
      childrenCount: 2,
      iconPreset: 'two_parents',
      isConfigured: false,
    };

    store.configure(profile);

    expect(store.isConfigured()).toBe(true);
    expect(store.household().name).toBe('Família Silva');
    expect(store.activeIconUrl()).toBe('scene/photo.webp');
    expect(store.compositionSummary()).toBe('2 Adultos · 2 Crianças');

    const stored = JSON.parse(localStorage.getItem(HOUSEHOLD_STORAGE_KEY) ?? '{}');
    expect(stored.name).toBe('Família Silva');
    expect(stored.isConfigured).toBe(true);
  });

  it('formats daycare summary correctly', () => {
    const daycare: HouseholdProfile = {
      type: 'daycare',
      name: 'Creche Estrelinhas',
      caregivers: [{ id: '1', name: 'Educadora Teresa', role: 'educator' }],
      childrenCount: 6,
      iconPreset: 'daycare',
      isConfigured: true,
    };

    store.configure(daycare);

    expect(store.isDaycare()).toBe(true);
    expect(store.compositionSummary()).toBe('Educadora Teresa · 6 Crianças');
    expect(store.activeIconUrl()).toBe('scene/avatar.webp');
  });

  it('switches to custom_flux icon preset when photo is updated', () => {
    const fakeDataUrl = 'data:image/png;base64,mockedPhoto';
    store.updatePhoto(fakeDataUrl);

    expect(store.iconPreset()).toBe('custom_flux');
    expect(store.activeIconUrl()).toBe(fakeDataUrl);
  });

  it('resets household back to DEFAULT_HOUSEHOLD', () => {
    store.updatePhoto('data:image/png;base64,abc');
    store.reset();

    expect(store.household()).toEqual(DEFAULT_HOUSEHOLD);
    expect(store.isConfigured()).toBe(false);
  });
});
