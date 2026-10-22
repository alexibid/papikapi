import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { PAPIKAPI_I18N_CONFIG } from '../../i18n.config';
import { HomePage } from '../../pages/home/home.page';
import { AssemblyPlanService } from '../services/assembly-plan.service';
import { CreationProgressService } from '../services/creation-progress.service';
import { FigureProgressStore } from '../services/figure-progress-store';
import { FINAL_MODEL_LOADER } from '@ui/organisms/assembly-stage/final-model-loader';
import { RENDERER_FACTORY } from '@ui/organisms/assembly-stage/renderer-factory';
import { DEFAULT_FIGURE_ID } from '@domain/data/shipped-figures';
import { creationProgressStub } from '../../testing/creation-progress.stub';

import { PapikapiDatabaseService } from '../../infrastructure/rxdb/papikapi-database.service';

const stubRenderer = {
  setPixelRatio: vi.fn(),
  setSize: vi.fn(),
  render: vi.fn(),
  dispose: vi.fn(),
};

describe('User Journey: Figure Progression & Points Economy', () => {
  let fixture: ComponentFixture<HomePage>;
  let component: HomePage;
  let progressStore: FigureProgressStore;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: I18N_CONFIG_TOKEN, useValue: PAPIKAPI_I18N_CONFIG },
        {
          provide: AssemblyPlanService,
          useValue: { load: vi.fn().mockRejectedValue(new Error('offline')) },
        },
        { provide: RENDERER_FACTORY, useValue: () => stubRenderer },
        { provide: CreationProgressService, useValue: creationProgressStub },
        { provide: FINAL_MODEL_LOADER, useValue: () => Promise.reject(new Error('offline')) },
      ],
    }).compileComponents();

    progressStore = TestBed.inject(FigureProgressStore);
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Award 10 consolidated points to default figure and allocate 1 point to ankylosaurus so shelf has multiple active figures
    progressStore.syncTotalPoints(110);
    progressStore.allocatePoint('ankylosaurus');
    fixture.detectChanges();
  });

  afterEach(async () => {
    await TestBed.inject(PapikapiDatabaseService).close();
  });

  describe('Journey 1: Figure switching on the shelf', () => {
    it('allows clicking any figure on the shelf to display it on the stage in its own current state', () => {
      expect(progressStore.progress().currentId).toBe(DEFAULT_FIGURE_ID);

      const trophies = fixture.nativeElement.querySelectorAll('papikapi-trophy');
      expect(trophies.length).toBeGreaterThan(1);

      // Second trophy on shelf
      const secondTrophy = trophies[1] as HTMLElement;
      const targetId = component['shelves']()[0].trophies[1].figureId;
      expect(targetId).not.toBe(DEFAULT_FIGURE_ID);

      // Clicking the trophy card selects it
      const pickArea = secondTrophy.querySelector('.m-trophy__figure') ?? secondTrophy;
      (pickArea as HTMLElement).click();
      fixture.detectChanges();

      expect(progressStore.progress().currentId).toBe(targetId);
      expect(component['currentModelId']()).toBe(targetId);
      expect(component['figureSource']()).toContain(targetId);
    });

    it('does not revert to the previous figure and does not celebrate an unfinished figure', () => {
      const trophies = fixture.nativeElement.querySelectorAll('papikapi-trophy');
      const secondTrophy = trophies[1] as HTMLElement;
      const targetId = component['shelves']()[0].trophies[1].figureId;

      (secondTrophy.querySelector('.m-trophy__figure') as HTMLElement).click();
      fixture.detectChanges();

      expect(progressStore.progress().currentId).toBe(targetId);

      // Simulate stage ready and settled with 1 built piece out of 20 total
      component['onStageReady'](20);
      component['onStageSettled'](1);
      fixture.detectChanges();

      // Celebration timer must NEVER be scheduled for an incomplete figure
      expect(component['celebration']).toBeUndefined();
      expect(progressStore.progress().currentId).toBe(targetId);
      expect(component['currentModelId']()).toBe(targetId);
    });

    it('does not revert to default figure if the stage emits a failure', () => {
      const trophies = fixture.nativeElement.querySelectorAll('papikapi-trophy');
      const secondTrophy = trophies[1] as HTMLElement;
      const targetId = component['shelves']()[0].trophies[1].figureId;

      (secondTrophy.querySelector('.m-trophy__figure') as HTMLElement).click();
      fixture.detectChanges();

      expect(progressStore.progress().currentId).toBe(targetId);

      // Stage failed event occurs
      component['onStageFailed']();
      fixture.detectChanges();

      // Must remain on targetId
      expect(progressStore.progress().currentId).toBe(targetId);
    });
  });

  describe('Journey 2: Action buttons (+ and -)', () => {
    it('renders + and - buttons on all shelf figures, including the chosen figure and other trophies', () => {
      const trophies = fixture.nativeElement.querySelectorAll('papikapi-trophy');
      expect(trophies.length).toBeGreaterThan(1);

      // First trophy is the chosen one (DEFAULT_FIGURE_ID) - now also has + and - buttons!
      const chosenTrophyEl = trophies[0] as HTMLElement;
      expect(chosenTrophyEl.querySelector('.m-trophy__action-btn--plus')).not.toBeNull();
      expect(chosenTrophyEl.querySelector('.m-trophy__action-btn--minus')).not.toBeNull();

      // Second trophy is not chosen: also has + and - buttons
      const otherTrophyEl = trophies[1] as HTMLElement;
      expect(otherTrophyEl.querySelector('.m-trophy__action-btn--plus')).not.toBeNull();
      expect(otherTrophyEl.querySelector('.m-trophy__action-btn--minus')).not.toBeNull();
    });
  });

  describe('Journey 3: Transferring points between figures and the active figure', () => {
    it('transfers points to/from the chosen figure using + and - buttons on all figures, and removes figures at 0 points via the remove button', () => {
      const shelves = component['shelves']();
      const firstId = shelves[0].trophies[0].figureId;
      const secondId = shelves[0].trophies[1].figureId;

      expect(progressStore.allocation(firstId)).toBe(10);
      expect(progressStore.allocation(secondId)).toBe(1);

      const trophies = fixture.nativeElement.querySelectorAll('papikapi-trophy');
      const chosenTrophyEl = trophies[0] as HTMLElement;
      const otherTrophyEl = trophies[1] as HTMLElement;

      const chosenPlusBtn = chosenTrophyEl.querySelector('.m-trophy__action-btn--plus') as HTMLElement;
      const chosenMinusBtn = chosenTrophyEl.querySelector('.m-trophy__action-btn--minus') as HTMLElement;
      const otherPlusBtn = otherTrophyEl.querySelector('.m-trophy__action-btn--plus') as HTMLElement;
      const otherMinusBtn = otherTrophyEl.querySelector('.m-trophy__action-btn--minus') as HTMLElement;

      // When second figure has > 0 points, remove button is not displayed
      expect(otherTrophyEl.querySelector('.m-trophy__remove-btn')).toBeNull();

      // 1. Click + on other trophy: transfers 1 point from chosen figure to other figure
      otherPlusBtn.click();
      fixture.detectChanges();

      expect(progressStore.allocation(secondId)).toBe(2);
      expect(progressStore.allocation(firstId)).toBe(9);

      // 2. Click + on chosen figure: transfers point back from other figure
      chosenPlusBtn.click();
      fixture.detectChanges();

      expect(progressStore.allocation(secondId)).toBe(1);
      expect(progressStore.allocation(firstId)).toBe(10);

      // 3. Click - on chosen figure: reclaims point to unassigned credit bank
      chosenMinusBtn.click();
      fixture.detectChanges();

      expect(progressStore.allocation(firstId)).toBe(9);
      expect(progressStore.unassignedCredits()).toBe(1);

      // 4. Click - on other trophy until 0 points
      otherMinusBtn.click();
      fixture.detectChanges();
      expect(progressStore.allocation(secondId)).toBe(0);
      expect(progressStore.allocation(firstId)).toBe(10);

      // When figure hits 0 points, the - button disappears and the remove button appears!
      expect(otherTrophyEl.querySelector('.m-trophy__action-btn--minus')).toBeNull();
      expect(otherTrophyEl.querySelector('.m-trophy__action-btn--plus')).not.toBeNull();
      const removeBtn = otherTrophyEl.querySelector('.m-trophy__remove-btn') as HTMLElement;
      expect(removeBtn).not.toBeNull();

      // Clicking remove button removes the figure from the shelf section!
      removeBtn.click();
      fixture.detectChanges();

      expect(progressStore.progress().hiddenShelfIds).toContain(secondId);
      const updatedTrophies = fixture.nativeElement.querySelectorAll('papikapi-trophy');
      const figureIdsOnShelf = Array.from(updatedTrophies).map(
        (el) => (el as HTMLElement).querySelector('papikapi-figure-thumbnail')?.getAttribute('ng-reflect-figure-id') ?? ''
      );
      expect(figureIdsOnShelf).not.toContain(secondId);
    });
  });

  describe('Journey 4: Unassigned credits bar above the shelf', () => {
    it('renders a playful credit badge counter and small pips above the shelf', () => {
      const creditBar = fixture.nativeElement.querySelector('.papikapi-child__credit-bar');
      expect(creditBar).not.toBeNull();

      const badge = creditBar.querySelector('.papikapi-child__credit-badge');
      expect(badge).not.toBeNull();
      expect(badge.querySelector('.papikapi-child__credit-number').textContent.trim()).toBe('0');
    });

    it('displays unassigned credits and allows assigning credit to the chosen figure', () => {
      // Manually set unassigned points in progress store
      progressStore.setUnassignedCredit(3);
      fixture.detectChanges();

      expect(component['unassignedCredits']()).toBe(3);

      const creditBar = fixture.nativeElement.querySelector('.papikapi-child__credit-bar');
      const badge = creditBar.querySelector('.papikapi-child__credit-number');
      expect(badge.textContent.trim()).toBe('3');

      const pips = creditBar.querySelectorAll('.papikapi-child__credit-pip--filled');
      expect(pips.length).toBe(3);

      const chosenId = progressStore.progress().currentId;
      const initialPts = progressStore.allocation(chosenId);

      // Click credit bar to allocate credit to chosen figure
      (creditBar as HTMLElement).click();
      fixture.detectChanges();

      expect(progressStore.allocation(chosenId)).toBe(initialPts + 1);
      expect(component['unassignedCredits']()).toBe(2);
      expect(badge.textContent.trim()).toBe('2');
    });

    it('displays the consolidating graphical ring when sub-points are in progress', () => {
      // Sync 27 raw points = 2 consolidated points + 7 sub-points
      progressStore.syncTotalPoints(27);
      fixture.detectChanges();

      expect(component['consolidatingProgress']()).toBe(7);

      const creditBar = fixture.nativeElement.querySelector('.papikapi-child__credit-bar');
      const consolidatingPip = creditBar.querySelector('.papikapi-child__credit-pip--consolidating');
      expect(consolidatingPip).not.toBeNull();
      expect(consolidatingPip.querySelector('.papikapi-child__ring-fill')).not.toBeNull();
    });
  });

  describe('Journey 5: Retaining figure points across figure switching', () => {
    it('preserves each figure points when switching between figures on the shelf', () => {
      // Award 20 consolidated points (from 200 raw points)
      progressStore.syncTotalPoints(200);
      const secondId = component['shelves']()[0].trophies[1].figureId;
      const initialSecondPts = progressStore.allocation(secondId);
      const initialFirstPts = progressStore.allocation(DEFAULT_FIGURE_ID);

      // Allocate 5 points to secondId
      for (let i = 0; i < 5; i++) {
        progressStore.allocatePoint(secondId);
      }
      fixture.detectChanges();

      expect(progressStore.allocation(DEFAULT_FIGURE_ID)).toBe(initialFirstPts - 5);
      expect(progressStore.allocation(secondId)).toBe(initialSecondPts + 5);

      // Switch to second figure
      const trophies = fixture.nativeElement.querySelectorAll('papikapi-trophy');
      const secondTrophy = trophies[1] as HTMLElement;
      ((secondTrophy.querySelector('.m-trophy__figure') ?? secondTrophy) as HTMLElement).click();
      fixture.detectChanges();

      expect(progressStore.progress().currentId).toBe(secondId);
      expect(progressStore.allocation(secondId)).toBe(initialSecondPts + 5);
      expect(progressStore.allocation(DEFAULT_FIGURE_ID)).toBe(initialFirstPts - 5);

      // Switch back to first figure (stable position at index 0)
      const updatedTrophies = fixture.nativeElement.querySelectorAll('papikapi-trophy');
      const firstTrophyOnShelf = updatedTrophies[0] as HTMLElement;
      ((firstTrophyOnShelf.querySelector('.m-trophy__figure') ?? firstTrophyOnShelf) as HTMLElement).click();
      fixture.detectChanges();

      expect(progressStore.progress().currentId).toBe(DEFAULT_FIGURE_ID);
      expect(progressStore.allocation(DEFAULT_FIGURE_ID)).toBe(initialFirstPts - 5);
      expect(progressStore.allocation(secondId)).toBe(initialSecondPts + 5);
    });
  });

  describe('Journey 6: Active figure completion progress pips (papikapi-progress-pips)', () => {
    it('binds progress pips to the completion percentage of the active figure (0 to 10 scale)', () => {
      const pipsEl = fixture.nativeElement.querySelector('papikapi-progress-pips');
      expect(pipsEl).not.toBeNull();
      expect(component.figurePipsTotal()).toBe(10);

      // Default figure has 10 points allocated -> figurePipsFilled > 0
      expect(component.figurePipsFilled()).toBeGreaterThan(0);
      const activeFolds = pipsEl.querySelectorAll('.m-progress-pips__pip--filled');
      expect(activeFolds.length).toBe(component.figurePipsFilled());

      // Switch to a fresh figure with 0 points allocated
      component['onFigureChosen']('plane');
      fixture.detectChanges();

      expect(component['currentModelId']()).toBe('plane');
      expect(progressStore.allocation('plane')).toBe(0);
      expect(component.figurePipsFilled()).toBe(0);

      const emptyFolds = pipsEl.querySelectorAll('.m-progress-pips__pip--filled');
      expect(emptyFolds.length).toBe(0);

      // Allocate points to the active figure -> progress pips increase!
      component['onAllocatePoint']('plane');
      fixture.detectChanges();

      expect(progressStore.allocation('plane')).toBe(1);
      expect(component.figurePipsFilled()).toBeGreaterThan(0);

      const updatedFolds = pipsEl.querySelectorAll('.m-progress-pips__pip--filled');
      expect(updatedFolds.length).toBe(component.figurePipsFilled());

      // When figure is completed (or mounted), pips reach 100% (10 pips) and + button disappears
      progressStore.select(DEFAULT_FIGURE_ID, { keepMounted: false });
      progressStore.mountCurrent(200);
      progressStore.select(DEFAULT_FIGURE_ID, { keepMounted: true });
      fixture.detectChanges();

      expect(component.figurePipsFilled()).toBe(10);
      const fullFolds = pipsEl.querySelectorAll('.m-progress-pips__pip--filled');
      expect(fullFolds.length).toBe(10);

      const trophies = fixture.nativeElement.querySelectorAll('papikapi-trophy');
      const mountedTrophy = trophies[0] as HTMLElement;
      expect(mountedTrophy.querySelector('.m-trophy--mounted')).not.toBeNull();
      // On complete / mounted figures, all action buttons disappear
      expect(mountedTrophy.querySelector('.m-trophy__action-btn--plus')).toBeNull();
      expect(mountedTrophy.querySelector('.m-trophy__action-btn--minus')).toBeNull();
    });
  });

  describe('Journey 7: Window developer bridge (window.papikapi)', () => {
    it('exposes addPoints, removePoints, allocatePoint, reclaimPoint and removeFigure without error', () => {
      const bridge = (window as unknown as { papikapi: Record<string, unknown> }).papikapi;
      expect(bridge).toBeDefined();
      expect(typeof bridge['addPoints']).toBe('function');
      expect(typeof bridge['removePoints']).toBe('function');
      expect(typeof bridge['allocatePoint']).toBe('function');
      expect(typeof bridge['reclaimPoint']).toBe('function');
      expect(typeof bridge['removeFigure']).toBe('function');

      const curId = component['currentModelId']();
      const initialPts = progressStore.allocation(curId);

      // removePoints() removes 1 point from active figure
      (bridge['removePoints'] as (amount?: number) => void)();
      fixture.detectChanges();
      expect(progressStore.allocation(curId)).toBe(initialPts - 1);

      // addPoints() adds 1 point back
      (bridge['addPoints'] as (amount?: number) => void)();
      fixture.detectChanges();
      expect(progressStore.allocation(curId)).toBe(initialPts);

      // addPoints(5) adds 5 points directly to the active figure
      (bridge['addPoints'] as (amount?: number) => void)(5);
      fixture.detectChanges();
      expect(progressStore.allocation(curId)).toBe(initialPts + 5);

      // removePoints(5) removes 5 points directly from the active figure
      (bridge['removePoints'] as (amount?: number) => void)(5);
      fixture.detectChanges();
      expect(progressStore.allocation(curId)).toBe(initialPts);

      // removeFigure removes unchosen figure from shelf
      (bridge['removeFigure'] as (id: string) => void)('bear');
      fixture.detectChanges();
      expect(progressStore.progress().hiddenShelfIds).toContain('bear');
    });
  });
});
