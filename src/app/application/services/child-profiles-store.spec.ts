import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CHILD_ID, DEFAULT_CHILD_PROFILE } from '@application/config/child';
import { ChildProfileDraft } from '@domain/models/child-profile';
import {
  ACTIVE_CHILD_KEY,
  CHILD_PROFILES_KEY,
  ChildProfilesStore,
  UnknownChildError,
} from './child-profiles-store';

const MARIA: ChildProfileDraft = {
  name: 'Maria',
  avatarBustUrl: 'assets/avatars/maria.png',
  paperColor: '#7FB3D5',
  group: 'Sala dos Coelhos',
  birthDate: '2021-03-14',
};

const TOMAS: ChildProfileDraft = {
  name: 'Tomás',
  avatarBustUrl: 'assets/avatars/tomas.png',
  paperColor: '#F1948A',
};

function reloadStore(): ChildProfilesStore {
  TestBed.resetTestingModule();
  return TestBed.inject(ChildProfilesStore);
}

describe('ChildProfilesStore', () => {
  let store: ChildProfilesStore;

  beforeEach(() => {
    localStorage.clear();
    store = reloadStore();
  });

  describe('initial state', () => {
    it('starts with the default child only', () => {
      expect(store.profiles()).toEqual([DEFAULT_CHILD_PROFILE]);
    });

    it('selects the default child', () => {
      expect(store.activeChildId()).toBe(DEFAULT_CHILD_ID);
      expect(store.activeChild()).toEqual(DEFAULT_CHILD_PROFILE);
    });
  });

  describe('registerChild', () => {
    it('adds a profile with a generated id', () => {
      const maria = store.registerChild(MARIA);

      expect(maria).toEqual({ ...MARIA, id: maria.id });
      expect(maria.id).not.toBe(DEFAULT_CHILD_ID);
      expect(store.profiles()).toEqual([DEFAULT_CHILD_PROFILE, maria]);
    });

    it('gives every child a distinct id', () => {
      const maria = store.registerChild(MARIA);
      const tomas = store.registerChild(TOMAS);

      expect(maria.id).not.toBe(tomas.id);
    });

    it('keeps the active child unchanged', () => {
      store.registerChild(MARIA);

      expect(store.activeChildId()).toBe(DEFAULT_CHILD_ID);
    });
  });

  describe('selectChild', () => {
    it('switches the active child', () => {
      const maria = store.registerChild(MARIA);

      store.selectChild(maria.id);

      expect(store.activeChildId()).toBe(maria.id);
      expect(store.activeChild()).toEqual(maria);
    });

    it('switches back to the default child', () => {
      store.selectChild(store.registerChild(MARIA).id);

      store.selectChild(DEFAULT_CHILD_ID);

      expect(store.activeChild()).toEqual(DEFAULT_CHILD_PROFILE);
    });

    it('rejects an unknown child', () => {
      expect(() => store.selectChild('ghost')).toThrow(UnknownChildError);
      expect(store.activeChildId()).toBe(DEFAULT_CHILD_ID);
    });
  });

  describe('updateChild', () => {
    it('merges the changes into the profile', () => {
      const maria = store.registerChild(MARIA);

      store.updateChild(maria.id, { name: 'Maria João', group: 'Sala das Raposas' });

      expect(store.profiles()[1]).toEqual({ ...maria, name: 'Maria João', group: 'Sala das Raposas' });
    });

    it('refreshes the active child', () => {
      const maria = store.registerChild(MARIA);
      store.selectChild(maria.id);

      store.updateChild(maria.id, { paperColor: '#82E0AA' });

      expect(store.activeChild().paperColor).toBe('#82E0AA');
    });

    it('updates the default child', () => {
      store.updateChild(DEFAULT_CHILD_ID, { name: 'Leonor' });

      expect(store.activeChild()).toEqual({ ...DEFAULT_CHILD_PROFILE, name: 'Leonor' });
    });

    it('leaves the other profiles untouched', () => {
      const maria = store.registerChild(MARIA);
      const tomas = store.registerChild(TOMAS);

      store.updateChild(maria.id, { name: 'Mia' });

      expect(store.profiles()[2]).toEqual(tomas);
    });

    it('rejects an unknown child', () => {
      expect(() => store.updateChild('ghost', { name: 'Ninguém' })).toThrow(UnknownChildError);
    });
  });

  describe('persistence', () => {
    it('keeps registered children across a reload', () => {
      const maria = store.registerChild(MARIA);

      expect(reloadStore().profiles()).toEqual([DEFAULT_CHILD_PROFILE, maria]);
    });

    it('keeps the active child across a reload', () => {
      const maria = store.registerChild(MARIA);
      store.selectChild(maria.id);

      expect(reloadStore().activeChild()).toEqual(maria);
    });

    it('keeps profile changes across a reload', () => {
      const maria = store.registerChild(MARIA);
      store.updateChild(maria.id, { name: 'Mia' });

      expect(reloadStore().profiles()[1].name).toBe('Mia');
    });

    it('restores the default child when storage lacks it', () => {
      const stored = [{ ...TOMAS, id: 'tomas' }];
      localStorage.setItem(CHILD_PROFILES_KEY, JSON.stringify(stored));

      expect(reloadStore().profiles()).toEqual([DEFAULT_CHILD_PROFILE, ...stored]);
    });

    it('falls back to the default child when the stored active id is unknown', () => {
      localStorage.setItem(ACTIVE_CHILD_KEY, 'ghost');

      expect(reloadStore().activeChildId()).toBe(DEFAULT_CHILD_ID);
    });

    it('ignores corrupted stored profiles', () => {
      localStorage.setItem(CHILD_PROFILES_KEY, '{not json');

      expect(reloadStore().profiles()).toEqual([DEFAULT_CHILD_PROFILE]);
    });

    it('drops stored entries that are not profiles', () => {
      const valid = { ...TOMAS, id: 'tomas' };
      localStorage.setItem(CHILD_PROFILES_KEY, JSON.stringify([valid, { id: 3 }, 'maria', null]));

      expect(reloadStore().profiles()).toEqual([DEFAULT_CHILD_PROFILE, valid]);
    });
  });
});
