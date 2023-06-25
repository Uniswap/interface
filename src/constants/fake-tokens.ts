import { Token } from "@uniswap/sdk-core"

export const feth = "0xa826985df0507632c7dab6de761d8d4efc353d1f"
export const fusdc = "0x54d374769278b45713549b85ca9dd9cae3e286cc"
export const fwbtc = "0xcbd6235bb2cf6bc3eafd36c4a53691a198bd372b"
export const fusdt = "0xec6aab8617f24f5ff6e2560bb2eaabc2ed1ddda8"
export const fdai = "0xdad060ea62ccf995e765e6df18587e8e5937fb80"

const FETH = new Token(80001, feth, 18, "fETH", "Fake ETH");
const FUSDC = new Token(80001, fusdc, 18, "fUSDC", "Fake USDC")
const FWBTC = new Token(80001, fwbtc, 18, "fWBTC", "Fake WBTC")
const FDAI = new Token(80001, fdai, 18, "fDAI", "Fake DAI")

export const FakeTokens: Token[]  = [
  FETH,
  FUSDC,
  FWBTC,
  FDAI
]

export const FakeTokensMap: { [address: string]: Token } = {
  [feth]: FETH,
  [fusdc]: FUSDC,
  [fwbtc]: FWBTC,
  [fdai]: FDAI
}

export const getFakeSymbol = (token0?: string, token1?: string): string | undefined => {
  if (token0 === fusdc && token1 === feth) {
    return JSON.stringify(
      {
        poolAddress: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
        baseSymbol: "fETH",
        quoteSymbol: "fUSDC",
        invertPrice: false,
        useUniswapSubgraph: true
      }
    )
  } else if (token0 === feth && token1 === fwbtc) {
    return JSON.stringify(
      {
        poolAddress: "0x4585fe77225b41b697c938b018e2ac67ac5a20c0",
        baseSymbol: "fETH",
        quoteSymbol: "fWBTC",
        invertPrice: true,
        useUniswapSubgraph: true
      }
    )
  } else if (token0 === fusdc && token1 === fdai) {
    return JSON.stringify(
      {
        poolAddress: "0x5777d92f208679db4b9778590fa3cab3ac9e2168",
        baseSymbol: "fUSDC",
        quoteSymbol: "fDAI",
        invertPrice: false,
        useUniswapSubgraph: true
      }
    )
  } else if (token0 === fwbtc && token1 === fdai) {
    return JSON.stringify(
      {
        poolAddress: "0x391e8501b626c623d39474afca6f9e46c2686649",
        baseSymbol: "fDAI",
        quoteSymbol: "fWBTC",
        invertPrice: true,
        useUniswapSubgraph: true
      }
    )
  } else if (token0 === feth && token1 === fdai) {
    return JSON.stringify(
      {
        poolAddress: "0x60594a405d53811d3bc4766596efd80fd545a270",
        baseSymbol: "fETH",
        quoteSymbol: "fDAI",
        invertPrice: false,
        useUniswapSubgraph: true
      }
    )
  } else if (token0 === fusdc && token1 === fwbtc) {
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
  return undefined
}

// checks if should use fake pool pair
export const isFakePair = (token0?: string, token1?: string): boolean => {
  return (
    token0 === fusdc && token1 === feth ||
    token0 === feth && token1 === fwbtc ||
    token0 === fusdc && token1 === fdai ||
    token0 === fwbtc && token1 === fdai ||
    token0 === feth && token1 === fdai ||
    token0 === fusdc && token1 === fwbtc
  )

    // console.log(fusdc < feth)
    // console.log(fusdc < fwbtc)
    // console.log(fusdc < fdai)
    // console.log(feth < fwbtc)
    // console.log(feth < fdai)
    // console.log(fwbtc < fdai)
}