import projectJson from '../project.json';
import { DEPRECATED_LINT_EXECUTOR, LINT_TARGET_FIXTURES } from './lint-target.mock';

interface ProjectTargetConfig {
  readonly executor?: string;
}

interface ProjectConfig {
  readonly name: string;
  readonly sourceRoot: string;
  readonly targets: Readonly<Record<string, ProjectTargetConfig>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTargetConfig(value: unknown): value is ProjectTargetConfig {
  if (!isRecord(value)) {
    return false;
  }
  const executor = value['executor'];
  return executor === undefined || typeof executor === 'string';
}

function parseProjectConfig(raw: unknown): ProjectConfig {
  if (!isRecord(raw)) {
    throw new Error('Project configuration must be an object');
  }
  const name = raw['name'];
  const sourceRoot = raw['sourceRoot'];
  const rawTargets = raw['targets'];
  if (typeof name !== 'string' || typeof sourceRoot !== 'string' || !isRecord(rawTargets)) {
    throw new Error('Project configuration is missing required fields');
  }
  const targets: Record<string, ProjectTargetConfig> = {};
  for (const [key, value] of Object.entries(rawTargets)) {
    if (isTargetConfig(value)) {
      targets[key] = value;
    }
  }
  return { name, sourceRoot, targets };
}

function findDeprecatedLintTargets(config: ProjectConfig): string[] {
  return Object.entries(config.targets)
    .filter(([, target]) => target.executor === DEPRECATED_LINT_EXECUTOR)
    .map(([name]) => name);
}

function allowsInferredLintTarget(config: ProjectConfig): boolean {
  return (
    !Object.prototype.hasOwnProperty.call(config.targets, 'lint') &&
    findDeprecatedLintTargets(config).length === 0
  );
}

describe('papikapi lint target migration', () => {
  const papikapiProject: ProjectConfig = parseProjectConfig(projectJson);

  describe('no @nx/eslint:lint deprecation warning', () => {
    it('should not emit the @nx/eslint:lint deprecation warning when running lint on papikapi', () => {
      expect(findDeprecatedLintTargets(papikapiProject)).toEqual([]);
    });

    it('should detect the deprecated executor when a project defines @nx/eslint:lint', () => {
      const legacy = parseProjectConfig(LINT_TARGET_FIXTURES.legacyLintProject);

      expect(findDeprecatedLintTargets(legacy)).toEqual(['lint']);
    });

    it('should handle empty, single, and many targets when checking for deprecated executors', () => {
      const empty = parseProjectConfig(LINT_TARGET_FIXTURES.emptyTargetsProject);
      const single = parseProjectConfig(LINT_TARGET_FIXTURES.singleLegacyTargetProject);
      const many = parseProjectConfig(LINT_TARGET_FIXTURES.manyTargetsWithHiddenLegacyExecutor);

      expect(findDeprecatedLintTargets(empty)).toEqual([]);
      expect(findDeprecatedLintTargets(single)).toEqual(['lint']);
      expect(findDeprecatedLintTargets(many)).toEqual(['lint-ci']);
    });
  });

  describe('inferred lint target via @nx/eslint/plugin', () => {
    it('should keep the lint target available via @nx/eslint/plugin for papikapi with the same rules and behaviour', () => {
      expect(papikapiProject.name).toBe('papikapi');
      expect(papikapiProject.sourceRoot).toBe('apps/papikapi/src');
      expect(allowsInferredLintTarget(papikapiProject)).toBe(true);
      expect(papikapiProject.targets['build']?.executor).toBe('@angular/build:application');
      expect(papikapiProject.targets['test']?.executor).toBe('@angular/build:unit-test');
    });

    it('should reject inferred lint availability when a project defines a lint target override', () => {
      const legacy = parseProjectConfig(LINT_TARGET_FIXTURES.legacyLintProject);
      const emptyOverride = parseProjectConfig(LINT_TARGET_FIXTURES.emptyLintOverrideProject);

      expect(allowsInferredLintTarget(legacy)).toBe(false);
      expect(allowsInferredLintTarget(emptyOverride)).toBe(false);
    });

    it('should allow inferred lint for empty and single non-lint target configs and throw on malformed input', () => {
      const empty = parseProjectConfig(LINT_TARGET_FIXTURES.emptyTargetsProject);
      const single = parseProjectConfig(LINT_TARGET_FIXTURES.singleTargetProject);
      const inferred = parseProjectConfig(LINT_TARGET_FIXTURES.inferredProject);

      expect(allowsInferredLintTarget(empty)).toBe(true);
      expect(allowsInferredLintTarget(single)).toBe(true);
      expect(allowsInferredLintTarget(inferred)).toBe(true);
      expect(() => parseProjectConfig(LINT_TARGET_FIXTURES.malformedConfig)).toThrow();
    });
  });

  describe('removal of legacy @nx/eslint:lint executor from apps/papikapi/project.json', () => {
    it('should no longer define the redundant legacy @nx/eslint:lint executor in apps/papikapi/project.json', () => {
      expect(Object.prototype.hasOwnProperty.call(papikapiProject.targets, 'lint')).toBe(false);
      expect(papikapiProject.targets['lint']?.executor).not.toBe(DEPRECATED_LINT_EXECUTOR);
    });

    it('should report the legacy lint target when present in project configuration', () => {
      const legacy = parseProjectConfig(LINT_TARGET_FIXTURES.legacyLintProject);

      expect(Object.prototype.hasOwnProperty.call(legacy.targets, 'lint')).toBe(true);
      expect(legacy.targets['lint']?.executor).toBe(DEPRECATED_LINT_EXECUTOR);
    });

    it('should throw when parsing unexpected non-object project configuration', () => {
      expect(() => parseProjectConfig(null)).toThrow('Project configuration must be an object');
      expect(() => parseProjectConfig({})).toThrow(
        'Project configuration is missing required fields'
      );
    });
  });
});
