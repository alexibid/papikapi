import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  ButtonComponent,
  CardComponent,
  FocusStateDirective,
  HandDrawnDirective,
  IconButtonComponent,
  TactileDirective,
} from 'ibid-ui';
import { I18nService } from '@ibid/services';
import {
  CaregiverProfile,
  FamilyStructure,
  HouseholdIconPreset,
  HouseholdProfile,
  HouseholdType,
} from '@domain/models/household';
import { ChildProfile } from '@domain/models/child-profile';
import { HouseholdStore } from '@application/services/household-store';
import { ChildProfilesStore } from '@application/services/child-profiles-store';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';

export const PAPER_PALETTE: readonly string[] = [
  '#F4C95D',
  '#D6F0E0',
  '#DBEAFE',
  '#F8E4D6',
  '#E9D5FF',
  '#FCE7F3',
];

interface ChildDraft {
  readonly id: string;
  name: string;
  paperColor: string;
}

@Component({
  selector: 'papikapi-onboarding-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    FocusStateDirective,
    HandDrawnDirective,
    IconButtonComponent,
    PictogramComponent,
    RouterModule,
    TactileDirective,
  ],
  templateUrl: './onboarding.page.html',
  styleUrl: './onboarding.page.scss',
})
export class OnboardingPage {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly householdStore = inject(HouseholdStore);
  private readonly childStore = inject(ChildProfilesStore);

  readonly palette = PAPER_PALETTE;

  readonly householdType = signal<HouseholdType>('family');
  readonly groupName = signal('');
  readonly structure = signal<FamilyStructure>('single_parent');
  readonly caregiverNames = signal<string[]>(['Papá']);
  readonly educatorName = signal('Educador(a)');

  readonly children = signal<ChildDraft[]>([
    { id: crypto.randomUUID(), name: 'Tomás', paperColor: PAPER_PALETTE[0] },
  ]);

  readonly iconPreset = signal<HouseholdIconPreset>('single_child');
  readonly uploadedPhoto = signal<string | null>(null);

  readonly defaultGroupName = computed(() =>
    this.householdType() === 'family' ? 'Família Papikapi' : 'Sala das Estrelas'
  );

  readonly previewIconSrc = computed(() => {
    const uploaded = this.uploadedPhoto();
    if (uploaded) return uploaded;
    switch (this.iconPreset()) {
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

  setType(type: HouseholdType): void {
    this.householdType.set(type);
    if (type === 'daycare') {
      this.iconPreset.set('daycare');
    } else {
      this.iconPreset.set(this.structure() === 'two_parents' ? 'two_parents' : 'single_parent');
    }
  }

  setStructure(structure: FamilyStructure): void {
    this.structure.set(structure);
    if (structure === 'single_parent') {
      this.caregiverNames.set(['Papá']);
      this.iconPreset.set('single_parent');
    } else if (structure === 'two_parents') {
      this.caregiverNames.set(['Mamã', 'Papá']);
      this.iconPreset.set('two_parents');
    }
  }

  updateCaregiver(index: number, name: string): void {
    this.caregiverNames.update((names) => {
      const copy = [...names];
      copy[index] = name;
      return copy;
    });
  }

  addCaregiver(): void {
    this.caregiverNames.update((names) => [...names, `Adulto ${names.length + 1}`]);
  }

  removeCaregiver(index: number): void {
    if (this.caregiverNames().length <= 1) return;
    this.caregiverNames.update((names) => names.filter((_, i) => i !== index));
  }

  addChild(): void {
    const nextColor = this.palette[this.children().length % this.palette.length];
    const newChild: ChildDraft = {
      id: crypto.randomUUID(),
      name: `Criança ${this.children().length + 1}`,
      paperColor: nextColor,
    };
    this.children.update((kids) => [...kids, newChild]);
  }

  removeChild(id: string): void {
    if (this.children().length <= 1) return;
    this.children.update((kids) => kids.filter((k) => k.id !== id));
  }

  updateChildName(id: string, name: string): void {
    this.children.update((kids) =>
      kids.map((kid) => (kid.id === id ? { ...kid, name } : kid))
    );
  }

  updateChildColor(id: string, paperColor: string): void {
    this.children.update((kids) =>
      kids.map((kid) => (kid.id === id ? { ...kid, paperColor } : kid))
    );
  }

  setIconPreset(preset: HouseholdIconPreset): void {
    this.iconPreset.set(preset);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.uploadedPhoto.set(result);
      this.iconPreset.set('custom_flux');
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.uploadedPhoto.set(null);
    this.iconPreset.set('single_child');
  }

  finish(): void {
    const isDaycare = this.householdType() === 'daycare';
    const caregivers: CaregiverProfile[] = isDaycare
      ? [{ id: crypto.randomUUID(), name: this.educatorName(), role: 'educator' }]
      : this.caregiverNames().map((name, i) => ({
          id: `caregiver-${i + 1}`,
          name: name.trim() || `Adulto ${i + 1}`,
          role: 'parent',
        }));

    const household: HouseholdProfile = {
      type: this.householdType(),
      name: (this.groupName().trim() || this.defaultGroupName()),
      caregivers,
      childrenCount: this.children().length,
      familyPhotoUrl: this.uploadedPhoto() ?? undefined,
      iconPreset: this.iconPreset(),
      isConfigured: true,
    };

    const profiles: ChildProfile[] = this.children().map((draft) => ({
      id: draft.id,
      name: draft.name.trim() || 'Criança',
      avatarBustUrl: '',
      paperColor: draft.paperColor,
    }));

    this.householdStore.configure(household);
    this.childStore.setProfiles(profiles);

    void this.router.navigateByUrl('/');
  }

  goBack(): void {
    void this.router.navigateByUrl('/');
  }
}
