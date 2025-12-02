import { DappVerificationStatus } from 'wallet/src/features/dappRequests/types'
import { mergeVerificationStatuses } from 'wallet/src/features/dappRequests/verification'

describe('mergeVerificationStatuses', () => {
  describe('when both statuses are undefined', () => {
    it('should return Unverified', () => {
      // Arrange & Act
      const result = mergeVerificationStatuses(undefined, undefined)

      // Assert
      expect(result).toBe(DappVerificationStatus.Unverified)
    })
  })

  describe('when one status is undefined', () => {
    it('should return the defined status when first parameter is undefined', () => {
      // Arrange & Act
      const result = mergeVerificationStatuses(undefined, DappVerificationStatus.Verified)

      // Assert
      expect(result).toBe(DappVerificationStatus.Verified)
    })

    it('should return the defined status when second parameter is undefined', () => {
      // Arrange & Act
      const result = mergeVerificationStatuses(DappVerificationStatus.Threat, undefined)

      // Assert
      expect(result).toBe(DappVerificationStatus.Threat)
    })
  })

  describe('when Threat is present', () => {
    it('should return Threat when first status is Threat and second is Verified', () => {
      // Arrange & Act
      const result = mergeVerificationStatuses(DappVerificationStatus.Threat, DappVerificationStatus.Verified)

      // Assert
      expect(result).toBe(DappVerificationStatus.Threat)
    })

    it('should return Threat when first status is Verified and second is Threat', () => {
      // Arrange & Act
      const result = mergeVerificationStatuses(DappVerificationStatus.Verified, DappVerificationStatus.Threat)

      // Assert
      expect(result).toBe(DappVerificationStatus.Threat)
    })

    it('should return Threat when first status is Threat and second is Unverified', () => {
      // Arrange & Act
      const result = mergeVerificationStatuses(DappVerificationStatus.Threat, DappVerificationStatus.Unverified)

      // Assert
      expect(result).toBe(DappVerificationStatus.Threat)
    })

    it('should return Threat when first status is Unverified and second is Threat', () => {
      // Arrange & Act
      const result = mergeVerificationStatuses(DappVerificationStatus.Unverified, DappVerificationStatus.Threat)

      // Assert
      expect(result).toBe(DappVerificationStatus.Threat)
    })

    it('should return Threat when both statuses are Threat', () => {
      // Arrange & Act
      const result = mergeVerificationStatuses(DappVerificationStatus.Threat, DappVerificationStatus.Threat)

      // Assert
      expect(result).toBe(DappVerificationStatus.Threat)
    })
  })

  describe('when Unverified is present without Threat', () => {
    it('should return Unverified when first status is Unverified and second is Verified', () => {
      // Arrange & Act
      const result = mergeVerificationStatuses(DappVerificationStatus.Unverified, DappVerificationStatus.Verified)

      // Assert
      expect(result).toBe(DappVerificationStatus.Unverified)
    })

    it('should return Unverified when first status is Verified and second is Unverified', () => {
      // Arrange & Act
      const result = mergeVerificationStatuses(DappVerificationStatus.Verified, DappVerificationStatus.Unverified)

      // Assert
      expect(result).toBe(DappVerificationStatus.Unverified)
    })

    it('should return Unverified when both statuses are Unverified', () => {
      // Arrange & Act
      const result = mergeVerificationStatuses(DappVerificationStatus.Unverified, DappVerificationStatus.Unverified)

      // Assert
      expect(result).toBe(DappVerificationStatus.Unverified)
    })
  })

  describe('when both statuses are Verified', () => {
    it('should return Verified', () => {
      // Arrange & Act
      const result = mergeVerificationStatuses(DappVerificationStatus.Verified, DappVerificationStatus.Verified)

      // Assert
      expect(result).toBe(DappVerificationStatus.Verified)
    })
  })
})
