import { UniverseChainId } from 'uniswap/src/types/chains'

type AddressMap = { [chainId: number]: string }

const DEFAULT_NETWORKS = [UniverseChainId.Mainnet, UniverseChainId.Sepolia]

function constructSameAddressMap(address: string, additionalNetworks: UniverseChainId[] = []): AddressMap {
  return DEFAULT_NETWORKS.concat(additionalNetworks).reduce<AddressMap>((memo, chainId) => {
    memo[chainId] = address
    return memo
  }, {})
}

export const AUTHORITY_ADDRESSES: AddressMap = constructSameAddressMap('0xe35129A1E0BdB913CF6Fd8332E9d3533b5F41472', [
  UniverseChainId.Mainnet,
  UniverseChainId.Sepolia,
  UniverseChainId.Optimism,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Polygon,
  UniverseChainId.Bnb,
  UniverseChainId.Base,
])

/* V1 Governance Addresses */
export const GOVERNANCE_PROXY_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0x5F8607739c2D2d0b57a4292868C368AB1809767a', [
    UniverseChainId.Mainnet,
    UniverseChainId.Sepolia,
    UniverseChainId.Optimism,
    UniverseChainId.ArbitrumOne,
    UniverseChainId.Polygon,
    UniverseChainId.Bnb,
    UniverseChainId.Base,
  ]),
}

/* Staking Proxy Addresses */
export const STAKING_PROXY_ADDRESSES: AddressMap = {
  [UniverseChainId.Mainnet]: '0x730dDf7b602dB822043e0409d8926440395e07fE',
  [UniverseChainId.Sepolia]: '0x6C4594aa0CBcb8315E88EFdb11675c09A7a5f444',
  [UniverseChainId.Optimism]: '0xB844bDCC64a748fDC8c9Ee74FA4812E4BC28FD70',
  [UniverseChainId.ArbitrumOne]: '0xD495296510257DAdf0d74846a8307bf533a0fB48',
  [UniverseChainId.Polygon]: '0xC87d1B952303ae3A9218727692BAda6723662dad',
  [UniverseChainId.Bnb]: '0xa4a94cCACa8ccCdbCD442CF8eECa0cd98f69e99e',
  [UniverseChainId.Base]: '0xc758Ea84d6D978fe86Ee29c1fbD47B4F302F1992',
}

/* GRG Transfer Proxy Addresses */
export const GRG_TRANSFER_PROXY_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0x28891F41eA506Ba7eA3Be9f2075AB0aa8b81dD29', [
    UniverseChainId.Mainnet,
    UniverseChainId.Sepolia,
    UniverseChainId.Optimism,
    UniverseChainId.ArbitrumOne,
    UniverseChainId.Polygon,
    UniverseChainId.Bnb,
    UniverseChainId.Base,
  ]),
  [UniverseChainId.Mainnet]: '0x8C96182c1B2FE5c49b1bc9d9e039e369f131ED37',
}

/* Rigoblock Pool Factory Addresses */
export const RB_FACTORY_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0x8DE8895ddD702d9a216E640966A98e08c9228f24', [
    UniverseChainId.Mainnet,
    UniverseChainId.Sepolia,
    UniverseChainId.Optimism,
    UniverseChainId.ArbitrumOne,
    UniverseChainId.Polygon,
    UniverseChainId.Bnb,
    UniverseChainId.Base,
  ]),
}

/* Rigoblock Pool Registry Addresses */
export const RB_REGISTRY_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0x06767e8090bA5c4Eca89ED00C3A719909D503ED6', [
    UniverseChainId.Mainnet,
    UniverseChainId.Sepolia,
    UniverseChainId.Optimism,
    UniverseChainId.ArbitrumOne,
    UniverseChainId.Polygon,
    UniverseChainId.Bnb,
    UniverseChainId.Base,
  ]),
}

export const POP_ADDRESSES: AddressMap = {
  [UniverseChainId.Mainnet]: '0xC3736344ee0bcE9bDe5D231060f03990b798f030',
  [UniverseChainId.Sepolia]: '0x9CE56818c01bCF9bbCa533d2db4b19e85e53a000',
  [UniverseChainId.Optimism]: '0x9e895962AaceE64e42b8fFFa1efF0AcD7F0B6794',
  [UniverseChainId.ArbitrumOne]: '0xA665C2f17D0Fa2D9f1efaa587B5CF493B23751b0',
  [UniverseChainId.Polygon]: '0x4170B7d618F3E5B29b3DBdCDADd626fF3746be9A',
  [UniverseChainId.Bnb]: '0xAe1D80A6731c44eeF098D4C6Cf979f596c7cd6F7',
  [UniverseChainId.Base]: '0x979Af6DDC1562b4B6D8B2Ab60A1B7221a0d6C8DB',
}
