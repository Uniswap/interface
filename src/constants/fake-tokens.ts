import { Token } from "@uniswap/sdk-core"
import { SupportedChainId } from "./chains"

export const feth_m = "0xa826985df0507632c7dab6de761d8d4efc353d1f"
export const fusdc_m = "0x54d374769278b45713549b85ca9dd9cae3e286cc"
export const fwbtc_m = "0xcbd6235bb2cf6bc3eafd36c4a53691a198bd372b"
export const fusdt_m = "0xec6aab8617f24f5ff6e2560bb2eaabc2ed1ddda8"
export const fdai_m = "0xdad060ea62ccf995e765e6df18587e8e5937fb80"

export const fwbtc_s = '0xf24ce4a61c1894219576f652cdf781bbb257ec8f'
export const fdai_s = '0x7131ba0d21cf74ae67e64c539af0cff8780bf836'
export const fusdc_s = '0x569f3140fdc0f3b9fc2e4919c35f35d39dd2b01a'
export const feth_s = '0x4e3f175b38098326a34f2c8b2d07af5ffdfc6fa9'
    // console.log(fwbtc < fdai)
    // console.log(fwbtc < fusdc)
    // console.log(fwbtc < feth)
    // console.log(fdai < fusdc)
    // console.log(fusdc < feth)
    // console.log(fdai < feth)

export const FETH_SEPOLIA = new Token(11155111, feth_s, 18, "fETH", "Fake ETH");
export const FUSDC_SEPOLIA = new Token(11155111, fusdc_s, 18, "fUSDC", "Fake USDC")
export const FWBTC_SEPOLIA = new Token(11155111, fwbtc_s, 18, "fWBTC", "Fake WBTC")
export const FDAI_SEPOLIA = new Token(11155111, fdai_s, 18, "fDAI", "Fake DAI")

export const FETH_MUMBAI = new Token(80001, feth_m, 18, "fETH", "Fake ETH");
export const FUSDC_MUMBAI = new Token(80001, fusdc_m, 18, "fUSDC", "Fake USDC")
export const FWBTC_MUMBAI = new Token(80001, fwbtc_m, 18, "fWBTC", "Fake WBTC")
export const FDAI_MUMBAI = new Token(80001, fdai_m, 18, "fDAI", "Fake DAI")

export const FakeTokens_SEPOLIA: Token[]  = [
  FETH_SEPOLIA,
  FUSDC_SEPOLIA,
  FWBTC_SEPOLIA,
  FDAI_SEPOLIA
]

export const FakeTokens_MUMBAI: Token[]  = [
  FETH_MUMBAI,
  FUSDC_MUMBAI,
  FWBTC_MUMBAI,
  FDAI_MUMBAI
]

export const FakeTokensMapSepolia: { [address: string]: Token } = {
  [FETH_SEPOLIA.address]: FETH_SEPOLIA,
  [FUSDC_SEPOLIA.address]: FUSDC_SEPOLIA,
  [FWBTC_SEPOLIA.address]: FWBTC_SEPOLIA,
  [FDAI_SEPOLIA.address]: FDAI_SEPOLIA
}

export const FakeTokensMapMumbai: { [address: string]: Token } = {
  [FETH_MUMBAI.address]: FETH_MUMBAI,
  [FUSDC_MUMBAI.address]: FUSDC_MUMBAI,
  [FWBTC_MUMBAI.address]: FWBTC_MUMBAI,
  [FDAI_MUMBAI.address]: FDAI_MUMBAI
}

export const getFakeTokensMap = (chainId: number): { [address: string]: Token } => {
  if (chainId === SupportedChainId.SEPOLIA) {
    return FakeTokensMapSepolia
  } else {
    return FakeTokensMapMumbai
  }
}

