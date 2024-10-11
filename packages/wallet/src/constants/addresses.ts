import { ChainId } from "uniswap/src/types/chains";
import { CHAIN_INFO } from "./chains";

const MATIC_MAINNET_ADDRESS = "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0";
const MATIC_BNB_ADDRESS = "0xcc42724c6683b7e57334c4e856f4c9965ed682bd";
const MATIC_ARBITRUM_ADDRESS = "0x561877b6b3dd7651313794e5f2894b2f18be0766";
const BNB_MAINNET_ADDRESS = "0xb8c77482e45f1f44de1745f52c74426c631bdd52";
const BNB_POLYGON_ADDRESS = "0x3ba4c387f786bfee076a58914f5bd38d668b42c3";
const BNB_ARBITRUM_ADDRESS = "0x20865e63b111b2649ef829ec220536c82c58ad7b";
const CELO_MAINNET_ADDRESS = "0x471ece3750da237f93b8e339c536989b8978a438";
const AVAX_BNB = "0x1ce0c2827e2ef14d5c4f29a091d735a204794041";
const TARA_ETH_ADDRESS = "0x2F42b7d686ca3EffC69778B6ED8493A7787b4d6E";

export const BRIDGED_BASE_ADDRESSES = [
  MATIC_MAINNET_ADDRESS,
  MATIC_BNB_ADDRESS,
  MATIC_ARBITRUM_ADDRESS,
  BNB_MAINNET_ADDRESS,
  BNB_POLYGON_ADDRESS,
  BNB_ARBITRUM_ADDRESS,
  CELO_MAINNET_ADDRESS,
  TARA_ETH_ADDRESS,
  AVAX_BNB,
];

export function getNativeAddress(chainId: ChainId): string {
  return CHAIN_INFO[chainId].nativeCurrency.address;
}

export function getWrappedNativeAddress(chainId: ChainId): string {
  return CHAIN_INFO[chainId].wrappedNativeCurrency.address;
}

export const UNI_ADDRESS = {
  [ChainId.Mainnet]: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  [ChainId.Goerli]: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
};
