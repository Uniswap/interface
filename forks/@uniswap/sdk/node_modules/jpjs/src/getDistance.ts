import { Geo } from './types';
import { toRadian } from './toRadian';

/**
 * Calculate the distance between two geo points.
 * return is distance in kilometers.
 *
 * @param {Geo} start - Starting point
 * @param {Geo} end - Ending point
 * @param {number} decimals - Number of decimals to return
 * @returns {string}
 */
export function getDistance(
  start: Geo,
  end: Geo,
  decimals: number = 2
): string {
  const R = 6371; // km
  const dLat = toRadian(end.lat - start.lat);
  const dLon = toRadian(end.lng - start.lng);
  const lat1 = toRadian(start.lat);
  const lat2 = toRadian(end.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d.toFixed(decimals);
}
