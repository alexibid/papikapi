export interface ChildProfile {
  readonly id: string;
  readonly name: string;
  readonly avatarBustUrl: string;
  readonly paperColor: string;
  readonly group?: string;
  readonly birthDate?: string;
}

export type ChildProfileDraft = Omit<ChildProfile, 'id'>;

export type ChildProfileChanges = Partial<ChildProfileDraft>;

export function isChildProfile(value: unknown): value is ChildProfile {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'string' &&
    typeof candidate['name'] === 'string' &&
    typeof candidate['avatarBustUrl'] === 'string' &&
    typeof candidate['paperColor'] === 'string' &&
    isOptionalString(candidate['group']) &&
    isOptionalString(candidate['birthDate'])
  );
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}
