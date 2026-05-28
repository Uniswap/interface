import { DappVerificationStatus } from 'wallet/src/features/dappRequests/types'
import {
  applyFirstPartyOverride,
  isFirstPartyDapp,
  mergeVerificationStatuses,
} from 'wallet/src/features/dappRequests/verification'

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

describe('isFirstPartyDapp', () => {
  it('returns true for app.uniswap.org', () => {
    expect(isFirstPartyDapp('https://app.uniswap.org')).toBe(true)
    expect(isFirstPartyDapp('https://app.uniswap.org/swap?foo=bar')).toBe(true)
  })

  it('returns false for non-first-party hostnames', () => {
    expect(isFirstPartyDapp('https://uniswap.org')).toBe(false)
    expect(isFirstPartyDapp('https://evil.app.uniswap.org.attacker.com')).toBe(false)
    expect(isFirstPartyDapp('https://example.com')).toBe(false)
  })

  it('returns false for malformed URLs', () => {
    expect(isFirstPartyDapp('')).toBe(false)
    expect(isFirstPartyDapp('not a url')).toBe(false)
  })
})

describe('applyFirstPartyOverride', () => {
  const firstPartyUrl = 'https://app.uniswap.org'
  const thirdPartyUrl = 'https://example.com'

  it('upgrades Unverified to Verified for first-party URL', () => {
    expect(applyFirstPartyOverride(DappVerificationStatus.Unverified, firstPartyUrl)).toBe(
      DappVerificationStatus.Verified,
    )
  })

  it('preserves Threat for first-party URL', () => {
    expect(applyFirstPartyOverride(DappVerificationStatus.Threat, firstPartyUrl)).toBe(DappVerificationStatus.Threat)
  })

  it('keeps Verified as Verified for first-party URL', () => {
    expect(applyFirstPartyOverride(DappVerificationStatus.Verified, firstPartyUrl)).toBe(
      DappVerificationStatus.Verified,
    )
  })

  it('does not modify status for non-first-party URL', () => {
    expect(applyFirstPartyOverride(DappVerificationStatus.Unverified, thirdPartyUrl)).toBe(
      DappVerificationStatus.Unverified,
    )
    expect(applyFirstPartyOverride(DappVerificationStatus.Threat, thirdPartyUrl)).toBe(DappVerificationStatus.Threat)
    expect(applyFirstPartyOverride(DappVerificationStatus.Verified, thirdPartyUrl)).toBe(
      DappVerificationStatus.Verified,
    )
  })

  it('does not modify status when URL is malformed', () => {
    expect(applyFirstPartyOverride(DappVerificationStatus.Unverified, 'not a url')).toBe(
      DappVerificationStatus.Unverified,
    )
  })

  it('does not modify status when URL is undefined (no trusted origin)', () => {
    expect(applyFirstPartyOverride(DappVerificationStatus.Unverified, undefined)).toBe(
      DappVerificationStatus.Unverified,
    )
    expect(applyFirstPartyOverride(DappVerificationStatus.Verified, undefined)).toBe(DappVerificationStatus.Verified)
    expect(applyFirstPartyOverride(DappVerificationStatus.Threat, undefined)).toBe(DappVerificationStatus.Threat)
  })
})
