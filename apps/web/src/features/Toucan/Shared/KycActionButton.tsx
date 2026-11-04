import { Button, Flex, Text } from '@universe/mycelium'
import { UserLock } from '@universe/mycelium/icons/UserLock'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { useTranslation } from 'react-i18next'
import { noop } from 'utilities/src/react/noop'
import { AuctionKycStatus } from '~/features/Toucan/Auction/hooks/useAuctionKycStatus'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { ToucanActionButton } from '~/features/Toucan/Shared/ToucanActionButton'

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
          disabled={kycStatus.kycButtonDisabled}
          group
        >
          <Flex alignItems="flex-start" position="relative">
            <Button.Text
              transition={`top ${SPORE_ANIMATION_CURVE_CSS.fastHeavy}`}
              position="relative"
              top={0}
              $group-hover={{ top: -6 }}
            >
              {kycStatus.kycButtonLabel}
            </Button.Text>
            <Text
              transition={`top ${SPORE_ANIMATION_CURVE_CSS.fastHeavy}, opacity ${SPORE_ANIMATION_CURVE_CSS.fastHeavy}`}
              $group-hover={{ opacity: 1, top: 12 }}
              opacity={0}
              position="absolute"
              top={14}
              left={0}
              variant="body4"
              color="$surface2"
              whiteSpace="nowrap"
            >
              {t('toucan.kyc.requiredByTeam', { teamName: auctionDetails?.token?.currency.name ?? t('common.token') })}
            </Text>
          </Flex>
        </Button>
      )}
      {kycStatus.whitelistLabel && <ToucanActionButton label={kycStatus.whitelistLabel} onPress={noop} isDisabled />}
    </Flex>
  )
}
