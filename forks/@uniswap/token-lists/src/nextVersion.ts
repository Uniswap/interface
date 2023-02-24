import { VersionUpgrade } from './getVersionUpgrade';
import { Version } from './types';

/**
 * Returns the next version of the list given a base version and the upgrade type
 * @param base current version
 * @param bump the upgrade type
 */
export function nextVersion(base: Version, bump: VersionUpgrade): Version {
  switch (bump) {
    case VersionUpgrade.NONE:
      return base;

    case VersionUpgrade.MAJOR:
      return { major: base.major + 1, minor: 0, patch: 0 };

    case VersionUpgrade.MINOR:
      return {
        major: base.major,
        minor: base.minor + 1,
        patch: 0,
      };

    case VersionUpgrade.PATCH:
      return {
        major: base.major,
        minor: base.minor,
        patch: base.patch + 1,
      };
  }
}
