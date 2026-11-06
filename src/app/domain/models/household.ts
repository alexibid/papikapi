export type HouseholdType = 'family' | 'daycare';

export type FamilyStructure = 'single_parent' | 'two_parents' | 'custom';

export interface CaregiverProfile {
  readonly id: string;
  readonly name: string;
  readonly role: 'parent' | 'educator' | 'guardian';
}

export type HouseholdIconPreset =
  | 'single_child'
  | 'single_parent'
  | 'two_parents'
  | 'daycare'
  | 'custom_flux';

export interface HouseholdProfile {
  readonly type: HouseholdType;
  readonly name: string;
  readonly caregivers: readonly CaregiverProfile[];
  readonly childrenCount: number;
  readonly familyPhotoUrl?: string;
  readonly iconPreset: HouseholdIconPreset;
  readonly isConfigured: boolean;
}

export const DEFAULT_HOUSEHOLD: HouseholdProfile = {
  type: 'family',
  name: 'Família Papikapi',
  caregivers: [{ id: 'caregiver-1', name: 'Adulto', role: 'parent' }],
  childrenCount: 1,
  iconPreset: 'single_child',
  isConfigured: false,
};

export function isHouseholdProfile(value: unknown): value is HouseholdProfile {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate['type'] === 'family' || candidate['type'] === 'daycare') &&
    typeof candidate['name'] === 'string' &&
    Array.isArray(candidate['caregivers']) &&
    typeof candidate['childrenCount'] === 'number' &&
    typeof candidate['iconPreset'] === 'string' &&
    typeof candidate['isConfigured'] === 'boolean'
  );
}
