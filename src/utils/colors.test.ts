import { opacify } from 'src/utils/colors'

it('returns an hex color with opacity', () => {
  expect(opacify(10, '#000000')).toEqual('#00000010')
})

it('throws when color is not valid', () => {
  expect(() => opacify(10, '#000')).toThrow()
  expect(() => opacify(10, '000000')).toThrow()
  expect(() => opacify(10, '#00000000')).toThrow()
})

it('throws when amount is not valid', () => {
  expect(() => opacify(-1, '#000000')).toThrow()
  expect(() => opacify(120, '#000000')).toThrow()
})
