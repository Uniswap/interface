import { Token } from "@uniswap/sdk-core"

export const feth = "0xa826985DF0507632C7DAB6de761d8d4efC353d1F"
export const fusdc = "0x54D374769278b45713549B85Ca9Dd9cae3e286cc"
const FETH = new Token(80001, feth, 18, "fETH", "Fake ETH");
const FUSDC = new Token(80001, fusdc, 6, "fUSDC", "Fake USDC")
export const FakeTokens: Token[]  = [
  FETH,
  FUSDC
]