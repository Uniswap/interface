import {
  calculateTickQ96,
  fromQ96ToDecimal,
  fromQ96ToDecimalWithTokenDecimals,
  priceToQ96WithDecimals,
  Q96,
  q96ToDecimalString,
  q96ToPriceString,
  rawAmountToQ96,
} from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'

// Re-export q96ToRawAmount for testing since it's not directly exported
// We test it indirectly through q96ToDecimalString and the round-trip tests

describe('q96', () => {
  describe('Q96 constant', () => {
    it('is 2^96', () => {
      expect(Q96).toBe(2n ** 96n)
    })
  })

  describe('fromQ96ToDecimal', () => {
    it('converts Q96 value representing 1.0 to 1.0', () => {
      const q96One = Q96 // 1.0 in Q96 format
      expect(fromQ96ToDecimal(q96One)).toBeCloseTo(1.0, 10)
    })

    it('converts Q96 value representing 0.5 to 0.5', () => {
      const q96Half = Q96 / 2n
      expect(fromQ96ToDecimal(q96Half)).toBeCloseTo(0.5, 10)
    })

    it('converts Q96 value representing 1.5 to 1.5', () => {
      const q96OneAndHalf = Q96 + Q96 / 2n
      expect(fromQ96ToDecimal(q96OneAndHalf)).toBeCloseTo(1.5, 10)
    })

    it('handles string input', () => {
      const q96One = Q96.toString()
      expect(fromQ96ToDecimal(q96One)).toBeCloseTo(1.0, 10)
    })

    it('handles zero', () => {
      expect(fromQ96ToDecimal(0n)).toBe(0)
    })
  })

  describe('q96ToPriceString - decimal combination tests', () => {
    // Test Case 1: ETH-18 (18-18 decimals) - most common
    describe('18-18 decimals (ETH bid, standard auction token)', () => {
      const bidTokenDecimals = 18
      const auctionTokenDecimals = 18

      it('converts 1.5 price correctly', () => {
        // 1.5 ETH = 1.5 * 10^18 raw
        const priceRaw = 1_500_000_000_000_000_000n
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('1.5')
      })

      it('converts 0.001 price correctly', () => {
        const priceRaw = 1_000_000_000_000_000n // 0.001 ETH
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('0.001')
      })

      it('converts 100.0 price correctly', () => {
        const priceRaw = 100_000_000_000_000_000_000n // 100 ETH
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('100')
      })
    })

    // Test Case 2: USDC-18 (6-18 decimals) - stablecoins
    describe('6-18 decimals (USDC bid, standard auction token)', () => {
      const bidTokenDecimals = 6
      const auctionTokenDecimals = 18

      it('converts 0.10 price correctly', () => {
        // 0.10 USDC = 100_000 raw (6 decimals)
        const priceRaw = 100_000n
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('0.1')
      })

      it('converts 1.0 price correctly', () => {
        const priceRaw = 1_000_000n // 1.0 USDC
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('1')
      })

      it('converts 0.000001 price correctly', () => {
        const priceRaw = 1n // smallest USDC unit
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('0.000001')
      })

      it('converts 100.50 price correctly', () => {
        const priceRaw = 100_500_000n // 100.50 USDC
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('100.5')
      })
    })

    // Test Case 3: WBTC-18 (8-18 decimals) - Bitcoin wrapped
    describe('8-18 decimals (WBTC bid, standard auction token)', () => {
      const bidTokenDecimals = 8
      const auctionTokenDecimals = 18

      it('converts 0.00025 price correctly', () => {
        // 0.00025 WBTC = 25_000 raw (8 decimals)
        const priceRaw = 25_000n
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('0.00025')
      })

      it('converts 0.001 price correctly', () => {
        const priceRaw = 100_000n // 0.001 WBTC
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('0.001')
      })

      it('converts 1.0 price correctly', () => {
        const priceRaw = 100_000_000n // 1.0 WBTC
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('1')
      })
    })

    // Test Case 4: USDC-6 (6-6 decimals) - same low decimals
    describe('6-6 decimals (USDC bid, 6-decimal auction token)', () => {
      const bidTokenDecimals = 6
      const auctionTokenDecimals = 6

      it('converts 0.10 price correctly', () => {
        const priceRaw = 100_000n // 0.10 USDC
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('0.1')
      })

      it('converts 1.0 price correctly', () => {
        const priceRaw = 1_000_000n // 1.0 USDC
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('1')
      })

      it('converts 100.0 price correctly', () => {
        const priceRaw = 100_000_000n // 100.0 USDC
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('100')
      })
    })

    // Test Case 5: ETH-6 (18-6 decimals) - unusual case
    describe('18-6 decimals (ETH bid, 6-decimal auction token)', () => {
      const bidTokenDecimals = 18
      const auctionTokenDecimals = 6

      it('converts 1.5 price correctly', () => {
        const priceRaw = 1_500_000_000_000_000_000n // 1.5 ETH
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('1.5')
      })

      it('converts 0.001 price correctly', () => {
        const priceRaw = 1_000_000_000_000_000n // 0.001 ETH
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('0.001')
      })

      it('converts 0.0000001 price correctly', () => {
        const priceRaw = 100_000_000_000n // 0.0000001 ETH
        const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

        const result = q96ToPriceString({ q96Value, bidTokenDecimals, auctionTokenDecimals })
        expect(result).toBe('0.0000001')
      })
    })
  })

  describe('priceToQ96WithDecimals', () => {
    it('creates Q96 value for 18-decimal auction token', () => {
      const priceRaw = 1_000_000_000_000_000_000n // 1.0
      const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals: 18 })

      // Verify round-trip
      const result = q96ToPriceString({ q96Value, bidTokenDecimals: 18, auctionTokenDecimals: 18 })
      expect(result).toBe('1')
    })

    it('creates Q96 value for 6-decimal auction token', () => {
      const priceRaw = 100_000n // 0.1 USDC
      const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals: 6 })

      // Verify round-trip
      const result = q96ToPriceString({ q96Value, bidTokenDecimals: 6, auctionTokenDecimals: 6 })
      expect(result).toBe('0.1')
    })

    it('uses 18 decimals as default', () => {
      const priceRaw = 1_000_000_000_000_000_000n
      const q96WithDefault = priceToQ96WithDecimals({ priceRaw })
      const q96Explicit = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals: 18 })

      expect(q96WithDefault).toBe(q96Explicit)
    })
  })

  describe('fromQ96ToDecimalWithTokenDecimals', () => {
    it('falls back to fromQ96ToDecimal when decimals undefined', () => {
      const q96Value = Q96 // represents 1.0
      const result = fromQ96ToDecimalWithTokenDecimals({ q96Value })
      expect(result).toBeCloseTo(1.0, 10)
    })

    it('handles 6-18 decimal combination', () => {
      // 0.10 USDC per auction token
      const priceRaw = 100_000n
      const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals: 18 })

      const result = fromQ96ToDecimalWithTokenDecimals({
        q96Value,
        bidTokenDecimals: 6,
        auctionTokenDecimals: 18,
      })
      expect(result).toBeCloseTo(0.1, 5)
    })

    it('handles 18-18 decimal combination', () => {
      const priceRaw = 1_500_000_000_000_000_000n // 1.5 ETH
      const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals: 18 })

      const result = fromQ96ToDecimalWithTokenDecimals({
        q96Value,
        bidTokenDecimals: 18,
        auctionTokenDecimals: 18,
      })
      expect(result).toBeCloseTo(1.5, 10)
    })

    it('handles only bidTokenDecimals provided', () => {
      const q96Value = Q96
      const result = fromQ96ToDecimalWithTokenDecimals({
        q96Value,
        bidTokenDecimals: 18,
        auctionTokenDecimals: undefined,
      })
      expect(result).toBeCloseTo(1.0, 10)
    })

    it('returns 0 for non-finite parsed values', () => {
      // This should not normally happen, but test the safeguard
      const result = fromQ96ToDecimalWithTokenDecimals({
        q96Value: 0n,
        bidTokenDecimals: 18,
        auctionTokenDecimals: 18,
      })
      expect(result).toBe(0)
    })
  })

  describe('rawAmountToQ96', () => {
    it('converts raw amount to Q96 for 18 decimals', () => {
      const rawAmount = 1_000_000_000_000_000_000n // 1.0 in 18 decimals
      const q96Value = rawAmountToQ96(rawAmount, 18)

      // Should be approximately Q96
      const tolerance = Q96 / 10000n // 0.01%
      const diff = q96Value > Q96 ? q96Value - Q96 : Q96 - q96Value
      expect(diff).toBeLessThan(tolerance)
    })

    it('converts raw amount to Q96 for 6 decimals', () => {
      const rawAmount = 1_000_000n // 1.0 in 6 decimals
      const q96Value = rawAmountToQ96(rawAmount, 6)

      // Should be approximately Q96
      const tolerance = Q96 / 10000n
      const diff = q96Value > Q96 ? q96Value - Q96 : Q96 - q96Value
      expect(diff).toBeLessThan(tolerance)
    })

    it('handles string input', () => {
      const rawAmount = '1000000000000000000'
      const q96Value = rawAmountToQ96(rawAmount, 18)

      const tolerance = Q96 / 10000n
      const diff = q96Value > Q96 ? q96Value - Q96 : Q96 - q96Value
      expect(diff).toBeLessThan(tolerance)
    })
  })

  describe('q96ToDecimalString (deprecated)', () => {
    it('converts Q96 to decimal string with 18 decimals', () => {
      // Note: This function only works correctly for same-decimal scenarios
      const rawAmount = 1_500_000_000_000_000_000n // 1.5
      const q96Value = rawAmountToQ96(rawAmount, 18)

      const result = q96ToDecimalString(q96Value, 18)
      expect(result).toBe('1.5')
    })

    it('converts Q96 to decimal string with 6 decimals', () => {
      const rawAmount = 100_000n // 0.1 in 6 decimals
      const q96Value = rawAmountToQ96(rawAmount, 6)

      const result = q96ToDecimalString(q96Value, 6)
      expect(result).toBe('0.1')
    })
  })

  describe('calculateTickQ96', () => {
    it('calculates tick at offset 0 equals base price', () => {
      const basePriceQ96 = '1000000000000000000'
      const tickSizeQ96 = '100000000000000000'

      const result = calculateTickQ96({ basePriceQ96, tickSizeQ96, tickOffset: 0 })
      expect(result).toBe(basePriceQ96)
    })

    it('calculates tick at positive offset', () => {
      const basePriceQ96 = '1000000000000000000'
      const tickSizeQ96 = '100000000000000000'

      const result = calculateTickQ96({ basePriceQ96, tickSizeQ96, tickOffset: 5 })
      // 1000000000000000000 + 5 * 100000000000000000 = 1500000000000000000
      expect(result).toBe('1500000000000000000')
    })

    it('calculates tick at negative offset', () => {
      const basePriceQ96 = '1000000000000000000'
      const tickSizeQ96 = '100000000000000000'

      const result = calculateTickQ96({ basePriceQ96, tickSizeQ96, tickOffset: -3 })
      // 1000000000000000000 - 3 * 100000000000000000 = 700000000000000000
      expect(result).toBe('700000000000000000')
    })

    it('handles large Q96 values', () => {
      const basePriceQ96 = Q96.toString()
      const tickSizeQ96 = (Q96 / 100n).toString()

      const result = calculateTickQ96({ basePriceQ96, tickSizeQ96, tickOffset: 10 })
      const expected = Q96 + (Q96 / 100n) * 10n
      expect(result).toBe(expected.toString())
    })
  })

  describe('round-trip precision tests', () => {
    const testCases = [
      { bidDec: 18, auctionDec: 18, price: '1.5', raw: 1_500_000_000_000_000_000n },
      { bidDec: 18, auctionDec: 18, price: '0.001', raw: 1_000_000_000_000_000n },
      { bidDec: 6, auctionDec: 18, price: '0.1', raw: 100_000n },
      { bidDec: 6, auctionDec: 18, price: '100.5', raw: 100_500_000n },
      { bidDec: 8, auctionDec: 18, price: '0.00025', raw: 25_000n },
      { bidDec: 6, auctionDec: 6, price: '1', raw: 1_000_000n },
      { bidDec: 18, auctionDec: 6, price: '1.5', raw: 1_500_000_000_000_000_000n },
    ]

    testCases.forEach(({ bidDec, auctionDec, price, raw }) => {
      it(`round-trip: ${price} with ${bidDec}-${auctionDec} decimals`, () => {
        const q96Value = priceToQ96WithDecimals({ priceRaw: raw, auctionTokenDecimals: auctionDec })
        const result = q96ToPriceString({
          q96Value,
          bidTokenDecimals: bidDec,
          auctionTokenDecimals: auctionDec,
        })
        expect(result).toBe(price)
      })
    })
  })

  describe('edge cases', () => {
    it('handles zero Q96 value', () => {
      const result = q96ToPriceString({ q96Value: 0n, bidTokenDecimals: 18, auctionTokenDecimals: 18 })
      expect(result).toBe('0')
    })

    it('handles very small Q96 values', () => {
      // Smallest representable value for 18-18 decimals
      const priceRaw = 1n // 1 wei
      const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals: 18 })

      const result = q96ToPriceString({ q96Value, bidTokenDecimals: 18, auctionTokenDecimals: 18 })
      // Should be "0.000000000000000001" or very close
      expect(parseFloat(result)).toBeCloseTo(1e-18, 20)
    })

    it('handles very large Q96 values', () => {
      // Large price: 1 billion tokens
      const priceRaw = 1_000_000_000_000_000_000_000_000_000n // 10^27
      const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals: 18 })

      const result = q96ToPriceString({ q96Value, bidTokenDecimals: 18, auctionTokenDecimals: 18 })
      expect(result).toBe('1000000000')
    })

    it('handles string Q96 values', () => {
      const priceRaw = 100_000n
      const q96Value = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals: 18 })

      const result = q96ToPriceString({
        q96Value: q96Value.toString(),
        bidTokenDecimals: 6,
        auctionTokenDecimals: 18,
      })
      expect(result).toBe('0.1')
    })
  })
})
