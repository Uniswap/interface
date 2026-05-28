import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Popover, Text, TouchableArea } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import {
  type PostAuctionLiquidityAllocationType,
  PostAuctionLiquidityAllocationType as AllocationType,
} from '~/pages/Liquidity/CreateAuction/types'

interface AllocationPopoverProps {
  allocationType: PostAuctionLiquidityAllocationType
  raiseCurrencySymbol: string
  onSelectType: (type: PostAuctionLiquidityAllocationType) => void
}

function AllocationOption({
  title,
  description,
  isSelected,
  onPress,
}: {
  title: string
  description: string
  isSelected: boolean
  onPress: () => void
}) {
  return (
    <Popover.Close asChild>
      <TouchableArea
        px="$spacing12"
        py="$spacing8"
        borderRadius="$rounded16"
        hoverStyle={{ backgroundColor: '$surface2' }}
        onPress={onPress}
      >
        <Flex gap="$spacing4">
          <Flex row alignItems="center" gap="$spacing8">
            <Text variant="buttonLabel3" color="$neutral1" flex={1}>
              {title}
            </Text>
            {isSelected ? <CheckCircleFilled color="$neutral1" size="$icon.16" /> : null}
          </Flex>
          <Text variant="body4" color="$neutral2">
            {description}
          </Text>
        </Flex>
      </TouchableArea>
    </Popover.Close>
  )
}

export function PostAuctionLiquidityAllocationPopover({
  allocationType,
  raiseCurrencySymbol,
  onSelectType,
}: AllocationPopoverProps) {
  const { t } = useTranslation()
  const isTiered = allocationType === AllocationType.TIERED

  const handleSelectSingle = useCallback(() => onSelectType(AllocationType.SINGLE), [onSelectType])
  const handleSelectTiered = useCallback(() => onSelectType(AllocationType.TIERED), [onSelectType])

  return (
    <Popover placement="bottom-end" offset={8}>
      <Popover.Trigger>
        <TouchableArea
          row
          alignItems="center"
          gap="$spacing8"
          backgroundColor="$surface3"
          borderRadius="$roundedFull"
          p="$spacing4"
          px={isTiered ? '$spacing8' : '$spacing4'}
          justifyContent="center"
        >
          {isTiered ? (
            <Text variant="buttonLabel4" color="$neutral1">
              {t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.tieredAllocation')}
            </Text>
          ) : null}
          <MoreHorizontal size="$icon.16" color="$neutral1" />
        </TouchableArea>
      </Popover.Trigger>
      <Popover.Content
        maxWidth={280}
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        borderColor="$surface3"
        backgroundColor="$surface1"
        p="$spacing4"
        elevate
        animation={['fast', { opacity: { overshootClamping: true } }]}
        animateOnly={['transform', 'opacity']}
        enterStyle={{ scale: 0.95, opacity: 0 }}
        exitStyle={{ scale: 0.95, opacity: 0 }}
      >
        <Flex gap="$spacing4">
          <AllocationOption
            title={t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.singleAllocation')}
            description={t(
              'toucan.createAuction.step.configureAuction.postAuctionLiquidity.singleAllocationDescription',
              { raiseCurrency: raiseCurrencySymbol },
            )}
            isSelected={allocationType === AllocationType.SINGLE}
            onPress={handleSelectSingle}
          />
          <AllocationOption
            title={t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.tieredAllocation')}
            description={t(
              'toucan.createAuction.step.configureAuction.postAuctionLiquidity.tieredAllocationDescription',
              { raiseCurrency: raiseCurrencySymbol },
            )}
            isSelected={allocationType === AllocationType.TIERED}
            onPress={handleSelectTiered}
          />
        </Flex>
      </Popover.Content>
    </Popover>
  )
}
