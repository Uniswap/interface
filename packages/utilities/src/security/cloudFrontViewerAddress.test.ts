import { stripCloudFrontViewerPort } from 'utilities/src/security/cloudFrontViewerAddress'

describe('stripCloudFrontViewerPort', () => {
  it.each([
    ['IPv4 with port', '198.51.100.10:46532', '198.51.100.10'],
    ['IPv6 with port', '2001:db8::1:46532', '2001:db8::1'],
    ['IPv6 loopback with port', '::1:443', '::1'],
    ['IPv4 without port', '198.51.100.10', '198.51.100.10'],
    ['empty value', '', ''],
  ])('%s', (_label, viewerAddress, expected) => {
    expect(stripCloudFrontViewerPort(viewerAddress)).toBe(expected)
  })
})
