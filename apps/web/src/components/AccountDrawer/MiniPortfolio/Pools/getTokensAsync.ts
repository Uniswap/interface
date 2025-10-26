import { Token } from '@uniswap/sdk-core'
import { INTERNAL_JSON_RPC_ERROR_CODE } from 'constants/misc'
import { Interface } from 'ethers/lib/utils'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { Erc20Interface } from 'uniswap/src/abis/types/Erc20'
import { Erc20Bytes32Interface } from 'uniswap/src/abis/types/Erc20Bytes32'
import { UniswapInterfaceMulticall } from 'uniswap/src/abis/types/v3'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { DEFAULT_ERC20_DECIMALS } from 'utilities/src/tokens/constants'
import { arrayToSlices } from 'utils/arrays'
import { buildCurrencyKey, CurrencyKey, currencyKey } from 'utils/currencyKey'

type TokenMap = { [address: string]: Token | undefined }
export type Call = { target: string; callData: string; gasLimit: number }
type CallResult = { success: boolean; returnData: string }
export const DEFAULT_GAS_LIMIT = 1_000_000

const Erc20 = new Interface(ERC20_ABI) as Erc20Interface
const Erc20Bytes32 = new Interface(ERC20_ABI) as Erc20Bytes32Interface // Used for tokens that return bytes32 for name/symbol rather than string

// TODO(WEB-1760): cartcrom - adapt support for multi-function multi-interface multicalls into redux-multicall to remove than this custom cache/chunking logic
// Infura rejects calls with gas costs > 10x the current block gas limit; in such case we split the call into 2 chunks
async function fetchChunk(multicall: UniswapInterfaceMulticall, chunk: Call[]): Promise<CallResult[]> {
  try {
    return (await multicall.callStatic.multicall(chunk)).returnData
  } catch (error) {
    if (error.code === INTERNAL_JSON_RPC_ERROR_CODE || error.message?.indexOf('execution ran out of gas') !== -1) {
      if (chunk.length > 1) {
        const half = Math.floor(chunk.length / 2)
        return Promise.all([
          fetchChunk(multicall, chunk.slice(0, half)),
          fetchChunk(multicall, chunk.slice(half, chunk.length)),
        ]).then(([c0, c1]) => [...c0, ...c1])
      }
    }
    logger.debug('getTokensAsync', 'fetchChunk', 'Error fetching chunk', { error, extra: { chunk } })
    throw error
  }
}

function tryParseToken({ address, chainId, data }: { address: string; chainId: UniverseChainId; data: CallResult[] }) {
  try {
    const [nameData, symbolData, decimalsData, nameDataBytes32, symbolDataBytes32] = data

    const name = nameData.success
      ? (Erc20.decodeFunctionResult('name', nameData.returnData)[0] as string)
      : nameDataBytes32.success
        ? (Erc20Bytes32.decodeFunctionResult('name', nameDataBytes32.returnData)[0] as string)
        : undefined
    const symbol = symbolData.success
      ? (Erc20.decodeFunctionResult('symbol', symbolData.returnData)[0] as string)
      : symbolDataBytes32.success
        ? (Erc20Bytes32.decodeFunctionResult('symbol', symbolDataBytes32.returnData)[0] as string)
        : undefined
    const decimals = decimalsData.success ? parseInt(decimalsData.returnData) : DEFAULT_ERC20_DECIMALS

    return new Token(chainId, address, decimals, symbol, name)
  } catch (error) {
    logger.debug('getTokensAsync', 'tryParseToken', 'Failed to parse token', { error, address, chainId })
    return undefined
  }
}

function parseTokens({
  addresses,
  chainId,
  returnData,
}: {
  addresses: string[]
  chainId: UniverseChainId
  returnData: CallResult[]
}) {
  const tokenDataSlices = arrayToSlices(returnData, 5)

  // eslint-disable-next-line max-params
  return tokenDataSlices.reduce((acc: TokenMap, slice, index) => {
    const parsedToken = tryParseToken({ address: addresses[index], chainId, data: slice })
    if (parsedToken) {
      acc[parsedToken.address] = parsedToken
    }
    return acc
  }, {})
}

const createCalls = (target: string, callData: string[]): Call[] =>
  callData.map((callData) => ({ target, callData, gasLimit: DEFAULT_GAS_LIMIT }))

function createCallsForToken(address: string) {
  return createCalls(address, [
    Erc20.encodeFunctionData('name'),
    Erc20.encodeFunctionData('symbol'),
    Erc20.encodeFunctionData('decimals'),
    Erc20Bytes32.encodeFunctionData('name'),
    Erc20Bytes32.encodeFunctionData('symbol'),
  ])
}

// Prevents tokens from being fetched multiple times
const TokenPromiseCache: { [key: CurrencyKey]: Promise<Token | undefined> | undefined } = {}

// Returns tokens using a single RPC call to the multicall contract
export async function getTokensAsync({
  addresses,
  chainId,
  multicall,
}: {
  addresses: string[]
  chainId: UniverseChainId
  multicall: UniswapInterfaceMulticall
}): Promise<TokenMap> {
  if (addresses.length === 0) {
    return {}
  }
  const formattedAddresses: string[] = []
  const calls: Call[] = []
  const previouslyCalledTokens: Promise<Token | undefined>[] = []

  addresses.forEach((tokenAddress) => {
    const key = buildCurrencyKey(chainId, tokenAddress)
    const previousCall = TokenPromiseCache[key]
    if (previousCall !== undefined) {
      previouslyCalledTokens.push(previousCall)
    } else {
      const formattedAddress = getValidAddress({
        address: tokenAddress,
        chainId,
        withEVMChecksum: true,
      })
      if (!formattedAddress) {
        return
      }
      formattedAddresses.push(formattedAddress)
      calls.push(...createCallsForToken(formattedAddress))
    }
  })

  const calledTokens = fetchChunk(multicall, calls).then((returnData) =>
    parseTokens({ addresses, chainId, returnData }),
  )

  // Caches tokens currently being fetched for further calls to use
  formattedAddresses.forEach(
    (address) =>
      (TokenPromiseCache[buildCurrencyKey(chainId, address)] = calledTokens.then((tokenMap) => tokenMap[address])),
  )

  const tokenMap = await calledTokens
  // Add tokens from previous calls to the map of tokens fetched in this call
  const resolvedPreviousTokens = await Promise.all(previouslyCalledTokens)
  resolvedPreviousTokens.forEach((token) => token && (tokenMap[currencyKey(token)] = token))

  return tokenMap
}
