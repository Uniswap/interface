import { hexToRGB, hexToRGBString } from 'utilities/src/theme/colors'

describe('hexToRGB', () => {
  it('converts hex to rgb', () => {
    expect(hexToRGB('#000000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToRGB('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRGB('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
    expect(hexToRGB('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
    expect(hexToRGB('#0000ff')).toEqual({ r: 0, g: 0, b: 255 })
  })
})

describe('hexToRGBString', () => {
  it('converts hex to rgb string', () => {
    expect(hexToRGBString('#000000')).toEqual('rgb(0, 0, 0)')
    expect(hexToRGBString('#ffffff')).toEqual('rgb(255, 255, 255)')
    expect(hexToRGBString('#ff0000')).toEqual('rgb(255, 0, 0)')
    expect(hexToRGBString('#00ff00')).toEqual('rgb(0, 255, 0)')
    expect(hexToRGBString('#0000ff')).toEqual('rgb(0, 0, 255)')
  })
})
