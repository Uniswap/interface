import { getMaybeHexOrRGBColor } from 'ui/src/components/buttons/Button/utils/getMaybeHexOrRGBColor'

describe('getMaybeHexOrRGBColor', () => {
  it('should return the same hex color if valid', () => {
    const validHexColors = ['#FFFFFF', '#FFF', '#FFFFFF']
    for (const color of validHexColors) {
      const result = getMaybeHexOrRGBColor(color)

      expect(result).toBe(color)
    }
  })

  it('should return the same RGB color if valid', () => {
    const validRgbColors = ['rgb(255, 255, 255)', 'rgba(255, 255, 255, 1)']
    for (const color of validRgbColors) {
      const result = getMaybeHexOrRGBColor(color)

      expect(result).toBe(color)
    }
  })

  it('should return undefined for an invalid color', () => {
    const result = getMaybeHexOrRGBColor('invalid-color')

    expect(result).toBeUndefined()
  })

  it('should return undefined for an empty string', () => {
    const result = getMaybeHexOrRGBColor('')

    expect(result).toBeUndefined()
  })
})
