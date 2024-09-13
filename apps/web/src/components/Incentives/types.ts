export type TokenInfo = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
};

export type TokenInfoDetails = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
};

export type VersionInfo = {
  major: number;
  minor: number;
  patch: number;
};

export type TaraxaMainnetListResponse = {
  tokens: TokenInfoDetails[];
  name: string;
  logoURI: string;
  keywords: string[];
  timestamp: string;
  version: VersionInfo;
};

export type PoolInfo = {
  id: number;
  address: string;
  token0: TokenInfo;
  token1: TokenInfo;
  tvl: string;
  apr1d: number;
  totalrewards: string;
  tokenreward: string;
};

export function findTokenByAddress(
  tokens: TokenInfoDetails[],
  address: string
): TokenInfoDetails | undefined {
  return tokens.find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  );
}

// Remove this
const tokens = [
  {
    chainId: 841,
    address: "0x5d0fa4c5668e5809c83c95a7cef3a9dd7c68d4fe",
    name: "Wrapped TARA",
    symbol: "WTARA",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/taraswap/taraswap-interface/main/packages/ui/src/assets/logos/png/taraxa-logo.png",
  },
  {
    chainId: 841,
    address: "0x5a51fadEF313f503239D1FE0b25DE2486B022c02",
    name: "Test Tether",
    symbol: "TUSDT",
    decimals: 6,
    logoURI:
      "https://tse3.mm.bing.net/th?id=OIP.pEDUtRL00rm2PTq4gY_J4wHaHa&pid=Api",
  },
  {
    chainId: 841,
    address: "0x063F255689b00A877F6be55109b3ECA24e266809",
    name: "HerbSwap Token",
    symbol: "HERB",
    decimals: 18,
    logoURI: "https://iili.io/gFyZjs.png",
  },
  {
    chainId: 841,
    address: "0x46258327541455119869d7344dd2673facf5f104",
    name: "TestToken0",
    symbol: "T0",
    decimals: 18,
    logoURI:
      "https://drive.google.com/file/d/1ieRK-M3oPw-5ASE8QRPAmuvIcfWsPm8S/view?usp=sharing",
  },
  {
    chainId: 841,
    address: "0xc0509f5005a50035e93541e2b8b7c55d32234940",
    name: "TestToken1",
    symbol: "T1",
    decimals: 18,
    logoURI:
      "https://drive.google.com/file/d/1ieRK-M3oPw-5ASE8QRPAmuvIcfWsPm8S/view?usp=sharing",
  },
  {
    chainId: 841,
    address: "0xb7aa5d2bc4a0a28143d2e0af1e9dfa45bb6810c2",
    name: "TestToken2",
    symbol: "T2",
    decimals: 18,
    logoURI: "https://iili.io/gFyZjs.png",
  },
  {
    chainId: 841,
    address: "0x7d1eb8c23c9ef9b805d09aab0200e8c2f1654978",
    name: "TestToken3",
    symbol: "T3",
    decimals: 18,
    logoURI: "https://iili.io/gFyZjs.png",
  },
  {
    chainId: 841,
    address: "0x447fadbe2e33541153a8b76dca3f8bf32aff9431",
    name: "TestToken4",
    symbol: "T4",
    decimals: 18,
    logoURI: "https://iili.io/gFyZjs.png",
  },
  {
    chainId: 841,
    address: "0xe8c5781f927c78f727bcc2ba993e1b9b2187c423",
    name: "TestToken5",
    symbol: "T5",
    decimals: 18,
    logoURI: "https://iili.io/gFyZjs.png",
  },
  {
    chainId: 841,
    address: "0x254bb7d11a49fecc0142fa90c6c964e5d35dff5b",
    name: "TestToken6",
    symbol: "T6",
    decimals: 18,
    logoURI: "https://iili.io/gFyZjs.png",
  },
  {
    chainId: 841,
    address: "0x7bc602a5cdd267a65babe7ac6d7eeca9469166cc",
    name: "TestToken7",
    symbol: "T7",
    decimals: 18,
    logoURI: "https://iili.io/gFyZjs.png",
  },
  {
    chainId: 841,
    address: "0xc0a27f5b7e12076f4eeccac05a5243d8ec1a806e",
    name: "TestToken8",
    symbol: "T8",
    decimals: 18,
    logoURI: "https://iili.io/gFyZjs.png",
  },
  {
    chainId: 841,
    address: "0x504ccec9265b2d749b832e737739962b1c9957b0",
    name: "TestToken9",
    symbol: "T9",
    decimals: 18,
    logoURI: "https://iili.io/gFyZjs.png",
  },
];

export const mockPoolData: PoolInfo[] = [
  {
    id: 1,
    address: "0x123456789abcdef0123456789abcdef0123456789",
    token0: tokens[0],
    token1: tokens[1],
    tvl: "$950,000",
    apr1d: 27.5,
    totalrewards: "580,000 WTARA",
    tokenreward: "WTARA",
  },
  {
    id: 2,
    address: "0xabcdef1234567890abcdef0123456789abcdef01",
    token0: tokens[1],
    token1: tokens[2],
    tvl: "$1,200,000",
    apr1d: 30.2,
    totalrewards: "600,000 TUSDT",
    tokenreward: "TUSDT",
  },
  {
    id: 3,
    address: "0x0123456789abcdef0123456789abcdef01234567",
    token0: tokens[2],
    token1: tokens[0],
    tvl: "$875,000",
    apr1d: 25.3,
    totalrewards: "550,000 HERB",
    tokenreward: "HERB",
  },
];

export const subgraphApi =
  "https://indexer.lswap.app/subgraphs/name/taraswap/uni-v3-staker-mainnet";

export const INCENTIVES_QUERY = `
  query incentives {
    incentives(subgraphError: deny) {
      id
      ended
      reward
      contract
      startTime
      endTime
      rewardToken {
        id
        symbol
      }
      pool
    }
  }
`;

export type PoolIncentivesTableValues = PoolInfo & {
  pool: {
    token0: TokenInfoDetails | undefined;
    token1: TokenInfoDetails | undefined;
  };
  link: string;
  totalDeposit: number;
  pendingRewards: number;
};
