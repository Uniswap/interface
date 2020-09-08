import { Geo } from './types';

/**
 * Generate a link for Google Maps from a lat and long
 * @param {Geo} geo longitude and latitude
 *
 * @returns {string}
 */
export function makeGoogleMapsLink({ lng, lat }: Geo): string {
  if (
    typeof window !== 'undefined' &&
    (window.navigator.platform.indexOf('iPhone') !== -1 ||
      window.navigator.platform.indexOf('iPod') !== -1 ||
      window.navigator.platform.indexOf('iPad') !== -1)
  ) {
    return `maps://maps.google.com/maps?daddr=${lat},${lng}&amp;ll=")`;
  } else {
    return `https://maps.google.com/maps?daddr=${lat},${lng}&amp;ll="`;
  }
}
