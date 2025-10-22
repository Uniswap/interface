import { opacifyRaw } from 'ui/src/theme'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Import the mocked logger to make assertions
import { logger } from 'utilities/src/logger/logger'

describe(opacifyRaw, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each`
    amount       | color                   | expected
    ${1}         | ${'#ffffff'}            | ${'#ffffff03'}
    ${10}        | ${'#aaaaaa'}            | ${'#aaaaaa1a'}
    ${100}       | ${'#000000'}            | ${'#000000ff'}
    ${50}        | ${'#123456'}            | ${'#12345680'}
    ${25}        | ${'#abcdef'}            | ${'#abcdef40'}
    ${75}        | ${'#fedcba'}            | ${'#fedcbabf'}
    ${0}         | ${'#333333'}            | ${'#33333300'}
    ${100}       | ${'#888888'}            | ${'#888888ff'}
    ${22.22}     | ${'#888888'}            | ${'#88888839'}
    ${22.22}     | ${'#8888'}              | ${'#88888839'}
    ${33.111111} | ${'rgb(255, 255, 255)'} | ${'rgba(255, 255, 255, 0.33)'}
    ${0.01}      | ${'rgb(255, 255, 255)'} | ${'rgba(255, 255, 255, 0.00)'}
  `('(amount=$amount, color=$color) should be expected=$expected', async ({ amount, color, expected }) => {
    expect(opacifyRaw(amount, color).toLowerCase()).toEqual(expected.toLowerCase())
  })

  it.each`
    amount       | color                         | expectedError
    ${110}       | ${'#aaaaaa'}                  | ${'Error: provided opacity 110 should be between 0 and 100'}
    ${110.99}    | ${'#aaaaaa'}                  | ${'Error: provided opacity 110.99 should be between 0 and 100'}
    ${-10}       | ${'#123456'}                  | ${'Error: provided opacity -10 should be between 0 and 100'}
    ${-10.11}    | ${'#123456'}                  | ${'Error: provided opacity -10.11 should be between 0 and 100'}
    ${undefined} | ${'123456'}                   | ${'Error: provided color 123456 is neither a hex nor an rgb color'}
    ${50}        | ${undefined}                  | ${"TypeError: Cannot read properties of undefined (reading 'startsWith')"}
    ${50}        | ${'123456'}                   | ${'Error: provided color 123456 is neither a hex nor an rgb color'}
    ${50}        | ${'#12'}                      | ${'Error: provided color #12 was not in hexadecimal format (e.g. #000000)'}
    ${50}        | ${'#gggggg'}                  | ${'Error: provided color #gggggg contains invalid characters, should be a valid hex (e.g. #000000)'}
    ${50}        | ${'rgb(1,1,'}                 | ${'Error: provided color rgb(1,1, is invalid rgb format'}
    ${50}        | ${'rgb(1,1)'}                 | ${'Error: provided color rgb(1,1) does not have enough components'}
    ${50}        | ${'rgbv(1,1,1,1)'}            | ${'Error: provided color rgbv(1,1,1,1) is neither a hex nor an rgb color'}
    ${100}       | ${'rgba(255, 255, 255, 0.5)'} | ${'Error: provided color rgba(255, 255, 255, 0.5) is neither a hex nor an rgb color'}
    ${30}        | ${'rgba(255, 255, 255, 0.5)'} | ${'Error: provided color rgba(255, 255, 255, 0.5) is neither a hex nor an rgb color'}
    ${33.111111} | ${'rgba(255, 255, 255, 0.5)'} | ${'Error: provided color rgba(255, 255, 255, 0.5) is neither a hex nor an rgb color'}
  `('should throw an error when (amount=$amount, color=$color)', async ({ amount, color, expectedError }) => {
    opacifyRaw(amount, color)
    expect(logger.warn).toHaveBeenCalledWith(
      'color/utils',
      'opacifyRaw',
      `Error opacifying color ${color} with opacity ${amount}: ${expectedError}`,
    )
  })
})
