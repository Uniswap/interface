import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import { shouldDisableConfirm } from 'wallet/src/features/dappRequests/utils/riskUtils'

describe('shouldDisableConfirm', () => {
  describe('signature requests (without gas fee check)', () => {
    it('should disable confirm when risk scan has not completed', () => {
      const result = shouldDisableConfirm({
        riskLevel: null,
        confirmedRisk: false,
      })

      expect(result).toBe(true)
    })

    it('should disable confirm when there is an unconfirmed critical risk', () => {
      const result = shouldDisableConfirm({
        riskLevel: TransactionRiskLevel.Critical,
        confirmedRisk: false,
      })

      expect(result).toBe(true)
    })

    it('should enable confirm when critical risk is confirmed', () => {
      const result = shouldDisableConfirm({
        riskLevel: TransactionRiskLevel.Critical,
        confirmedRisk: true,
      })

      expect(result).toBe(false)
    })

    it('should enable confirm when risk level is None', () => {
      const result = shouldDisableConfirm({
        riskLevel: TransactionRiskLevel.None,
        confirmedRisk: false,
      })

      expect(result).toBe(false)
    })

    it('should enable confirm when risk level is Warning', () => {
      const result = shouldDisableConfirm({
        riskLevel: TransactionRiskLevel.Warning,
        confirmedRisk: false,
      })

      expect(result).toBe(false)
    })
  })

  describe('transaction requests (with gas fee check)', () => {
    it('should disable confirm when gas fee is not available', () => {
      const result = shouldDisableConfirm({
        riskLevel: TransactionRiskLevel.None,
        confirmedRisk: false,
        hasGasFee: false,
      })

      expect(result).toBe(true)
    })

    it('should disable confirm when gas fee is available but risk scan has not completed', () => {
      const result = shouldDisableConfirm({
        riskLevel: null,
        confirmedRisk: false,
        hasGasFee: true,
      })

      expect(result).toBe(true)
    })

    it('should disable confirm when gas fee is available but there is an unconfirmed critical risk', () => {
      const result = shouldDisableConfirm({
        riskLevel: TransactionRiskLevel.Critical,
        confirmedRisk: false,
        hasGasFee: true,
      })

      expect(result).toBe(true)
    })

    it('should enable confirm when gas fee is available, risk is confirmed, and risk level is critical', () => {
      const result = shouldDisableConfirm({
        riskLevel: TransactionRiskLevel.Critical,
        confirmedRisk: true,
        hasGasFee: true,
      })

      expect(result).toBe(false)
    })

    it('should enable confirm when gas fee is available and risk level is None', () => {
      const result = shouldDisableConfirm({
        riskLevel: TransactionRiskLevel.None,
        confirmedRisk: false,
        hasGasFee: true,
      })

      expect(result).toBe(false)
    })

    it('should enable confirm when gas fee is available and risk level is Warning', () => {
      const result = shouldDisableConfirm({
        riskLevel: TransactionRiskLevel.Warning,
        confirmedRisk: false,
        hasGasFee: true,
      })

      expect(result).toBe(false)
    })

    it('should disable confirm when all conditions fail (no gas fee, no scan completion)', () => {
      const result = shouldDisableConfirm({
        riskLevel: null,
        confirmedRisk: false,
        hasGasFee: false,
      })

      expect(result).toBe(true)
    })
  })
})
