import { getValidAddress } from './addresses'

const noChecksum = false
const noLog = false

it('returns lower case address for valid address', () => {
  const validAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'

  expect(getValidAddress(validAddress)).toBe(validAddress.toLowerCase())
})

it('returns null for address with wrong length', () => {
  const invalidLenAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8'

  expect(getValidAddress(invalidLenAddress, noChecksum, noLog)).toBe(null)
})

it('returns null for address with bad prefix (not 0x)', () => {
  const invalidPrefixAddress = '1x71C7656EC7ab88b098defB751B7401B5f6d8976F'

  expect(getValidAddress(invalidPrefixAddress, noChecksum, noLog)).toBe(null)
})

it('returns null if null address', () => {
  const nullAddress = null

  expect(getValidAddress(nullAddress)).toBe(null)
})

it('returns true if the address can be checksummed', () => {
  const validAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'

  expect(getValidAddress(validAddress, true)).toBe(validAddress)
})

it('returns null if the address cannot be checksummed', () => {
  const invalidAddress = '71C6EC7ab88b098defB751B7401B5f6d8976F'

  expect(getValidAddress(invalidAddress, true, noLog)).toBe(null)
})

it('returns null if the address is null', () => {
  const nullAddress = null

  expect(getValidAddress(nullAddress, true)).toBe(null)
})
