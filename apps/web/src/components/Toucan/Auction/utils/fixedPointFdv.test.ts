import { priceToQ96WithDecimals, Q96, rawAmountToQ96 } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import {
  approximateNumberFromRaw,
  computeFdvBidTokenRaw,
  formatCompactFromRaw,
  formatTokenAmountWithSymbol,
} from '~/components/Toucan/Auction/utils/fixedPointFdv'

describe('fixedPointFdv', () => {
  describe('computeFdvBidTokenRaw', () => {
    it('computes FDV raw exactly for typical sizes', () => {
      const bidTokenDecimals = 18
      const auctionTokenDecimals = 18

      const priceRaw = 1_500_000_000_000_000_000n // 1.5 bidToken per auctionToken
      const priceQ96 = rawAmountToQ96(priceRaw, bidTokenDecimals)

      const totalSupplyRaw = 1_000_000n * 10n ** 18n // 1,000,000 tokens

      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96,
        bidTokenDecimals,
        totalSupplyRaw,
        auctionTokenDecimals,
      })

      const expected = (priceRaw * totalSupplyRaw) / 10n ** 18n
      expect(fdvRaw).toBe(expected)
    })

    it('does not lose precision for very large total supplies', () => {
      const bidTokenDecimals = 18
      const auctionTokenDecimals = 18

      const priceRaw = 123_456_789_012_345_678n // 0.123456789012345678
      const priceQ96 = rawAmountToQ96(priceRaw, bidTokenDecimals)

      const totalSupplyRaw = 9_876_543_210_987_654_321_098_765_432_109_876_543n

      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96,
        bidTokenDecimals,
        totalSupplyRaw,
        auctionTokenDecimals,
      })

      const expected = (priceRaw * totalSupplyRaw) / 10n ** 18n

      // The Q96 encoding introduces a tiny rounding error (~10^-26 relative error).
      // For very large values, check that the result is within 0.01% of expected.
      const tolerance = expected / 10000n // 0.01%
      const diff = fdvRaw > expected ? fdvRaw - expected : expected - fdvRaw
      expect(diff).toBeLessThan(tolerance)
    })

    it('computes correct FDV for USDC (6 decimals) bid token with 18-decimal auction token', () => {
      // This tests the decimal mismatch case that was previously broken.
      // Q96 encodes the price as bidTokenRaw / auctionTokenRaw.
      // For 0.10 USDC per auction token:
      // - Bid token (USDC): 6 decimals, so 0.10 USDC = 100_000 raw
      // - Auction token: 18 decimals, so 1 token = 10^18 raw
      // - Q96 price = (100_000 / 10^18) * 2^96 ≈ 7.92 × 10^15

      const priceQ96 = 7922816251426434n // ~0.10 USDC per auction token in Q96
      const totalSupplyRaw = 1000n * 10n ** 18n // 1000 auction tokens (18 decimals)
      const auctionTokenDecimals = 18
      const bidTokenDecimals = 6

      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96,
        bidTokenDecimals,
        totalSupplyRaw,
        auctionTokenDecimals,
      })

      // Expected: 1000 tokens × 0.10 USDC/token = 100 USDC = 100 × 10^6 = 100_000_000 raw
      // Due to Q96 precision, we check within a reasonable tolerance
      expect(fdvRaw).toBeGreaterThan(99_000_000n)
      expect(fdvRaw).toBeLessThan(101_000_000n)
    })

    it('computes correct FDV using direct Q96 formula', () => {
      // Verify the direct formula: FDV = (priceQ96 × totalSupply + Q96/2) / Q96
      // For any decimal combination, this should work because Q96 already encodes
      // the decimal relationship.

      const totalSupplyRaw = 10n ** 21n // 1000 tokens with 18 decimals
      // Create a Q96 price that represents 0.10 bid-token per auction-token
      // priceQ96 = (bidTokenRaw / auctionTokenRaw) × Q96
      // For 0.10: bidTokenRaw = 10^5 (for USDC), auctionTokenRaw = 10^18
      // priceQ96 = (10^5 / 10^18) × Q96 = 10^5 × Q96 / 10^18
      const priceQ96 = (100_000n * Q96) / 10n ** 18n

      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96,
        totalSupplyRaw,
        auctionTokenDecimals: 18,
      })

      // Expected: (priceQ96 × totalSupply) / Q96 = 100_000 × 1000 = 100_000_000 raw USDC
      expect(fdvRaw).toBe(100_000_000n)
    })

    it('computes correct FDV for WBTC (8 decimals) bid token with 18-decimal auction token', () => {
      // WBTC has 8 decimals
      // Price: 0.001 WBTC per auction token = 100_000 raw (8 decimals)
      // Total supply: 100,000 auction tokens (18 decimals)
      // Expected FDV: 100,000 × 0.001 = 100 WBTC = 10_000_000_000 raw (8 decimals)
      //
      // Q96 encodes: bid_token_raw per auction_token_raw
      // priceQ96 = (100_000 / 10^18) × 2^96

      const auctionTokenDecimals = 18

      const priceRaw = 100_000n // 0.001 WBTC in 8 decimal raw units
      // Use priceToQ96WithDecimals which accounts for auction token decimals
      const priceQ96 = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

      const totalSupplyRaw = 100_000n * 10n ** 18n // 100,000 auction tokens

      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96,
        totalSupplyRaw,
        auctionTokenDecimals,
      })

      // Expected: 100,000 × 100,000 raw WBTC = 10,000,000,000 raw
      const expected = 10_000_000_000n
      const tolerance = expected / 10000n // 0.01%
      const diff = fdvRaw > expected ? fdvRaw - expected : expected - fdvRaw
      expect(diff).toBeLessThan(tolerance)
    })

    it('computes correct FDV for same low decimals (6-6)', () => {
      // Both tokens with 6 decimals (e.g., USDC auction token)
      // Price: 1.0 USDC per auction token = 1_000_000 raw
      // Total supply: 1000 auction tokens (6 decimals)
      // Expected FDV: 1000 × 1.0 = 1000 USDC = 1_000_000_000 raw
      //
      // Q96 encodes: bid_token_raw per auction_token_raw
      // priceQ96 = (1_000_000 / 10^6) × 2^96

      const auctionTokenDecimals = 6

      const priceRaw = 1_000_000n // 1.0 USDC
      const priceQ96 = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

      const totalSupplyRaw = 1000n * 10n ** 6n // 1000 auction tokens with 6 decimals

      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96,
        totalSupplyRaw,
        auctionTokenDecimals,
      })

      // Expected: 1000 × 1_000_000 = 1_000_000_000 raw
      const expected = 1_000_000_000n
      const tolerance = expected / 10000n
      const diff = fdvRaw > expected ? fdvRaw - expected : expected - fdvRaw
      expect(diff).toBeLessThan(tolerance)
    })

    it('computes correct FDV for inverted decimals (18-6) - ETH bidding on 6-decimal token', () => {
      // ETH (18 decimals) bidding on a 6-decimal auction token
      // Price: 0.001 ETH per auction token = 1_000_000_000_000_000 raw (18 decimals)
      // Total supply: 1,000,000 auction tokens (6 decimals)
      // Expected FDV: 1,000,000 × 0.001 = 1000 ETH = 1_000_000_000_000_000_000_000 raw
      //
      // Q96 encodes: bid_token_raw per auction_token_raw
      // priceQ96 = (1_000_000_000_000_000 / 10^6) × 2^96

      const auctionTokenDecimals = 6

      const priceRaw = 1_000_000_000_000_000n // 0.001 ETH
      const priceQ96 = priceToQ96WithDecimals({ priceRaw, auctionTokenDecimals })

      const totalSupplyRaw = 1_000_000n * 10n ** 6n // 1,000,000 auction tokens with 6 decimals

      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96,
        totalSupplyRaw,
        auctionTokenDecimals,
      })

      // Expected: 1,000,000 × 1_000_000_000_000_000 = 1_000_000_000_000_000_000_000 raw
      const expected = 1_000_000_000_000_000_000_000n
      const tolerance = expected / 10000n
      const diff = fdvRaw > expected ? fdvRaw - expected : expected - fdvRaw
      expect(diff).toBeLessThan(tolerance)
    })

    it('returns 0 when auctionTokenDecimals is undefined', () => {
      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96: Q96,
        totalSupplyRaw: 1000n,
        auctionTokenDecimals: undefined,
      })

      expect(fdvRaw).toBe(0n)
    })

    it('handles zero total supply', () => {
      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96: Q96,
        totalSupplyRaw: 0n,
        auctionTokenDecimals: 18,
      })

      expect(fdvRaw).toBe(0n)
    })

    it('handles zero price', () => {
      const fdvRaw = computeFdvBidTokenRaw({
        priceQ96: 0n,
        totalSupplyRaw: 1_000_000_000_000_000_000_000n,
        auctionTokenDecimals: 18,
      })

      expect(fdvRaw).toBe(0n)
    })
  })

  describe('formatCompactFromRaw', () => {
    it('formats without suffix under 1K', () => {
      expect(formatCompactFromRaw({ raw: 999n, decimals: 0 })).toBe('999')
    })

    it('formats K/M/B suffixes with rounding', () => {
      expect(formatCompactFromRaw({ raw: 1_000n, decimals: 0 })).toBe('1K')
      expect(formatCompactFromRaw({ raw: 1_234n, decimals: 0 })).toBe('1.23K')
      expect(formatCompactFromRaw({ raw: 1_000_000n, decimals: 0 })).toBe('1M')
      expect(formatCompactFromRaw({ raw: 1_234_567_890n, decimals: 0 })).toBe('1.23B')
    })

    it('respects token decimals', () => {
      // 1,234.0 units with 6 decimals => 1.23K
      expect(formatCompactFromRaw({ raw: 1_234_000_000n, decimals: 6 })).toBe('1.23K')
    })
  })

  describe('approximateNumberFromRaw', () => {
    it('returns a finite approximation for large values', () => {
      const raw = 1_500_000n * 10n ** 18n
      const approx = approximateNumberFromRaw({ raw, decimals: 18 })
      expect(Number.isFinite(approx)).toBe(true)
      expect(approx).toBeGreaterThan(1_000_000)
      expect(approx).toBeLessThan(2_000_000)
    })
  })

  describe('formatTokenAmountWithSymbol', () => {
    describe('abbreviated values (K/M/B/T)', () => {
      it('shows exactly 3 decimal places for K suffix', () => {
        // 1,234 USDC (6 decimals) = 1.234K
        const result = formatTokenAmountWithSymbol({
          raw: 1_234_000_000n, // 1,234 USDC
          decimals: 6,
          symbol: 'USDC',
          isStablecoin: true,
        })
        expect(result).toBe('1.234K USDC')
      })

      it('shows exactly 3 decimal places with trailing zeros for K suffix', () => {
        // 1,200 USDC should show 1.200K, not 1.2K
        const result = formatTokenAmountWithSymbol({
          raw: 1_200_000_000n, // 1,200 USDC
          decimals: 6,
          symbol: 'USDC',
          isStablecoin: true,
        })
        expect(result).toBe('1.200K USDC')
      })

      it('shows exactly 3 decimal places for M suffix', () => {
        // 1,234,567 USDC = 1.234M (rounded)
        const result = formatTokenAmountWithSymbol({
          raw: 1_234_567_000_000n, // 1,234,567 USDC
          decimals: 6,
          symbol: 'USDC',
          isStablecoin: true,
        })
        expect(result).toBe('1.235M USDC')
      })

      it('shows exactly 3 decimal places with trailing zeros for M suffix', () => {
        // 1,000,000 USDC = 1.000M, not 1M
        const result = formatTokenAmountWithSymbol({
          raw: 1_000_000_000_000n, // 1,000,000 USDC
          decimals: 6,
          symbol: 'USDC',
          isStablecoin: true,
        })
        expect(result).toBe('1.000M USDC')
      })

      it('applies same 3-decimal rule to non-stablecoins when abbreviated', () => {
        // 1,200 ETH (18 decimals) = 1.200K ETH
        const result = formatTokenAmountWithSymbol({
          raw: 1_200n * 10n ** 18n, // 1,200 ETH
          decimals: 18,
          symbol: 'ETH',
          isStablecoin: false,
        })
        expect(result).toBe('1.200K ETH')
      })

      it('formats billions correctly', () => {
        // 1,234,567,890 USDC = 1.235B
        const result = formatTokenAmountWithSymbol({
          raw: 1_234_567_890_000_000n, // 1,234,567,890 USDC
          decimals: 6,
          symbol: 'USDC',
          isStablecoin: true,
        })
        expect(result).toBe('1.235B USDC')
      })
    })

    describe('non-abbreviated stablecoins', () => {
      it('shows exactly 2 decimal places', () => {
        // 123.45 USDC
        const result = formatTokenAmountWithSymbol({
          raw: 123_450_000n, // 123.45 USDC
          decimals: 6,
          symbol: 'USDC',
          isStablecoin: true,
        })
        expect(result).toBe('123.45 USDC')
      })

      it('shows trailing zeros to maintain 2 decimal places', () => {
        // 123.00 USDC, not 123 USDC
        const result = formatTokenAmountWithSymbol({
          raw: 123_000_000n, // 123.00 USDC
          decimals: 6,
          symbol: 'USDC',
          isStablecoin: true,
        })
        expect(result).toBe('123.00 USDC')
      })

      it('shows trailing zero for single decimal', () => {
        // 123.40 USDC, not 123.4 USDC
        const result = formatTokenAmountWithSymbol({
          raw: 123_400_000n, // 123.40 USDC
          decimals: 6,
          symbol: 'USDC',
          isStablecoin: true,
        })
        expect(result).toBe('123.40 USDC')
      })

      it('handles values just under 1000 (threshold for K)', () => {
        // 999.99 USDC - should NOT be abbreviated
        const result = formatTokenAmountWithSymbol({
          raw: 999_990_000n, // 999.99 USDC
          decimals: 6,
          symbol: 'USDC',
          isStablecoin: true,
        })
        expect(result).toBe('999.99 USDC')
      })
    })

    describe('non-abbreviated other tokens', () => {
      it('shows exactly 5 decimal places', () => {
        // 123.45678 ETH
        const result = formatTokenAmountWithSymbol({
          raw: 123_456_780_000_000_000_000n, // 123.45678 ETH
          decimals: 18,
          symbol: 'ETH',
          isStablecoin: false,
        })
        expect(result).toBe('123.45678 ETH')
      })

      it('shows trailing zeros to maintain 5 decimal places', () => {
        // 123.40000 ETH (not 123.4 ETH)
        const result = formatTokenAmountWithSymbol({
          raw: 123_400_000_000_000_000_000n, // 123.4 ETH
          decimals: 18,
          symbol: 'ETH',
          isStablecoin: false,
        })
        expect(result).toBe('123.40000 ETH')
      })

      it('shows whole numbers with 5 decimal places', () => {
        // 123.00000 ETH (not 123 ETH)
        const result = formatTokenAmountWithSymbol({
          raw: 123n * 10n ** 18n, // 123 ETH
          decimals: 18,
          symbol: 'ETH',
          isStablecoin: false,
        })
        expect(result).toBe('123.00000 ETH')
      })
    })

    describe('sub-threshold handling', () => {
      it('shows <0.01 for stablecoins below threshold', () => {
        // 0.005 USDC - below 0.01 threshold
        const result = formatTokenAmountWithSymbol({
          raw: 5_000n, // 0.005 USDC
          decimals: 6,
          symbol: 'USDC',
          isStablecoin: true,
        })
        expect(result).toBe('<0.01 USDC')
      })

      it('shows <0.00001 for other tokens below threshold', () => {
        // 0.000005 ETH - below 0.00001 threshold
        const result = formatTokenAmountWithSymbol({
          raw: 5_000_000_000_000n, // 0.000005 ETH
          decimals: 18,
          symbol: 'ETH',
          isStablecoin: false,
        })
        expect(result).toBe('<0.00001 ETH')
      })

      it('shows actual value at exactly the threshold for stablecoins', () => {
        // 0.01 USDC - exactly at threshold, should show actual value
        const result = formatTokenAmountWithSymbol({
          raw: 10_000n, // 0.01 USDC
          decimals: 6,
          symbol: 'USDC',
          isStablecoin: true,
        })
        expect(result).toBe('0.01 USDC')
      })

      it('shows actual value at exactly the threshold for other tokens', () => {
        // 0.00001 ETH - exactly at threshold
        const result = formatTokenAmountWithSymbol({
          raw: 10_000_000_000_000n, // 0.00001 ETH
          decimals: 18,
          symbol: 'ETH',
          isStablecoin: false,
        })
        expect(result).toBe('0.00001 ETH')
      })
    })

    describe('edge cases', () => {
      it('handles zero value', () => {
        const result = formatTokenAmountWithSymbol({
          raw: 0n,
          decimals: 6,
          symbol: 'USDC',
          isStablecoin: true,
        })
        expect(result).toBe('0 USDC')
      })

      it('handles very large values (trillions)', () => {
        // 1.234 trillion USDC
        const result = formatTokenAmountWithSymbol({
          raw: 1_234_000_000_000_000_000n, // 1.234T USDC
          decimals: 6,
          symbol: 'USDC',
          isStablecoin: true,
        })
        expect(result).toBe('1.234T USDC')
      })

      it('defaults isStablecoin to false when not provided', () => {
        // Should use exactly 5 decimal places for non-abbreviated (defaults to non-stablecoin)
        const result = formatTokenAmountWithSymbol({
          raw: 123_400_000_000_000_000_000n, // 123.4 ETH with trailing zeros
          decimals: 18,
          symbol: 'ETH',
        })
        expect(result).toBe('123.40000 ETH')
      })
    })
  })
})
