import { opacifyRaw } from 'ui/src/theme'

describe(opacifyRaw, () => {
  it.each`
    amount   | hexColor     | expected
    ${10}    | ${'#aaaaaa'} | ${'#aaaaaa1a'}
    ${0}     | ${'#ffffff'} | ${'#ffffff00'}
    ${100}   | ${'#000000'} | ${'#000000ff'}
    ${50}    | ${'#123456'} | ${'#12345680'}
    ${25}    | ${'#abcdef'} | ${'#abcdef40'}
    ${75}    | ${'#fedcba'} | ${'#fedcbabf'}
    ${0}     | ${'#333333'} | ${'#33333300'}
    ${100}   | ${'#888888'} | ${'#888888ff'}
    ${22.22} | ${'#888888'} | ${'#88888839'}
  `('(amount=$amount, hexColor=$hexColor) should be expected=$expected', async ({ amount, hexColor, expected }) => {
    expect(opacifyRaw(amount, hexColor).toLowerCase()).toEqual(expected.toLowerCase())
  })

  it.each`
    amount       | hexColor     | expectedError
    ${110}       | ${'#aaaaaa'} | ${'opacify: provided amount should be between 0 and 100'}
    ${-10}       | ${'#123456'} | ${'opacify: provided amount should be between 0 and 100'}
    ${50}        | ${'123456'}  | ${null}
    ${undefined} | ${'123456'}  | ${null}
    ${50}        | ${undefined} | ${"Cannot read properties of undefined (reading 'startsWith')"}
    ${50}        | ${'#12'}     | ${'opacify: provided color #12 was not in hexadecimal format (e.g. #000000)'}
    ${50}        | ${'#gggggg'} | ${'opacify: provided color #gggggg contains invalid characters, should be a valid hex (e.g. #000000)'}
  `('should throw an error when (amount=$amount, hexColor=$hexColor)', async ({ amount, hexColor, expectedError }) => {
    if (expectedError) {
      expect(() => opacifyRaw(amount, hexColor)).toThrow(expectedError)
    } else {
      expect(opacifyRaw(amount, hexColor)).toEqual(hexColor)
    }
  })
})
