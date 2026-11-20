export const DEPRECATED_LINT_EXECUTOR = '@nx/eslint:lint';

export const LINT_TARGET_FIXTURES = {
  inferredProject: {
    name: 'papikapi',
    sourceRoot: 'apps/papikapi/src',
    targets: {
      build: { executor: '@angular/build:application' },
      test: { executor: '@angular/build:unit-test' },
    },
  },
  legacyLintProject: {
    name: 'papikapi',
    sourceRoot: 'apps/papikapi/src',
    targets: {
      build: { executor: '@angular/build:application' },
      lint: { executor: '@nx/eslint:lint' },
      test: { executor: '@angular/build:unit-test' },
    },
  },
  emptyLintOverrideProject: {
    name: 'papikapi',
    sourceRoot: 'apps/papikapi/src',
    targets: {
      build: { executor: '@angular/build:application' },
      lint: {},
      test: { executor: '@angular/build:unit-test' },
    },
  },
  singleLegacyTargetProject: {
    name: 'papikapi',
    sourceRoot: 'apps/papikapi/src',
    targets: {
      lint: { executor: '@nx/eslint:lint' },
    },
  },
  manyTargetsWithHiddenLegacyExecutor: {
    name: 'papikapi',
    sourceRoot: 'apps/papikapi/src',
    targets: {
      build: { executor: '@angular/build:application' },
      serve: { executor: '@angular/build:dev-server' },
      test: { executor: '@angular/build:unit-test' },
      'lint-ci': { executor: '@nx/eslint:lint' },
    },
  },
  emptyTargetsProject: {
    name: 'papikapi',
    sourceRoot: 'apps/papikapi/src',
    targets: {},
  },
  singleTargetProject: {
    name: 'papikapi',
    sourceRoot: 'apps/papikapi/src',
    targets: {
      build: { executor: '@angular/build:application' },
    },
  },
  malformedConfig: 'invalid-project-config',
} as const;
