//! tamagui-ignore
// tamagui-ignore
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { UserLock } from 'ui/src/components/icons/UserLock'
import { noop } from 'utilities/src/react/noop'
import { AuctionKycStatus } from '~/components/Toucan/Auction/hooks/useAuctionKycStatus'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { ToucanActionButton } from '~/components/Toucan/Shared/ToucanActionButton'

export function KycActionButton({ kycStatus, onPress }: { kycStatus: AuctionKycStatus; onPress: () => void }) {
  const { t } = useTranslation()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)

  return (
    <Flex gap="$spacing8">
      {kycStatus.kycButtonLabel && (
        <Button
          icon={<UserLock size="$icon.16" />}
          flex={1}
          onPress={onPress}
          isDisabled={kycStatus.kycButtonDisabled}
          group
        >
          <Flex alignItems="flex-start" position="relative">
            <Button.Text animation="fastHeavy" position="relative" top={0} $group-hover={{ top: -6 }}>
              {kycStatus.kycButtonLabel}
            </Button.Text>
            <Text
              animation="fastHeavy"
              $group-hover={{ opacity: 1, top: 12 }}
              opacity={0}
              position="absolute"
              top={14}
              left={0}
              variant="body4"
              color="$surface2"
              whiteSpace="nowrap"
            >
              {t('toucan.kyc.requiredByTeam', { teamName: auctionDetails?.token?.currency.name })}
            </Text>
          </Flex>
        </Button>
      )}
      {kycStatus.whitelistLabel && <ToucanActionButton label={kycStatus.whitelistLabel} onPress={noop} isDisabled />}
    </Flex>
  )
}
