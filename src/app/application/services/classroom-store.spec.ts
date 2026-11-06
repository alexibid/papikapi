import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { figureProgressKey } from '@application/state/points.state';
import { ChildProfile } from '@domain/models/child-profile';
import { ChildPointsStore } from './child-points-store';
import { ChildProfilesStore } from './child-profiles-store';
import { ChildrenStore } from './classroom-store';

const CHILDREN: readonly ChildProfile[] = [
  { id: 'ines', name: 'Inês', avatarBustUrl: '', paperColor: '#F8E4D6' },
  { id: 'tomas', name: 'Tomás', avatarBustUrl: '', paperColor: '#D6F0E0' },
  { id: 'leonor', name: 'Leonor', avatarBustUrl: '', paperColor: '#DBEAFE' },
];

describe('ChildrenStore', () => {
  const selectChild = vi.fn();
  let store: ChildrenStore;

  beforeEach(() => {
    localStorage.clear();
    selectChild.mockReset();
    localStorage.setItem(
      figureProgressKey('tomas'),
      JSON.stringify({ currentId: 'dino', mountedIds: [], baselinePoints: 17, seenPieces: 0 })
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ChildPointsStore, useValue: { rawPoints: signal(42) } },
        {
          provide: ChildProfilesStore,
          useValue: { profiles: signal(CHILDREN), activeChildId: signal('ines'), selectChild },
        },
      ],
    });
    store = TestBed.inject(ChildrenStore);
  });

  it('should expose the child profiles and the active child', () => {
    expect(store.children()).toEqual(CHILDREN);
    expect(store.activeChildId()).toBe('ines');
  });

  it('should delegate the selection to the child profiles store', () => {
    store.selectChild('leonor');

    expect(selectChild).toHaveBeenCalledWith('leonor');
  });

  it('should read the active child points from the live points store', () => {
    expect(store.pointsOf('ines')).toBe(42);
  });

  it('should read another child points from that child saved progress', () => {
    expect(store.pointsOf('tomas')).toBe(17);
  });

  it('should report zero points for a child with no saved progress', () => {
    expect(store.pointsOf('leonor')).toBe(0);
  });
});
