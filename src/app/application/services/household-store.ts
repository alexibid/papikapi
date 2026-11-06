import { Injectable, computed, signal } from '@angular/core';
import {
  DEFAULT_HOUSEHOLD,
  HouseholdIconPreset,
  HouseholdProfile,
  isHouseholdProfile,
} from '@domain/models/household';

export const HOUSEHOLD_STORAGE_KEY = 'papikapi.household';

@Injectable({ providedIn: 'root' })
export class HouseholdStore {
  private readonly state = signal<HouseholdProfile>(restoreHousehold());

  readonly household = this.state.asReadonly();
  readonly isConfigured = computed(() => this.state().isConfigured);
  readonly isDaycare = computed(() => this.state().type === 'daycare');
  readonly iconPreset = computed(() => this.state().iconPreset);

  readonly activeIconUrl = computed(() => {
    const current = this.state();
    if (current.iconPreset === 'custom_flux' && current.familyPhotoUrl) {
      return current.familyPhotoUrl;
    }
    switch (current.iconPreset) {
      case 'single_parent':
      case 'two_parents':
        return 'scene/photo.webp';
      case 'daycare':
        return 'scene/avatar.webp';
      case 'single_child':
      default:
        return 'favicon-32x32.png';
    }
  });

  readonly compositionSummary = computed(() => {
    const current = this.state();
    const children = current.childrenCount;
    const childrenText = children === 1 ? '1 Criança' : `${children} Crianças`;

    if (current.type === 'daycare') {
      const educator = current.caregivers[0]?.name ?? 'Educador';
      return `${educator} · ${childrenText}`;
    }

    const caregivers = current.caregivers.length;
    const caregiversText = caregivers === 1 ? '1 Adulto' : `${caregivers} Adultos`;
    return `${caregiversText} · ${childrenText}`;
  });

  configure(profile: HouseholdProfile): void {
    const updated: HouseholdProfile = { ...profile, isConfigured: true };
    this.save(updated);
  }

  updatePhoto(photoDataUrl: string): void {
    const updated: HouseholdProfile = {
      ...this.state(),
      familyPhotoUrl: photoDataUrl,
      iconPreset: 'custom_flux',
    };
    this.save(updated);
  }

  setIconPreset(preset: HouseholdIconPreset): void {
    const updated: HouseholdProfile = { ...this.state(), iconPreset: preset };
    this.save(updated);
  }

  reset(): void {
    this.save(DEFAULT_HOUSEHOLD);
  }

  private save(profile: HouseholdProfile): void {
    this.state.set(profile);
    writeStorage(HOUSEHOLD_STORAGE_KEY, JSON.stringify(profile));
  }
}

function restoreHousehold(): HouseholdProfile {
  try {
    const raw = readStorage(HOUSEHOLD_STORAGE_KEY);
    if (!raw) return DEFAULT_HOUSEHOLD;
    const parsed: unknown = JSON.parse(raw);
    return isHouseholdProfile(parsed) ? parsed : DEFAULT_HOUSEHOLD;
  } catch {
    return DEFAULT_HOUSEHOLD;
  }
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}
