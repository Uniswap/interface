import { isWalletJustFunded } from 'wallet/src/features/telemetry/utils/walletFundingDetector'

describe('detectWalletFunding', () => {
  it('should return true when wallet transitions from unfunded to funded', () => {
    const result = isWalletJustFunded({
      wasAlreadyFunded: false,
      currentTotalBalance: 100,
    })
    expect(result).toBe(true)
  })

  it('should return false when wallet was already funded', () => {
    const result = isWalletJustFunded({
      wasAlreadyFunded: true,
      currentTotalBalance: 100,
    })
    expect(result).toBe(false)
  })

  it('should return false when wallet is still unfunded', () => {
    const result = isWalletJustFunded({
      wasAlreadyFunded: false,
      currentTotalBalance: 0,
    })
    expect(result).toBe(false)
  })

  it('should return false when wallet was funded and balance increases', () => {
    const result = isWalletJustFunded({
      wasAlreadyFunded: true,
      currentTotalBalance: 200,
    })
    expect(result).toBe(false)
  })
})
