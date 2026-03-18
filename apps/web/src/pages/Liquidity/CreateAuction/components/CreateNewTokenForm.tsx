import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Input, Popover, Text } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { Edit } from 'ui/src/components/icons/Edit'
import { ImageUpload } from 'ui/src/components/icons/ImageUpload'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { fonts, iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { useCreateAuctionStoreActions } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { NoWalletSection } from '~/pages/Liquidity/CreateAuction/components/NoWalletSection'
import { TokenAdditionalInfoSection } from '~/pages/Liquidity/CreateAuction/components/TokenAdditionalInfoSection'
import { useCreateNewTokenAllowedNetworks } from '~/pages/Liquidity/CreateAuction/hooks/useCreateNewTokenAllowedNetworks'
import { type CreateNewTokenFields } from '~/pages/Liquidity/CreateAuction/types'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

function NetworkSelector({
  network,
  allowedNetworks,
  onSelect,
  label,
}: {
  network: UniverseChainId
  allowedNetworks: UniverseChainId[]
  onSelect: (chainId: UniverseChainId) => void
  label?: string
}) {
  const chainInfo = getChainInfo(network)

  return (
    <Popover placement="bottom-start">
      <Popover.Trigger>
        <Flex
          gap="$spacing2"
          p="$spacing16"
          borderRadius="$rounded20"
          backgroundColor="$surface2"
          {...ClickableTamaguiStyle}
        >
          {label && (
            <Text variant="body3" color="$neutral2">
              {label}
            </Text>
          )}
          <Flex row alignItems="center" gap="$spacing8">
            <NetworkLogo chainId={network} size={iconSizes.icon20} />
            <Text variant="body1" flex={1}>
              {chainInfo.label}
            </Text>
            <RotatableChevron direction="down" color="$neutral2" size="$icon.16" />
          </Flex>
        </Flex>
      </Popover.Trigger>
      <Popover.Content
        borderRadius="$rounded12"
        borderWidth={1}
        borderColor="$surface3"
        backgroundColor="$surface1"
        p="$spacing8"
        elevate
        animation={['fast', { opacity: { overshootClamping: true } }]}
        enterStyle={{ scale: 0.95, opacity: 0 }}
        exitStyle={{ scale: 0.95, opacity: 0 }}
      >
        <Popover.Arrow />
        <Flex gap="$spacing4">
          {allowedNetworks.map((chainId) => {
            const info = getChainInfo(chainId)
            const isSelected = chainId === network
            return (
              <Popover.Close key={chainId} asChild>
                <Flex
                  row
                  alignItems="center"
                  gap="$spacing8"
                  p="$spacing8"
                  borderRadius="$rounded8"
                  backgroundColor={isSelected ? '$surface3' : '$transparent'}
                  onPress={() => onSelect(chainId)}
                  {...ClickableTamaguiStyle}
                  hoverStyle={{ backgroundColor: '$surface2' }}
                >
                  <NetworkLogo chainId={chainId} size={iconSizes.icon20} />
                  <Text variant="buttonLabel3">{info.label}</Text>
                  {isSelected && <CheckCircleFilled size="$icon.20" />}
                </Flex>
              </Popover.Close>
            )
          })}
        </Flex>
      </Popover.Content>
    </Popover>
  )
}

export function CreateNewTokenForm({ createNew }: { createNew: CreateNewTokenFields }) {
  const { t } = useTranslation()
  const { updateCreateNewField, commitTokenFormAndAdvance } = useCreateAuctionStoreActions()
  const [isEditingName, setIsEditingName] = useState(false)

  const canContinue =
    createNew.name.trim().length > 0 && createNew.symbol.trim().length > 0 && createNew.description.trim().length > 0
  const allowedNetworks = useCreateNewTokenAllowedNetworks()
  const address = useActiveAddress(Platform.EVM)

  if (!address) {
    return (
      <NoWalletSection
        subtitle={t('toucan.createAuction.step.tokenInfo.subtitleCreateNew')}
        alertDescription={t('toucan.createAuction.step.tokenInfo.noWallet.createNew')}
      />
    )
  }

  return (
    <Flex gap="$spacing24">
      <Flex gap="$spacing4">
        <Text variant="subheading1">{t('toucan.createAuction.step.tokenInfo.title')}</Text>
        <Text variant="body3" color="$neutral2">
          {t('toucan.createAuction.step.tokenInfo.subtitleCreateNew')}
        </Text>
      </Flex>
      <Flex gap="$spacing16">
        <Flex row alignItems="center" gap="$spacing24" height={88}>
          <Flex
            width={80}
            height={80}
            borderRadius="$roundedFull"
            backgroundColor="$surface3"
            alignItems="center"
            justifyContent="center"
            onPress={() => {}} // TODO: launch S3 upload flow
            {...ClickableTamaguiStyle}
          >
            <ImageUpload color="$neutral2" size="$icon.24" />
          </Flex>
          <Flex flex={1} gap="$spacing4" justifyContent="center">
            <Text variant="body3" color="$neutral2">
              {t('toucan.createAuction.step.tokenInfo.name')}
            </Text>
            {isEditingName ? (
              <Input
                height={fonts.heading2.lineHeight}
                autoFocus
                value={createNew.name}
                onChangeText={(text) => updateCreateNewField('name', text)}
                onBlur={() => setIsEditingName(false)}
                placeholder={t('toucan.createAuction.step.tokenInfo.namePlaceholder')}
                placeholderTextColor="$neutral3"
                fontSize={fonts.heading2.fontSize}
                lineHeight={fonts.heading2.lineHeight}
                fontWeight={fonts.heading2.fontWeight}
                color="$neutral1"
                px="$none"
              />
            ) : (
              <Flex row alignItems="center" justifyContent="space-between">
                <Text variant="heading2" color={createNew.name ? '$neutral1' : '$neutral3'}>
                  {createNew.name || t('toucan.createAuction.step.tokenInfo.namePlaceholder')}
                </Text>
                <Flex
                  alignItems="center"
                  px="$spacing12"
                  py="$spacing8"
                  onPress={() => setIsEditingName(true)}
                  {...ClickableTamaguiStyle}
                >
                  <Edit color="$neutral1" size="$icon.20" />
                </Flex>
              </Flex>
            )}
          </Flex>
        </Flex>
        <Flex gap="$spacing8">
          <Flex row gap="$spacing8">
            <Flex flex={3} backgroundColor="$surface2" borderRadius="$rounded20" p="$spacing16" gap="$spacing2">
              <Text variant="body3" color="$neutral2">
                {t('toucan.createAuction.step.tokenInfo.ticker')}
              </Text>
              <Input
                flex={1}
                value={createNew.symbol}
                onChangeText={(text) => updateCreateNewField('symbol', text)}
                placeholder={t('toucan.createAuction.step.tokenInfo.tickerPlaceholder')}
                unstyled
                fontFamily="$body"
                fontSize={fonts.body1.fontSize}
                lineHeight={fonts.body1.lineHeight}
                fontWeight={fonts.body1.fontWeight}
                color="$neutral1"
                placeholderTextColor="$neutral3"
              />
            </Flex>
            <Flex flex={2}>
              <NetworkSelector
                network={createNew.network}
                allowedNetworks={allowedNetworks}
                onSelect={(chainId) => updateCreateNewField('network', chainId)}
                label={t('toucan.createAuction.step.tokenInfo.network')}
              />
            </Flex>
          </Flex>
          <TokenAdditionalInfoSection
            description={createNew.description}
            onDescriptionChange={(v) => updateCreateNewField('description', v)}
          />
        </Flex>
      </Flex>
      <Flex row>
        <Button size="large" emphasis="primary" onPress={commitTokenFormAndAdvance} isDisabled={!canContinue} fill>
          {t('common.button.continue')}
        </Button>
      </Flex>
    </Flex>
  )
}
