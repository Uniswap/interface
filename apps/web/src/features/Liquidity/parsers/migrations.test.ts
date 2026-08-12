import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { describe, expect, it } from 'vitest'
import { applyUrlMigrations } from '~/features/Liquidity/parsers/migrations'

describe('applyUrlMigrations', () => {
  describe('migrateFee', () => {
    describe('standard V3 fee tiers (preserve existing behavior)', () => {
      it.each([
        [FeeAmount.LOWEST, TICK_SPACINGS[FeeAmount.LOWEST]],
        [FeeAmount.LOW_200, TICK_SPACINGS[FeeAmount.LOW_200]],
        [FeeAmount.LOW_300, TICK_SPACINGS[FeeAmount.LOW_300]],
        [FeeAmount.LOW_400, TICK_SPACINGS[FeeAmount.LOW_400]],
        [FeeAmount.LOW, TICK_SPACINGS[FeeAmount.LOW]],
        [FeeAmount.MEDIUM, TICK_SPACINGS[FeeAmount.MEDIUM]],
        [FeeAmount.HIGH, TICK_SPACINGS[FeeAmount.HIGH]],
      ])('maps standard feeTier=%i to canonical tickSpacing=%i', (feeAmount, expectedTickSpacing) => {
        const result = applyUrlMigrations({ feeTier: String(feeAmount), isDynamic: false })

        expect(result).not.toBeNull()
        expect(result?.updatedParams.fee).toEqual({
          feeAmount,
          tickSpacing: expectedTickSpacing,
          isDynamic: false,
        })
        expect(result?.clearParams).toEqual(expect.arrayContaining(['feeTier', 'isDynamic']))
      })

      it('propagates isDynamic=true for standard fee tiers', () => {
        const result = applyUrlMigrations({ feeTier: String(FeeAmount.LOW), isDynamic: true })

        expect(result?.updatedParams.fee).toEqual({
          feeAmount: FeeAmount.LOW,
          tickSpacing: TICK_SPACINGS[FeeAmount.LOW],
          isDynamic: true,
        })
      })
    })

    describe('non-standard V4 fee tiers (regression: previously coerced to tickSpacing=60)', () => {
      // tickSpacing = max(round(2 * feeAmount / 100), 1)
      it.each([
        // feeAmount, expectedTickSpacing
        [1000, 20], // 0.10% — exact reproduction case from issue
        [1500, 30],
        [2000, 40],
        [2500, 50],
        [4000, 80],
        [7500, 150],
        [250, 5],
        [333, 7],
        [50, 1], // very small, but >= 1
        [1, 1], // floor at 1
      ])(
        'derives tickSpacing=%2$i from non-standard feeTier=%1$i instead of falling back to 60',
        (feeAmount, expectedTickSpacing) => {
          const result = applyUrlMigrations({ feeTier: String(feeAmount), isDynamic: false })

          expect(result?.updatedParams.fee?.tickSpacing).toBe(expectedTickSpacing)
          expect(result?.updatedParams.fee?.feeAmount).toBe(feeAmount)
        },
      )

      it('does not coerce custom V4 fee tier 1000 to MEDIUM tick spacing of 60', () => {
        const result = applyUrlMigrations({ feeTier: '1000', isDynamic: false })

        // Regression guard: previous implementation fell through to TICK_SPACINGS[FeeAmount.MEDIUM] = 60
        // for any feeTier not present in TICK_SPACINGS.
        expect(result?.updatedParams.fee?.tickSpacing).not.toBe(60)
        expect(result?.updatedParams.fee?.tickSpacing).toBe(20)
      })

      it('preserves isDynamic flag for custom fee tiers', () => {
        const result = applyUrlMigrations({ feeTier: '1000', isDynamic: true })

        expect(result?.updatedParams.fee).toEqual({
          feeAmount: 1000,
          tickSpacing: 20,
          isDynamic: true,
        })
      })

      it('handles isDynamic=undefined as false (legacy URLs without the flag)', () => {
        const result = applyUrlMigrations({ feeTier: '1000' })

        expect(result?.updatedParams.fee?.isDynamic).toBe(false)
      })
    })

    it('returns null when no feeTier present and no other migrations apply', () => {
      const result = applyUrlMigrations({})

      expect(result).toBeNull()
    })

    it('does not migrate when feeTier is empty string', () => {
      const result = applyUrlMigrations({ feeTier: '' })

      expect(result).toBeNull()
    })
  })

  describe('migrateCurrency', () => {
    it('migrates lowercase currencya to currencyA when currencyA is empty', () => {
      const result = applyUrlMigrations({
        currencya: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      })

      expect(result?.updatedParams.currencyA).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
      expect(result?.clearParams).toContain('currencya')
    })

    it('migrates lowercase currencyb to currencyB when currencyB is empty', () => {
      const result = applyUrlMigrations({
        currencyb: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      })

      expect(result?.updatedParams.currencyB).toBe('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
      expect(result?.clearParams).toContain('currencyb')
    })

    it('does not overwrite currencyA when both currencyA and currencya are present', () => {
      const result = applyUrlMigrations({
        currencyA: '0xNew',
        currencya: '0xOld',
      })

      expect(result?.updatedParams.currencyA).toBeUndefined()
    })
  })

  describe('combined migrations', () => {
    it('applies both fee and currency migrations together and collects clearParams without duplicates', () => {
      const result = applyUrlMigrations({
        feeTier: '1000',
        isDynamic: true,
        currencya: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        currencyb: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      })

      expect(result?.updatedParams.fee).toEqual({
        feeAmount: 1000,
        tickSpacing: 20,
        isDynamic: true,
      })
      expect(result?.updatedParams.currencyA).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
      expect(result?.updatedParams.currencyB).toBe('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')

      // clearParams should be deduplicated
      const uniqueClearParams = new Set(result?.clearParams)
      expect(uniqueClearParams.size).toBe(result?.clearParams.length)
      expect(uniqueClearParams).toEqual(new Set(['feeTier', 'isDynamic', 'currencya', 'currencyb']))
    })
  })
})
