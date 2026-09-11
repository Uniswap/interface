import { PriceRangeStrategy as ProtoPriceRangeStrategy } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import { MIGRATOR_PARAMETERS_PARAM } from '@uniswap/liquidity-launcher-sdk'
import { decodeAbiParameters, decodeFunctionData, parseAbi, type PublicClient } from 'viem'
import { buildOnchainCreateAuction } from '~/features/Toucan/ZkPassport/onchainLaunch'

const WALLET = '0x89d94da1c6a8564f66e414a8c1c323f96c685006'
const HOOK = '0x246029D5a72E346A86A31B570D9e49e819CB5A39'
const SALT = '0x5426b0788ec5e9876a6fc7e4422032d7e6cf6954f1a3853441f2b1d6bc331749'
const PREDICTED_TOKEN = '0x89767f9Ff3656b11861Be5243142FC9b61E9Be50'
const PREDICTED_AUCTION = '0x08B301F6A61251B56ddEfd8F5f6c345c4EC44c6A'
const CCA_FACTORY = '0x000000001F26a0044BaA66024e7b6599c61963F8'

const LAUNCHER_ABI = parseAbi([
  'function multicall(bytes[] data)',
  'function createToken(address factory, string name, string symbol, uint8 decimals, uint128 initialSupply, address recipient, bytes tokenData)',
  'function distributeToken(address token, (address strategy, uint128 amount, bytes configData) params, bytes32 salt)',
])

const AUCTION_PARAMS_ABI = [
  {
    type: 'tuple',
    components: [
      { name: 'currency', type: 'address' },
      { name: 'tokensRecipient', type: 'address' },
      { name: 'fundsRecipient', type: 'address' },
      { name: 'startBlock', type: 'uint64' },
      { name: 'endBlock', type: 'uint64' },
      { name: 'claimBlock', type: 'uint64' },
      { name: 'tickSpacing', type: 'uint256' },
      { name: 'validationHook', type: 'address' },
      { name: 'floorPrice', type: 'uint256' },
      { name: 'requiredCurrencyRaised', type: 'uint128' },
      { name: 'auctionStepsData', type: 'bytes' },
    ],
  },
] as const

// Answers the three reads the builder makes: token prediction, current block,
// and auction prediction (initializerFactory() then getAddress(...)).
const stubClient = {
  getBlockNumber: async () => 11618000n,
  readContract: async ({ functionName }: { functionName: string }) => {
    switch (functionName) {
      case 'getUERC20Address':
      case 'getUSUPERC20Address':
        return PREDICTED_TOKEN
      case 'initializerFactory':
        return CCA_FACTORY
      default:
        return PREDICTED_AUCTION
    }
  },
} as unknown as PublicClient

const request = {
  walletAddress: WALLET,
  salt: SALT,
  tokenInfo: {
    source: {
      case: 'newToken' as const,
      value: {
        name: 'MV1',
        symbol: 'MV1',
        totalSupply: (10n ** 27n).toString(),
        metadata: { description: '', image: '' },
      },
    },
  },
  auction: {
    currencyAddress: '0x0000000000000000000000000000000000000000',
    startTimeUnix: BigInt(Math.floor(Date.now() / 1000) + 600),
    endTimeUnix: BigInt(Math.floor(Date.now() / 1000) + 15000),
    floorPriceRaisePerToken: '0.000000000278',
    auctionSupply: (10n ** 27n).toString(),
    validationHook: HOOK,
  },
  pool: {
    fee: 3000,
    dynamicFee: false,
    priceRangeStrategy: ProtoPriceRangeStrategy.FULL_RANGE,
    customRanges: [],
    reservedSupplyForLp: (5n * 10n ** 26n).toString(),
    lpAllocation: { kind: { case: 'singlePercent' as const, value: 100 } },
    poolOwner: WALLET,
  },
}

describe('buildOnchainCreateAuction', () => {
  it('assembles a launcher multicall equivalent to the backend plan', async () => {
    const result = await buildOnchainCreateAuction({
      request,
      chainId: 11155111,
      publicClient: stubClient,
    })

    expect(result.predictedTokenAddress).toBe(PREDICTED_TOKEN)
    expect(result.predictedAuctionAddress).toBe(PREDICTED_AUCTION)
    expect(result.transactions).toHaveLength(1)

    const [tx] = result.transactions
    expect(tx.to.toLowerCase()).toBe('0x00004c4ccc709ef590f7c81102c0689f0263d4e9')
    expect(tx.from).toBe(WALLET)
    expect(tx.value).toBe(0n)

    const outer = decodeFunctionData({
      abi: LAUNCHER_ABI,
      data: tx.data as `0x${string}`,
    })
    expect(outer.functionName).toBe('multicall')
    const [createCall, distributeCall] = outer.args[0]

    const create = decodeFunctionData({ abi: LAUNCHER_ABI, data: createCall })
    expect(create.functionName).toBe('createToken')
    expect(create.args[1]).toBe('MV1')
    expect(create.args[4]).toBe(10n ** 27n)

    const distribute = decodeFunctionData({
      abi: LAUNCHER_ABI,
      data: distributeCall,
    })
    expect(distribute.functionName).toBe('distributeToken')
    expect(distribute.args[0]).toBe(PREDICTED_TOKEN)
    expect(distribute.args[2]).toBe(SALT)

    const [migrator, auctionParamsHex] = decodeAbiParameters(
      [MIGRATOR_PARAMETERS_PARAM, { type: 'bytes' }] as const,
      distribute.args[1].configData,
    )
    expect(migrator.token).toBe(PREDICTED_TOKEN)
    expect(migrator.reservedTokenAmountForLP).toBe(5n * 10n ** 26n)
    expect(migrator.poolParameters.fee).toBe(3000)

    const [auctionParams] = decodeAbiParameters(AUCTION_PARAMS_ABI, auctionParamsHex)
    expect(auctionParams.validationHook).toBe(HOOK)
    expect(auctionParams.floorPrice).toBeGreaterThan(0n)
    expect(auctionParams.floorPrice % auctionParams.tickSpacing).toBe(0n)
    expect(auctionParams.endBlock).toBeGreaterThan(auctionParams.startBlock)
    expect(auctionParams.auctionStepsData.length).toBeGreaterThan(2)
  })
})
