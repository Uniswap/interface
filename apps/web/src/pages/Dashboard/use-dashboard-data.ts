import { useQuery } from '@tanstack/react-query'

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loadDashboardData() {
  await wait(10000)
  return {
    ubePrice: 0.0085,
    ubeMarketCap: 400000,
    UbeFdv: 850000,
    totalTvl: 3218316,
    volume24h: 168670,
    totalVolume: 568123123,
    unuqueWallets: 58123,
    topGainers: [
      {
        tokenAddress: '0x71e26d0E519D14591b9dE9a0fE9513A398101490',
        price: 0.0085,
        change24h: 5.2,
      },
      {
        tokenAddress: '0x471EcE3750Da237f93B8E339c536989b8978a438',
        price: 0.91,
        change24h: 3.6,
      },
      {
        tokenAddress: '0x7b97031b6297bc8e030b07bd84ce92fea1b00c3e',
        price: 0.35,
        change24h: 3.5,
      },
    ],
    topEarnPools: [
      {
        type: 'stake',
        contractAddress: '0x8585A611521717Ffe7d93cF264DbE936E484DBa0',
        stakingToken: '0x7b97031b6297bc8e030b07bd84ce92fea1b00c3e',
        apr: 63.9,
        url: '/stakes/0x8585A611521717Ffe7d93cF264DbE936E484DBa0',
      },
      {
        type: 'farm',
        contractAddress: '0xA6E9069CB055a425Eb41D185b740B22Ec8f51853',
        protocolVersion: 3,
        token0: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A',
        token1: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
        poolAddress: '0x28ade0134b9d0bc7041f4e5ea74fecb58504720b',
        apr: 16.14,
        url: '/farmv3/0x28ade0134b9d0bc7041f4e5ea74fecb58504720b',
      },
      {
        type: 'farm',
        contractAddress: '0xA6E9069CB055a425Eb41D185b740B22Ec8f51853',
        protocolVersion: 3,
        token0: '0x71e26d0E519D14591b9dE9a0fE9513A398101490',
        token1: '0x471EcE3750Da237f93B8E339c536989b8978a438',
        poolAddress: '0x3efc8d831b754d3ed58a2b4c37818f2e69dadd19',
        apr: 14.15,
        url: '/farmv3/0x3efc8d831b754d3ed58a2b4c37818f2e69dadd19',
      },
    ],
  }
}

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => loadDashboardData(),
    staleTime: 100_000,
  })
}
