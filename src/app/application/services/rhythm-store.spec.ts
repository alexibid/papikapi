import { TestBed } from '@angular/core/testing';
import { DEFAULT_RHYTHM } from '@domain/models/rhythm';
import { RhythmStore } from './rhythm-store';

describe('RhythmStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('starts from the default rhythm', () => {
    expect(TestBed.inject(RhythmStore).rhythm()).toEqual(DEFAULT_RHYTHM);
  });

  it('keeps the chosen speed across a reload', () => {
    TestBed.inject(RhythmStore).setSpeed(2.5);
    TestBed.resetTestingModule();

    expect(TestBed.inject(RhythmStore).rhythm().speed).toBe(2.5);
  });

  it('ignores a corrupted stored value', () => {
    localStorage.setItem('papikapi.rhythm', '{"speed":"fast"}');

    expect(TestBed.inject(RhythmStore).rhythm()).toEqual(DEFAULT_RHYTHM);
  });
});