export const getFakeSymbol = (chainId: number, token0?: string, token1?: string): string | undefined => {
  if (chainId === SupportedChainId.SEPOLIA) {
    if (token0 === feth_s && token1 === fusdc_s) {
      return JSON.stringify(
        {
          poolAddress: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
          baseSymbol: "fETH",
          quoteSymbol: "fUSDC",
          invertPrice: false,
          useUniswapSubgraph: true
        }
      )
    } else if (token0 === feth_s && token1 === fwbtc_s) {
      return JSON.stringify(
        {
          poolAddress: "0x4585fe77225b41b697c938b018e2ac67ac5a20c0",
          baseSymbol: "fETH",
          quoteSymbol: "fWBTC",
          invertPrice: true,
          useUniswapSubgraph: true
        }
      )
    } else if (token0 === fusdc_s && token1 === fdai_s) {
      return JSON.stringify(
        {
          poolAddress: "0x5777d92f208679db4b9778590fa3cab3ac9e2168",
          baseSymbol: "fUSDC",
          quoteSymbol: "fDAI",
          invertPrice: false,
          useUniswapSubgraph: true
        }
      )
    } else if (token0 === fwbtc_s && token1 === fdai_s) {
      return JSON.stringify(
        {
          poolAddress: "0x391e8501b626c623d39474afca6f9e46c2686649",
          baseSymbol: "fWBTC",
          quoteSymbol: "fDAI",
          invertPrice: true,
          useUniswapSubgraph: true
        }
      )
    } else if (token0 === feth_s && token1 === fdai_s) {
      return JSON.stringify(
        {
          poolAddress: "0x60594a405d53811d3bc4766596efd80fd545a270",
          baseSymbol: "fETH",
          quoteSymbol: "fDAI",
          invertPrice: false,
          useUniswapSubgraph: true
        }
      )
    } else if (token0 === fusdc_s && token1 === fwbtc_s) {
      return JSON.stringify(
        {
          poolAddress: "0x99ac8ca7087fa4a2a1fb6357269965a2014abc35",
          baseSymbol: "fWBTC",
          quoteSymbol: "fUSDC",
          invertPrice: true,
          useUniswapSubgraph: true
        }
      )
    }
  } else if (chainId === SupportedChainId.POLYGON_MUMBAI) {
    if (token0 === fusdc_m && token1 === feth_m) {
      return JSON.stringify(
        {
          poolAddress: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
          baseSymbol: "fETH",
          quoteSymbol: "fUSDC",
          invertPrice: false,
          useUniswapSubgraph: true
        }
      )
    } else if (token0 === feth_m && token1 === fwbtc_m) {
      return JSON.stringify(
        {
          poolAddress: "0x4585fe77225b41b697c938b018e2ac67ac5a20c0",
          baseSymbol: "fETH",
          quoteSymbol: "fWBTC",
          invertPrice: true,
          useUniswapSubgraph: true
        }
      )
    } else if (token0 === fusdc_m && token1 === fdai_m) {
      return JSON.stringify(
        {
          poolAddress: "0x5777d92f208679db4b9778590fa3cab3ac9e2168",
          baseSymbol: "fUSDC",
          quoteSymbol: "fDAI",
          invertPrice: false,
          useUniswapSubgraph: true
        }
      )
    } else if (token0 === fwbtc_m && token1 === fdai_m) {
      return JSON.stringify(
        {
          poolAddress: "0x391e8501b626c623d39474afca6f9e46c2686649",
          baseSymbol: "fWBTC",
          quoteSymbol: "fDAI",
          invertPrice: true,
          useUniswapSubgraph: true
        }
      )
    } else if (token0 === feth_m && token1 === fdai_m) {
      return JSON.stringify(
        {
          poolAddress: "0x60594a405d53811d3bc4766596efd80fd545a270",
          baseSymbol: "fETH",
          quoteSymbol: "fDAI",
          invertPrice: false,
          useUniswapSubgraph: true
        }
      )
    } else if (token0 === fusdc_m && token1 === fwbtc_m) {
      return JSON.stringify(
        {
          poolAddress: "0x99ac8ca7087fa4a2a1fb6357269965a2014abc35",
          baseSymbol: "fWBTC",
          quoteSymbol: "fUSDC",
          invertPrice: true,
          useUniswapSubgraph: true
        }
      )}
  }
  return undefined
}



export const getFakePool = (chainId: number, token0?: string, token1?: string): string | undefined => {
  if (chainId === SupportedChainId.SEPOLIA) {
    if (token0 === feth_s && token1 === fusdc_s) {
      return "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
    } else if (token0 === feth_s && token1 === fwbtc_s) {
      return "0x4585fe77225b41b697c938b018e2ac67ac5a20c0"
    } else if (token0 === fusdc_s && token1 === fdai_s) {
      return "0x5777d92f208679db4b9778590fa3cab3ac9e2168"
    } else if (token0 === fdai_s && token1 === fwbtc_s) {
      return "0x391e8501b626c623d39474afca6f9e46c2686649"
    } else if (token0 === feth_s && token1 === fdai_s) {
      return "0x60594a405d53811d3bc4766596efd80fd545a270"
    } else if (token0 === fusdc_s && token1 === fwbtc_s) {
      return "0x99ac8ca7087fa4a2a1fb6357269965a2014abc35"
    }
  } else if (chainId === SupportedChainId.POLYGON_MUMBAI) {
    if (token0 === fusdc_m && token1 === feth_m) {
      return "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
    } else if (token0 === feth_m && token1 === fwbtc_m) {
      return "0x4585fe77225b41b697c938b018e2ac67ac5a20c0"
    } else if (token0 === fusdc_m && token1 === fdai_m) {
      return "0x5777d92f208679db4b9778590fa3cab3ac9e2168"
    } else if (token0 === fwbtc_m && token1 === fdai_m) {
      return "0x391e8501b626c623d39474afca6f9e46c2686649"
    } else if (token0 === feth_m && token1 === fdai_m) {
      return "0x60594a405d53811d3bc4766596efd80fd545a270"
    } else if (token0 === fusdc_m && token1 === fwbtc_m) {
      return "0x99ac8ca7087fa4a2a1fb6357269965a2014abc35"
    }
  }
  return undefined
}

// checks if should use fake pool pair
export const isFakePair = (chainId: number, token0?: string, token1?: string): boolean => {
  if (chainId === SupportedChainId.SEPOLIA) {
    return (
      token0 === feth_s && token1 === fusdc_s ||
      token0 === feth_s && token1 === fwbtc_s ||
      token0 === fusdc_s && token1 === fdai_s ||
      token0 === fdai_s && token1 === fwbtc_s ||
      token0 === feth_s && token1 === fdai_s ||
      token0 === fusdc_s && token1 === fwbtc_s
    )
  } else if (chainId === SupportedChainId.POLYGON_MUMBAI) {
    return (
      token0 === fusdc_m && token1 === feth_m ||
      token0 === feth_m && token1 === fwbtc_m ||
      token0 === fusdc_m && token1 === fdai_m ||
      token0 === fwbtc_m && token1 === fdai_m ||
      token0 === feth_m && token1 === fdai_m ||
      token0 === fusdc_m && token1 === fwbtc_m
    )
  } else {
    return false
  }
}