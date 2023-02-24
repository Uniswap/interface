import { Version } from './types';

/**
 * Comparator function that allows sorting version from lowest to highest
 * @param versionA version A to compare
 * @param versionB version B to compare
 * @returns -1 if versionA comes before versionB, 0 if versionA is equal to version B, and 1 if version A comes after version B
 */
export function versionComparator(
  versionA: Version,
  versionB: Version
): -1 | 0 | 1 {
  if (versionA.major < versionB.major) {
    return -1;
  } else if (versionA.major > versionB.major) {
    return 1;
  } else if (versionA.minor < versionB.minor) {
    return -1;
  } else if (versionA.minor > versionB.minor) {
    return 1;
  } else if (versionA.patch < versionB.patch) {
    return -1;
  } else if (versionA.patch > versionB.patch) {
    return 1;
  } else {
    return 0;
  }
}
