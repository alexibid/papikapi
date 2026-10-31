import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_CHILD_ID, DEFAULT_CHILD_PROFILE } from '@application/config/child';
import {
  ChildProfile,
  ChildProfileChanges,
  ChildProfileDraft,
  isChildProfile,
} from '@domain/models/child-profile';

export const CHILD_PROFILES_KEY = 'papikapi.child-profiles';
export const ACTIVE_CHILD_KEY = 'papikapi.active-child';

export class UnknownChildError extends Error {
  constructor(childId: string) {
    super(`Unknown child profile: ${childId}`);
    this.name = 'UnknownChildError';
  }
}

@Injectable({ providedIn: 'root' })
export class ChildProfilesStore {
  private readonly profileList = signal<readonly ChildProfile[]>(restoreProfiles());
  private readonly activeId = signal<string>(restoreActiveId(this.profileList()));

  readonly profiles = this.profileList.asReadonly();
  readonly activeChildId = this.activeId.asReadonly();
  readonly activeChild = computed<ChildProfile>(
    () => this.findProfile(this.activeId()) ?? DEFAULT_CHILD_PROFILE
  );

  selectChild(id: string): void {
    this.assertKnown(id);
    this.activeId.set(id);
    writeStorage(ACTIVE_CHILD_KEY, id);
  }

  registerChild(draft: ChildProfileDraft): ChildProfile {
    const profile: ChildProfile = { ...draft, id: crypto.randomUUID() };
    this.saveProfiles([...this.profileList(), profile]);
    return profile;
  }

  updateChild(id: string, changes: ChildProfileChanges): void {
    this.assertKnown(id);
    this.saveProfiles(
      this.profileList().map((profile) => (profile.id === id ? { ...profile, ...changes, id } : profile))
    );
  }

  private findProfile(id: string): ChildProfile | undefined {
    return this.profileList().find((profile) => profile.id === id);
  }

  private assertKnown(id: string): void {
    if (!this.findProfile(id)) throw new UnknownChildError(id);
  }

  private saveProfiles(profiles: readonly ChildProfile[]): void {
    this.profileList.set(profiles);
    writeStorage(CHILD_PROFILES_KEY, JSON.stringify(profiles));
  }
}

function restoreProfiles(): readonly ChildProfile[] {
  const stored = parseStoredProfiles();
  const hasDefault = stored.some((profile) => profile.id === DEFAULT_CHILD_ID);
  return hasDefault ? stored : [DEFAULT_CHILD_PROFILE, ...stored];
}

function parseStoredProfiles(): readonly ChildProfile[] {
  try {
    const parsed: unknown = JSON.parse(readStorage(CHILD_PROFILES_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isChildProfile) : [];
  } catch {
    return [];
  }
}

function restoreActiveId(profiles: readonly ChildProfile[]): string {
  const stored = readStorage(ACTIVE_CHILD_KEY);
  return profiles.some((profile) => profile.id === stored) ? (stored ?? DEFAULT_CHILD_ID) : DEFAULT_CHILD_ID;
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
