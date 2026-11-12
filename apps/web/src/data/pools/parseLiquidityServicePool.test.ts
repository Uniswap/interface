import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import {
  PoolCampaign,
  PoolSummary,
  PoolTokenRewards,
  RewardToken,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DYNAMIC_FEE_AMOUNT, V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { parseLiquidityServicePool } from '~/data/pools/parseLiquidityServicePool'

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

const poolSummary = (overrides: Partial<PoolSummary> = {}): PoolSummary =>
  new PoolSummary({
    poolIdentifier: '0x000000000000000000000000000000000000000000000000000000000000abcd',
    chainId: 1,
    protocolVersion: Protocols.V4,
    token0Address: '0x1111111111111111111111111111111111111111',
    token1Address: '0x2222222222222222222222222222222222222222',
    feeTier: 3000,
    tickSpacing: 60,
    tvlUsd: 123456.78,
    volumeUsd1d: 42,
    ...overrides,
  })

describe('parseLiquidityServicePool', () => {
  it('maps a static-fee PoolSummary to the canonical PoolData shape', () => {
    const data = parseLiquidityServicePool(poolSummary(), UniverseChainId.Mainnet)

    expect(data.idOrAddress).toBe('0x000000000000000000000000000000000000000000000000000000000000abcd')
    expect(data.protocolVersion).toBe(ProtocolVersion.V4)
    expect(data.feeTier?.feeAmount).toBe(3000)
    expect(data.feeTier?.tickSpacing).toBe(60)
    expect(data.feeTier?.isDynamic).toBe(false)
  })

  // Pins the UNSPECIFIED → undefined collapse that keeps downstream `?? V3` fallbacks engaging.
  it('collapses an unrecognized protocol version to undefined', () => {
    const data = parseLiquidityServicePool(poolSummary({ protocolVersion: 999 as Protocols }), UniverseChainId.Mainnet)

    expect(data.protocolVersion).toBeUndefined()
  })

  // GetPool serves the v4 dynamic-fee flag alongside the pool key's literal fee — the sentinel
  // V4Pool construction requires — so the parser passes both straight through.
  it('carries a dynamic-fee v4 pool through unchanged', () => {
    const data = parseLiquidityServicePool(
      poolSummary({ feeTier: DYNAMIC_FEE_AMOUNT, isDynamicFee: true, tickSpacing: 200 }),
      UniverseChainId.Mainnet,
    )

    expect(data.feeTier?.feeAmount).toBe(8_388_608)
    expect(data.feeTier?.feeAmount).toBe(DYNAMIC_FEE_AMOUNT)
    expect(data.feeTier?.tickSpacing).toBe(200)
    expect(data.feeTier?.isDynamic).toBe(true)
  })

  it('passes the served current LP fee through, unset when the backend has none', () => {
    const dynamic = { feeTier: DYNAMIC_FEE_AMOUNT, isDynamicFee: true, tickSpacing: 200 }
    expect(
      parseLiquidityServicePool(poolSummary({ ...dynamic, currentLpFee: 7000 }), UniverseChainId.Mainnet)
        .currentLpFeePips,
    ).toBe(7000)
    expect(parseLiquidityServicePool(poolSummary(dynamic), UniverseChainId.Mainnet).currentLpFeePips).toBeUndefined()
  })

  // V2 has no onchain fee tier — the backend leaves it at the proto3 default 0, so we backfill the
  // protocol's constant 0.30%.
  it('backfills the v2 default fee tier for a v2 pair whose served tier is 0', () => {
    const data = parseLiquidityServicePool(
      poolSummary({ protocolVersion: Protocols.V2, feeTier: 0 }),
      UniverseChainId.Mainnet,
    )

    expect(data.feeTier?.feeAmount).toBe(V2_DEFAULT_FEE_TIER)
    expect(data.feeTier?.isDynamic).toBe(false)
  })

  // Regression: a v4 pool whose swap fee is taken by a hook has a legitimate 0 static tier. `feeTier`
  // is a plain proto3 scalar (absent === 0), so the old `|| V2_DEFAULT_FEE_TIER` fabricated a 0.30%
  // tier for these pools and inflated every fee/APR/24h-fee figure derived from it.
  it('trusts a served 0 fee tier for a v4 pool instead of fabricating the v2 default', () => {
    const data = parseLiquidityServicePool(
      poolSummary({ protocolVersion: Protocols.V4, feeTier: 0, isDynamicFee: false }),
      UniverseChainId.Mainnet,
    )

    expect(data.feeTier?.feeAmount).toBe(0)
    expect(data.feeTier?.isDynamic).toBe(false)
  })

  // True-optional on the wire: an absent value means "unavailable", and the FE never computes one,
  // so it must not collapse to 0 — a served 0 is the real fee-switch-off value.
  it('flags token0 as the quote only when the backend serves it as the quote token', () => {
    const token0 = '0x1111111111111111111111111111111111111111'
    const token1 = '0x2222222222222222222222222222222222222222'
    expect(
      parseLiquidityServicePool(poolSummary({ quoteTokenAddress: token0 }), UniverseChainId.Mainnet).isToken0Quote,
    ).toBe(true)
    expect(
      parseLiquidityServicePool(poolSummary({ quoteTokenAddress: token1 }), UniverseChainId.Mainnet).isToken0Quote,
    ).toBe(false)
    expect(parseLiquidityServicePool(poolSummary(), UniverseChainId.Mainnet).isToken0Quote).toBe(false)
  })

  it('carries the served protocol fee and distinguishes a served 0 from an absent one', () => {
    expect(parseLiquidityServicePool(poolSummary({ protocolFee: 500 }), UniverseChainId.Mainnet).protocolFeePips).toBe(
      500,
    )
    expect(parseLiquidityServicePool(poolSummary({ protocolFee: 0 }), UniverseChainId.Mainnet).protocolFeePips).toBe(0)
    expect(parseLiquidityServicePool(poolSummary(), UniverseChainId.Mainnet).protocolFeePips).toBeUndefined()
  })

  it('carries the backend-served fee and total APRs, and leaves them unset when unserved', () => {
    const served = parseLiquidityServicePool(poolSummary({ apr: 4.5, totalApr: 6.25 }), UniverseChainId.Mainnet)
    expect(served.apr).toBe(4.5)
    expect(served.totalApr).toBe(6.25)

    const unserved = parseLiquidityServicePool(poolSummary(), UniverseChainId.Mainnet)
    expect(unserved.apr).toBeUndefined()
    expect(unserved.totalApr).toBeUndefined()
  })

  describe('rewards', () => {
    const withRewards = (tokenRewards: PoolTokenRewards[]): PoolSummary => poolSummary({ tokenRewards })

    const usdcRewards = (overrides: Partial<PoolTokenRewards> = {}): PoolTokenRewards =>
      new PoolTokenRewards({
        token: new RewardToken({ chainId: 1, address: USDC, symbol: 'USDC', decimals: 6, isNative: false }),
        boostedApr: 4.5,
        campaigns: [
          new PoolCampaign({
            id: 'campaign-1',
            apr: 4.5,
            startTimestamp: 1234567890n,
            endTimestamp: 1234567990n,
            totalRewardAllocation: '1000000000',
            distributedRewards: '250000000',
          }),
        ],
        ...overrides,
      })

    it("maps the first reward token's boost and campaign window", () => {
      const { rewardsCampaign } = parseLiquidityServicePool(withRewards([usdcRewards()]), UniverseChainId.Mainnet)

      expect(rewardsCampaign?.boostedApr).toBe(4.5)
      expect(rewardsCampaign?.id).toBe('campaign-1')
      expect(rewardsCampaign?.startTimestamp).toBe(1234567890)
      expect(rewardsCampaign?.endTimestamp).toBe(1234567990)
      expect(rewardsCampaign?.totalRewardAllocation).toBe('1000000000')
      expect(rewardsCampaign?.distributedRewards).toBe('250000000')
    })

    // The served token is what makes the raw amounts above interpretable: read at another token's
    // decimals they scale to a different figure entirely.
    it('denominates the campaign in the served reward token', () => {
      const { rewardsCampaign } = parseLiquidityServicePool(withRewards([usdcRewards()]), UniverseChainId.Mainnet)

      expect(rewardsCampaign?.token?.symbol).toBe('USDC')
      expect(rewardsCampaign?.token?.decimals).toBe(6)
      expect(rewardsCampaign?.token?.chainId).toBe(UniverseChainId.Mainnet)
    })

    // The reward token lives on its own distribution chain, which need not be the pool's.
    it('keeps the reward token on its own chain', () => {
      const arbUsdc = new RewardToken({ chainId: 42161, address: USDC, symbol: 'USDC', decimals: 6, isNative: false })
      const { rewardsCampaign } = parseLiquidityServicePool(
        withRewards([usdcRewards({ token: arbUsdc })]),
        UniverseChainId.Mainnet,
      )

      expect(rewardsCampaign?.token?.chainId).toBe(UniverseChainId.ArbitrumOne)
    })

    it('resolves a native reward token to the chain native currency', () => {
      const native = new RewardToken({ chainId: 1, address: ZERO_ADDRESS, symbol: 'ETH', isNative: true })
      const { rewardsCampaign } = parseLiquidityServicePool(
        withRewards([usdcRewards({ token: native })]),
        UniverseChainId.Mainnet,
      )

      expect(rewardsCampaign?.token?.isNative).toBe(true)
      expect(rewardsCampaign?.token?.chainId).toBe(UniverseChainId.Mainnet)
    })

    // Falling back to a stand-in token here would scale the amounts by the wrong decimals, so the
    // campaign stays for its APR — but its raw allocation goes with the token that made it readable.
    it('drops the token and its raw allocation when the served token is unusable', () => {
      const noDecimals = new RewardToken({ chainId: 1, address: USDC, symbol: 'USDC', isNative: false })
      const { rewardsCampaign } = parseLiquidityServicePool(
        withRewards([usdcRewards({ token: noDecimals })]),
        UniverseChainId.Mainnet,
      )

      expect(rewardsCampaign?.boostedApr).toBe(4.5)
      expect(rewardsCampaign?.token).toBeUndefined()
      expect(rewardsCampaign?.totalRewardAllocation).toBeUndefined()
      expect(rewardsCampaign?.distributedRewards).toBeUndefined()
    })

    it('drops the raw amounts when the reward token is on a chain the app has no support for', () => {
      const unsupported = new RewardToken({ chainId: 9999, address: USDC, symbol: 'USDC', decimals: 6 })
      const { rewardsCampaign } = parseLiquidityServicePool(
        withRewards([usdcRewards({ token: unsupported })]),
        UniverseChainId.Mainnet,
      )

      expect(rewardsCampaign?.boostedApr).toBe(4.5)
      expect(rewardsCampaign?.totalRewardAllocation).toBeUndefined()
      expect(rewardsCampaign?.distributedRewards).toBeUndefined()
    })

    it('drops a token whose campaigns have all ended', () => {
      const { rewardsCampaign } = parseLiquidityServicePool(
        withRewards([usdcRewards({ boostedApr: 0 })]),
        UniverseChainId.Mainnet,
      )

      expect(rewardsCampaign).toBeUndefined()
    })

    it('has no campaign when the pool runs none', () => {
      expect(parseLiquidityServicePool(withRewards([]), UniverseChainId.Mainnet).rewardsCampaign).toBeUndefined()
    })

    // rewardsCampaign collapses to the first token; rewardTokens serves every one through, for the
    // surfaces that list a boost per token rather than a single figure.
    it('carries every reward token, not just the first', () => {
      const daiRewards = usdcRewards({
        token: new RewardToken({ chainId: 1, address: DAI, symbol: 'DAI', decimals: 18, isNative: false }),
        boostedApr: 1.25,
      })

      const { rewardTokens } = parseLiquidityServicePool(
        withRewards([usdcRewards(), daiRewards]),
        UniverseChainId.Mainnet,
      )

      expect(rewardTokens?.map((reward) => [reward.token?.symbol, reward.boostedApr])).toEqual([
        ['USDC', 4.5],
        ['DAI', 1.25],
      ])
    })
  })
})
