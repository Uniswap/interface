/**
 * Map of Google Maps zoom level to meters
 */
const MapGoogleMapsZoomToMeters = {
  '20': 1128.49722,
  '19': 2256.99444,
  '18': 4513.98888,
  '17': 9027.977761,
  '16': 18055.95552,
  '15': 36111.91104,
  '14': 72223.82209,
  '13': 144447.6442,
  '12': 288895.2884,
  '11': 577790.5767,
  '10': 1155581.153,
  '9': 2311162.307,
  '8': 4622324.614,
  '7': 9244649.227,
  '6': 18489298.45,
  '5': 36978596.91,
  '4': 73957193.82,
  '3': 147914387.6,
  '2': 295828775.3,
  '1': 591657550.5,
};
/**
 * Convert Google Maps Zoom level to meters
 */
export function googleMapsZoomToMeters(
  zoom: Extract<keyof typeof MapGoogleMapsZoomToMeters, string>
) {
  return MapGoogleMapsZoomToMeters[zoom];
}
