import { Token } from '@uniswap/sdk-core'
import { erc20Abi, erc20Abi_bytes32 } from '@universe/chains'
import { ensure0xHex } from '@universe/encoding'
import ERC20_ABI_JSON from 'uniswap/src/abis/erc20.json'
import { UniswapInterfaceMulticall } from 'uniswap/src/abis/types/v3'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { DEFAULT_ERC20_DECIMALS } from 'utilities/src/tokens/constants'
import { decodeFunctionResult, encodeFunctionData } from '~/chains'
import { INTERNAL_JSON_RPC_ERROR_CODE } from '~/constants/misc'
import { arrayToSlices } from '~/utils/arrays'
import { buildCurrencyKey, CurrencyKey, currencyKey } from '~/utils/currencyKey'

type TokenMap = { [address: string]: Token | undefined }
export type Call = { target: string; callData: string; gasLimit: number }
type CallResult = { success: boolean; returnData: string }
export const DEFAULT_GAS_LIMIT = 1_000_000

const ERC20_ABI = ERC20_ABI_JSON as unknown as typeof erc20Abi
const ERC20_ABI_BYTES = ERC20_ABI_JSON as unknown as typeof erc20Abi_bytes32

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
      ? (decodeFunctionResult({
          abi: ERC20_ABI,
          functionName: 'name',
          data: ensure0xHex(nameData.returnData),
        }) as string)
      : nameDataBytes32.success
        ? (decodeFunctionResult({
            abi: ERC20_ABI_BYTES,
            functionName: 'name',
            data: ensure0xHex(nameDataBytes32.returnData),
          }) as string)
        : undefined
    const symbol = symbolData.success
      ? (decodeFunctionResult({
          abi: ERC20_ABI,
          functionName: 'symbol',
          data: ensure0xHex(symbolData.returnData),
        }) as string)
      : symbolDataBytes32.success
        ? (decodeFunctionResult({
            abi: ERC20_ABI_BYTES,
            functionName: 'symbol',
            data: ensure0xHex(symbolDataBytes32.returnData),
          }) as string)
        : undefined
    const decimals = decimalsData.success
      ? (decodeFunctionResult({
          abi: ERC20_ABI,
          functionName: 'decimals',
          data: ensure0xHex(decimalsData.returnData),
        }) as number)
      : DEFAULT_ERC20_DECIMALS

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

  // oxlint-disable-next-line max-params
  return tokenDataSlices.reduce((acc: TokenMap, slice, index) => {
    const parsedToken = tryParseToken({ address: addresses[index], chainId, data: slice })
    if (parsedToken) {
      acc[parsedToken.address] = parsedToken
    }
    return acc
  }, {})
}

const createCalls = (target: string, callData: string[]): Call[] =>
  // oxlint-disable-next-line no-shadow
  callData.map((callData) => ({ target, callData, gasLimit: DEFAULT_GAS_LIMIT }))

function createCallsForToken(address: string) {
  return createCalls(address, [
    encodeFunctionData({ abi: ERC20_ABI, functionName: 'name' }),
    encodeFunctionData({ abi: ERC20_ABI, functionName: 'symbol' }),
    encodeFunctionData({ abi: ERC20_ABI, functionName: 'decimals' }),
    encodeFunctionData({ abi: ERC20_ABI_BYTES, functionName: 'name' }),
    encodeFunctionData({ abi: ERC20_ABI_BYTES, functionName: 'symbol' }),
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
