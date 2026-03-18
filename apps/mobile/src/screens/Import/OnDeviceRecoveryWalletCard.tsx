import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewProps } from 'react-native'
import { RecoveryWalletInfo, useOnDeviceRecoveryData } from 'src/screens/Import/useOnDeviceRecoveryData'
import { Button, Flex, FlexProps, Loader, Text, TouchableArea } from 'ui/src'
import { fonts, iconSizes } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

const cardProps: FlexProps & ViewProps = {
  borderRadius: '$rounded20',
  shadowColor: '$surface3',
  shadowOpacity: 0.04,
  shadowRadius: 10,
}

export function OnDeviceRecoveryWalletCard({
  mnemonicId,
  screenLoading,
  showAllWallets,
  onLoadComplete,
  onPressCard,
  onPressViewRecoveryPhrase,
}: {
  mnemonicId: string
  screenLoading: boolean
  showAllWallets: boolean
  onLoadComplete: (significantWalletCount: number) => void
  onPressCard: (walletInfos: RecoveryWalletInfo[]) => void
  onPressViewRecoveryPhrase: () => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const { recoveryWalletInfos, significantRecoveryWalletInfos, totalBalance, loading } =
    useOnDeviceRecoveryData(mnemonicId)

  const targetWalletInfos = showAllWallets ? recoveryWalletInfos.slice(0, 1) : significantRecoveryWalletInfos
  const firstWalletInfo = targetWalletInfos[0]
  const remainingWalletCount = targetWalletInfos.length - 1

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to recalculate this only when loading, screenLoading changes
  useEffect(() => {
    if (!loading && screenLoading) {
      onLoadComplete(significantRecoveryWalletInfos.length)
    }
  }, [loading, screenLoading])

  if (screenLoading || !firstWalletInfo) {
    return null
  }

  return (
    <TouchableArea onPress={() => onPressCard(targetWalletInfos)}>
      <Flex
        {...cardProps}
        centered
        backgroundColor="$surface1"
        borderColor="$surface2"
        borderWidth="$spacing1"
        gap="$spacing16"
        p="$spacing12"
      >
        <Flex centered row gap="$spacing12">
          <AccountIcon address={firstWalletInfo.address} size={iconSizes.icon36} />
          <Flex fill py={!remainingWalletCount ? fonts.body3.lineHeight / 2 : undefined}>
            <AddressDisplay
              address={firstWalletInfo.address}
              hideAddressInSubtitle={true}
              showAccountIcon={false}
              size={iconSizes.icon36}
              variant="subheading1"
            />
            {remainingWalletCount ? (
              <Text color="$neutral3" variant="body3">
                {t('onboarding.import.onDeviceRecovery.wallet.count', {
                  count: remainingWalletCount,
                })}
              </Text>
            ) : undefined}
          </Flex>

          <Text color="$neutral2" variant="body2">
            {convertFiatAmountFormatted(totalBalance, NumberType.PortfolioBalance)}
          </Text>
        </Flex>

        <Flex row>
          <Button emphasis="secondary" size="small" onPress={onPressViewRecoveryPhrase}>
            {t('onboarding.import.onDeviceRecovery.wallet.button')}
          </Button>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

const LOADING_MIN_OPACITY_SUBTRACT = 0.8

export function OnDeviceRecoveryWalletCardLoader({
  index,
  totalCount,
}: {
  index: number
  totalCount: number
}): JSX.Element {
  return (
    <Loader.Box height={120} opacity={1 - (LOADING_MIN_OPACITY_SUBTRACT * (index + 1)) / totalCount} {...cardProps} />
  )
}
