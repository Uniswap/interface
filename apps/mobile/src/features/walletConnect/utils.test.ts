import {
  getAccountAddressFromEIP155String,
  getChainIdFromEIP155String,
  getSupportedWalletConnectChains,
} from 'src/features/walletConnect/utils'
import { UniverseChainId } from 'uniswap/src/types/chains'

const EIP155_MAINNET = 'eip155:1'
const EIP155_POLYGON = 'eip155:137'
const EIP155_OPTIMISM = 'eip155:10'
const EIP155_LINEA_UNSUPPORTED = 'eip155:59144'

const TEST_ADDRESS = '0xdFb84E543C39ACa3c6a39ea4e3B6c40eE7d2EBdA'

describe(getAccountAddressFromEIP155String, () => {
  it('handles valid eip155 mainnet address', () => {
    expect(getAccountAddressFromEIP155String(`${EIP155_MAINNET}:${TEST_ADDRESS}`)).toBe(TEST_ADDRESS)
  })

  it('handles valid eip155 polygon address', () => {
    expect(getAccountAddressFromEIP155String(`${EIP155_POLYGON}:${TEST_ADDRESS}`)).toBe(TEST_ADDRESS)
  })

  it('handles invalid eip155 address', () => {
    expect(getAccountAddressFromEIP155String(TEST_ADDRESS)).toBeNull()
  })
})

describe(getSupportedWalletConnectChains, () => {
  it('handles list of valid chains', () => {
    expect(getSupportedWalletConnectChains([EIP155_MAINNET, EIP155_POLYGON, EIP155_OPTIMISM])).toEqual([
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
      UniverseChainId.Optimism,
    ])
  })

  it('handles list of valid chains including an invalid chain', () => {
    expect(getSupportedWalletConnectChains([EIP155_MAINNET, EIP155_POLYGON, EIP155_LINEA_UNSUPPORTED])).toEqual([
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
    ])
  })
})

describe(getChainIdFromEIP155String, () => {
  it('handles valid eip155 mainnet address', () => {
    expect(getChainIdFromEIP155String(EIP155_MAINNET)).toBe(UniverseChainId.Mainnet)
  })

  it('handles valid eip155 optimism address', () => {
    expect(getChainIdFromEIP155String(EIP155_OPTIMISM)).toBe(UniverseChainId.Optimism)
  })

  it('handles invalid eip155 address', () => {
    expect(getChainIdFromEIP155String(EIP155_LINEA_UNSUPPORTED)).toBeNull()
  })
})
