import isDataUri from 'utils/isDataUri'

describe('isDataUri', () => {
  it('Valid Base64 Encoded PNG Image', () => {
    const validBase64EncodedPNGImage =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
    expect(isDataUri(validBase64EncodedPNGImage)).toBe(true)
  })

  it('Valid Base64 Encoded JPEG Image', () => {
    const validBase64EncodedJPEGImage =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/4QBGRXhpZgAATU0AKgAAAAgABAE7AAIAAAAUAAAISodpAAQAAAABAAAISAAAAAD/4QMtaHR0cDovL3d3dy5hZG9iZS5jb20v...'
    expect(isDataUri(validBase64EncodedJPEGImage)).toBe(true)
  })

  it('Valid Data URI with Parameters', () => {
    const validDataURIWithParameters = "data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg'></svg>"
    expect(isDataUri(validDataURIWithParameters)).toBe(true)
  })

  it('Valid Data URI for GIF Image', () => {
    const validDataURIForGIFImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    expect(isDataUri(validDataURIForGIFImage)).toBe(true)
  })

  it('empty string', () => {
    expect(isDataUri('')).toBe(false)
  })

  it('Missing Data Scheme', () => {
    const missingDataScheme =
      'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
    expect(isDataUri(missingDataScheme)).toBe(false)
  })

  it('Invalid MIME Type', () => {
    const invalidMimeType = 'data:application/pdf;base64,JVBERi0xLjQKJaqrrK0KN...'
    expect(isDataUri(invalidMimeType)).toBe(false)
  })

  it('Missing Comma Between Header and Data', () => {
    const missingCommaBetweenHeaderAndData =
      'data:image/png;base64iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
    expect(isDataUri(missingCommaBetweenHeaderAndData)).toBe(false)
  })
})
