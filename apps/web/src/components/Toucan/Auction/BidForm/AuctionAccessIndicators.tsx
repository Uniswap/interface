import { KycVerificationStatus } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, TouchableArea } from 'ui/src'
import { EnvelopeCheck } from 'ui/src/components/icons/EnvelopeCheck'
import { EnvelopeLock } from 'ui/src/components/icons/EnvelopeLock'
import { UserCheck } from 'ui/src/components/icons/UserCheck'
import { UserLock } from 'ui/src/components/icons/UserLock'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAuctionKycStatus } from '~/components/Toucan/Auction/hooks/useAuctionKycStatus'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'

const IconContainer = styled(Flex, {
  width: 24,
  height: 24,
  borderRadius: '$roundedFull',
  justifyContent: 'center',
  alignItems: 'center',
  variants: {
    active: {
      true: {
        background: '$statusSuccess2',
      },
      false: {
        background: '$surface3',
      },
    },
  },
})

export function AuctionAccessIndicators(): JSX.Element | null {
  const { t } = useTranslation()
  const auctionAddress = useAuctionStore((state) => state.auctionAddress)
  const chainId = useAuctionStore((state) => state.auctionDetails?.chainId)
  const address = useActiveAddress((chainId ?? UniverseChainId.Sepolia) as UniverseChainId)
  const kycStatus = useAuctionKycStatus({
    walletAddress: address,
    auctionAddress,
    chainId: chainId ?? UniverseChainId.Sepolia,
  })

  const getWhitelistTooltipText = (): string | undefined => {
    if (kycStatus.isAllowlisted) {
      return t('toucan.kyc.verifyIdentity.whitelisted')
    }
    return t('toucan.kyc.verifyIdentity.notWhitelisted')
  }

  const getVerificationTooltipText = (): string | undefined => {
    switch (kycStatus.status) {
      case KycVerificationStatus.VERIFICATION_STATUS_COMPLETED:
        return t('toucan.kyc.verifyIdentity.verified')
      case KycVerificationStatus.VERIFICATION_STATUS_PENDING:
        return t('toucan.kyc.verifyIdentity.pending')
      default:
        return t('toucan.kyc.verifyIdentity.notVerified')
    }
  }

  const whitelistTooltipContent = (
    <Flex p="$padding4">
      <Text variant="body4" color="$neutral1">
        {getWhitelistTooltipText()}
      </Text>
    </Flex>
  )

  const verificationTooltipContent = (
    <Flex p="$padding4">
      <Text variant="body4" color="$neutral1">
        {getVerificationTooltipText()}
      </Text>
    </Flex>
  )

  return (
    <Flex flexDirection="row" gap="$spacing8" justifyContent="center">
      {kycStatus.auctionHasPresale && (
        <InfoTooltip
          placement="top"
          trigger={
            <TouchableArea>
              <IconContainer active={kycStatus.isAllowlisted}>
                {kycStatus.isAllowlisted ? (
                  <EnvelopeCheck color="$statusSuccess" size="$icon.16" />
                ) : (
                  <EnvelopeLock color="$neutral1" size="$icon.16" />
                )}
              </IconContainer>
            </TouchableArea>
          }
          text={whitelistTooltipContent}
        />
      )}
      {kycStatus.auctionNeedsVerification && (
        <InfoTooltip
          placement="top"
          trigger={
            <TouchableArea>
              <IconContainer active={kycStatus.status === KycVerificationStatus.VERIFICATION_STATUS_COMPLETED}>
                {kycStatus.status === KycVerificationStatus.VERIFICATION_STATUS_COMPLETED ? (
                  <UserCheck color="$statusSuccess" size="$icon.16" />
                ) : (
                  <UserLock color="$neutral1" size="$icon.16" />
                )}
              </IconContainer>
            </TouchableArea>
          }
          text={verificationTooltipContent}
        />
      )}
    </Flex>
  )
}
