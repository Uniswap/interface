import React from 'react'
import { render } from 'src/test/test-utils'
import { deriveUniconAttributeIndices, isEthAddress, Unicon, UniconAttributes } from 'ui/src'

it('renders a Unicon', () => {
  const tree = render(
    <Unicon address="0x11E4857Bb9993a50c685A79AFad4E6F65D518DDa" size={36} />
  ).toJSON()
  expect(tree).toMatchSnapshot()
})

it('fails to render a Unicon if given an invalid eth address', () => {
  const tree = render(<Unicon address="mymoneydontjigglejiggle" size={36} />)
  expect(tree).toMatchSnapshot()
})

it('identifies valid and invalid eth addresses', () => {
  const normal = '0x0c7213bac2B9e7b99ABa344243C9de84227911Be'
  const no0X = '0c7213bac2B9e7b99ABa344243C9de84227911Be'
  const tooShort = '0x0c713bac2B9e7b99ABa344243C9de84227911Be'
  const tooLong = '0x0c7213bac2B9e7b99ABa344243C9de84227911Beaaa'
  const definitelyAnAddress = 'mymoneydontjigglejiggle'

  expect(isEthAddress(normal)).toBe(true)
  expect(isEthAddress(no0X)).toBe(false)
  expect(isEthAddress(tooShort)).toBe(false)
  expect(isEthAddress(tooLong)).toBe(false)
  expect(isEthAddress(definitelyAnAddress)).toBe(false)
})

it('derives attribute indices from eth addresses', () => {
  const specialAddress = '0x01010101c2B9e7b99ABa344243C9de84227911Be'
  const derivedIndices = deriveUniconAttributeIndices(specialAddress)
  expect(derivedIndices).toEqual({
    [UniconAttributes.GradientStart]: 1,
    [UniconAttributes.GradientEnd]: 1,
    [UniconAttributes.Container]: 1,
    [UniconAttributes.Shape]: 1,
  })
})
