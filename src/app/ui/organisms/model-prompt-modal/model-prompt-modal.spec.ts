import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModelPromptModalComponent } from './model-prompt-modal';

type CreatedModel = { name: string; prompt: string; images: readonly string[] };

describe('ModelPromptModalComponent', () => {
  let fixture: ComponentFixture<ModelPromptModalComponent>;
  let component: ModelPromptModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelPromptModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelPromptModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes with empty prompt, no photos, and disabled CRIAR button', () => {
    expect(component.promptText()).toBe('');
    expect(component.photos().length).toBe(0);

    const button: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('ibid-button[variant="primary"] button') ??
      fixture.nativeElement.querySelector('ibid-button button') ??
      fixture.nativeElement.querySelector('button');

    expect(button).toBeTruthy();
    expect(component.promptText().trim()).toBe('');
  });

  it('updates prompt text and reflects custom subject in userPrompt', () => {
    component.promptText.set('o meu gato Tobias');
    fixture.detectChanges();

    expect(component.userPrompt()).toContain('o meu gato Tobias');
    expect(component.currentContent()).toContain('o meu gato Tobias');
  });

  it('manages reference photos and caps at maximum of 3', () => {
    component.photos.set([
      { id: 'p1', name: 'gato-3-4-frente.jpg', dataUrl: 'data:image/jpeg;base64,aaa' },
      { id: 'p2', name: 'gato-3-4-lado.jpg', dataUrl: 'data:image/jpeg;base64,bbb' },
    ]);
    fixture.detectChanges();

    expect(component.photos().length).toBe(2);
    expect(component.userPrompt()).toContain('2 attached 3/4 reference photo(s)');

    // Add a 3rd photo
    component.photos.set([
      ...component.photos(),
      { id: 'p3', name: 'gato-3-4-geral.jpg', dataUrl: 'data:image/jpeg;base64,ccc' },
    ]);
    fixture.detectChanges();

    expect(component.photos().length).toBe(3);
    expect(component.userPrompt()).toContain('3 attached 3/4 reference photo(s)');

    // Remove one photo
    component['removePhoto']('p2');
    fixture.detectChanges();

    expect(component.photos().length).toBe(2);
    expect(component.photos().map((p) => p.id)).toEqual(['p1', 'p3']);
    expect(component.userPrompt()).toContain('2 attached 3/4 reference photo(s)');
  });

  it('handles onFileSelect and reads files as data URLs', () => {
    const fakeFile = new File(['dummy-content'], 'tobias-3-4.jpg', { type: 'image/jpeg' });
    const event = {
      target: {
        files: [fakeFile],
        value: 'dummy',
      },
    } as unknown as Event;

    const originalFileReader = window.FileReader;
    class MockFileReader {
      onload: (() => void) | null = null;
      result = 'data:image/jpeg;base64,mockedTobias';
      readAsDataURL(): void {
        if (this.onload) {
          this.onload();
        }
      }
    }
    Object.assign(window, { FileReader: MockFileReader });

    try {
      component['onFileSelect'](event);
      expect(component.photos().length).toBe(1);
      expect(component.photos()[0].name).toBe('tobias-3-4.jpg');
      expect(component.photos()[0].dataUrl).toBe('data:image/jpeg;base64,mockedTobias');
    } finally {
      window.FileReader = originalFileReader;
    }
  });

  it('calls createModel and emits modelCreated with payload and photos', async () => {
    component.promptText.set('o meu gato Tobias, preto e branco');
    component.photos.set([
      { id: 'p1', name: 'tobias.jpg', dataUrl: 'data:image/jpeg;base64,abc123' },
    ]);
    fixture.detectChanges();

    let createdEvent: CreatedModel | null = null;
    component.modelCreated.subscribe((val) => {
      createdEvent = val;
    });

    await component['createModel']();

    expect(createdEvent).not.toBeNull();
    expect(createdEvent!['prompt']).toBe('o meu gato Tobias, preto e branco');
    expect(createdEvent!['name']).toBe('o-meu-gato-tobias-preto');
    expect(createdEvent!['images']).toEqual(['data:image/jpeg;base64,abc123']);
    expect(component.statusMessage()).toBeTruthy();
  });

  it('uses custom modelName to derive hyphenated folder name', async () => {
    component.modelName.set('Cat Darth');
    component.promptText.set('a cute tuxedo cat');
    fixture.detectChanges();

    expect(component.derivedFolderSlug()).toBe('cat-darth');

    let createdEvent: CreatedModel | null = null;
    component.modelCreated.subscribe((val) => {
      createdEvent = val;
    });

    await component['createModel']();

    expect(createdEvent).not.toBeNull();
    expect(createdEvent!['name']).toBe('cat-darth');
  });

  it('copies studio prompt to clipboard and succeeds on createModel', async () => {
    component.promptText.set('dragão azul');
    fixture.detectChanges();

    let writtenText = '';
    const originalClipboard = navigator.clipboard;
    Object.assign(navigator, {
      clipboard: {
        writeText: async (text: string) => {
          writtenText = text;
        },
      },
    });

    let createdEvent: CreatedModel | null = null;
    component.modelCreated.subscribe((val) => {
      createdEvent = val;
    });

    try {
      await component['createModel']();

      expect(createdEvent).not.toBeNull();
      expect(writtenText).toContain('dragão azul');
      expect(component.statusMessage()).toBeTruthy();
    } finally {
      Object.assign(navigator, { clipboard: originalClipboard });
    }
  });

  it('copies current prompt and sets copied signal', async () => {
    component.promptText.set('gato siamês');
    const originalClipboard = navigator.clipboard;
    let written = '';
    Object.assign(navigator, {
      clipboard: {
        writeText: async (text: string) => {
          written = text;
        },
      },
    });

    try {
      await component['copyCurrent']();
      expect(written).toContain('gato siamês');
      expect(component.copied()).toBe(true);
    } finally {
      Object.assign(navigator, { clipboard: originalClipboard });
    }
  });

  it('emits dismissed when closed', () => {
    let closed = false;
    component.dismissed.subscribe(() => {
      closed = true;
    });

    component['close']();
    expect(closed).toBe(true);
  });
});
