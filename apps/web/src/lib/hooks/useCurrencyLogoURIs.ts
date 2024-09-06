import { ChainId } from "@taraswap/sdk-core";
import { getChain, isSupportedChainId } from "constants/chains";
import { isSameAddress } from "utilities/src/addresses";

import EthereumLogo from "../../assets/images/ethereum-logo.png";
import AvaxLogo from "../../assets/svg/avax_logo.svg";
import BnbLogo from "../../assets/svg/bnb-logo.svg";
import CeloLogo from "../../assets/svg/celo_logo.svg";
import MaticLogo from "../../assets/svg/matic-token-icon.svg";
import TaraxaLogo from "../../assets/svg/taraxa_logo.svg";
import {
  PORTAL_ETH_CELO,
  USDT_TARAXA_TESTNET,
  isCelo,
  isTaraxa,
  nativeOnChain,
} from "../../constants/tokens";
import { isNativeCurrency } from "@taraswap/universal-router-sdk";

export function getNativeLogoURI(chainId: ChainId = ChainId.MAINNET): string {
  switch (chainId) {
    case ChainId.POLYGON:
    case ChainId.POLYGON_MUMBAI:
      return MaticLogo;
    case ChainId.BNB:
      return BnbLogo;
    case ChainId.CELO:
    case ChainId.CELO_ALFAJORES:
      return CeloLogo;
    case ChainId.AVALANCHE:
      return AvaxLogo;
    case ChainId.TARAXA:
      return TaraxaLogo;
    default:
      return EthereumLogo;
  }
}

export function getTokenLogoURI(
  address: string,
  chainId: ChainId = ChainId.MAINNET
): string | void {
  const networkName = isSupportedChainId(chainId)
    ? getChain({ chainId }).assetRepoNetworkName
    : undefined;

  if (
    isTaraxa(chainId) &&
    (isSameAddress(address, nativeOnChain(chainId).wrapped.address) ||
      isNativeCurrency(address))
  ) {
    return TaraxaLogo;
  }
  if (
    isCelo(chainId) &&
    isSameAddress(address, nativeOnChain(chainId).wrapped.address)
  ) {
    return CeloLogo;
  }
  if (isCelo(chainId) && isSameAddress(address, PORTAL_ETH_CELO.address)) {
    return EthereumLogo;
  }

  if (networkName) {
    return `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/${networkName}/assets/${address}/logo.png`;
  }
}
