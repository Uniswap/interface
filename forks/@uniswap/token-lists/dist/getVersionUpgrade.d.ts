/**
 * Enum describing types of version differences
 */
import { Version } from './types';
export declare enum VersionUpgrade {
    NONE = 0,
    PATCH = 1,
    MINOR = 2,
    MAJOR = 3
}
/**
 * Return the upgrade type from the base version to the update version.
 * Note that downgrades and equivalent versions are both treated as `NONE`.
 * @param base base list
 * @param update update to the list
 */
export declare function getVersionUpgrade(base: Version, update: Version): VersionUpgrade;
