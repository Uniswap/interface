import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewProps } from 'react-native'
import { useRecoveryWalletNames } from 'src/screens/Onboarding/useRecoveryWalletNames'
import { Button, Flex, FlexProps, Loader, Text, TouchableArea } from 'ui/src'
import { fonts, iconSizes } from 'ui/src/theme'
import { useMultiplePortfolioBalancesQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NumberType } from 'utilities/src/format/types'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export type RecoveryAddressInfo = {
  address: string
  derivationIndex: number
}

const cardProps: FlexProps & ViewProps = {
  borderRadius: '$rounded20',
  shadowColor: '$surface3',
  shadowOpacity: 0.04,
  shadowRadius: 10,
}

export function OnDeviceRecoveryWalletCard({
  mnemonicId,
  screenLoading,
  onLoadComplete,
  onPressWallet,
  onPressViewRecoveryPhrase,
}: {
  mnemonicId: string
  screenLoading: boolean
  onLoadComplete: () => void
  onPressWallet: (addressInfos: RecoveryAddressInfo[]) => void
  onPressViewRecoveryPhrase: () => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const [recoveryAddressInfos, setRecoveryAddressInfos] = useState<RecoveryAddressInfo[]>([])

  const { data: balancesData, loading } = useMultiplePortfolioBalancesQuery({
    variables: {
      ownerAddresses: recoveryAddressInfos.map((walletAddress) => walletAddress.address),
    },
    skip: !recoveryAddressInfos.length,
  })
  const balances = balancesData?.portfolios?.map(
    (portfolio) => portfolio?.tokensTotalDenominatedValue?.value ?? 0
  )
  const totalBalance = balances?.reduce((acc, balance) => acc + balance, 0)

  // Need to fetch ENS names and unitags for each deriviation index
  const { ensNames, unitags } = useRecoveryWalletNames(
    recoveryAddressInfos.map((walletAddress) => walletAddress.address)
  )

  useEffect(() => {
    async function getAddresses(): Promise<void> {
      const storedAddresses = await Keyring.getAddressesForStoredPrivateKeys()

      const derivationIndices = Array.from(Array(10).keys())
      const possibleAddresses = await Promise.all(
        derivationIndices.map((index) => Keyring.generateAndStorePrivateKey(mnemonicId, index))
      )

      const filteredAddressInfos = possibleAddresses
        .map((address, index): RecoveryAddressInfo | undefined =>
          storedAddresses.includes(address) ? { address, derivationIndex: index } : undefined
        )
        .filter((address): address is RecoveryAddressInfo => !!address)
      setRecoveryAddressInfos(filteredAddressInfos)
    }

    getAddresses().catch(() => {})
  }, [mnemonicId])

  useEffect(() => {
    if (!loading && screenLoading) {
      onLoadComplete()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, screenLoading])

  const significantWalletAddressInfos = recoveryAddressInfos.filter(
    (_address, index) => (balances && balances[index]) || ensNames[index] || unitags[index]
  )
  const firstWalletAddressInfo = significantWalletAddressInfos[0]
  const remainingAddressCount = significantWalletAddressInfos.length - 1

  if (screenLoading || !firstWalletAddressInfo) {
    return null
  }

  return (
    <TouchableArea onPress={() => onPressWallet(significantWalletAddressInfos)}>
      <Flex
        {...cardProps}
        centered
        backgroundColor="$surface1"
        borderColor="$surface2"
        borderWidth={1}
        gap="$spacing16"
        p="$spacing12">
        <Flex centered row gap="$spacing12">
          <AccountIcon address={firstWalletAddressInfo.address} size={iconSizes.icon36} />
          <Flex fill py={!remainingAddressCount ? fonts.body3.lineHeight / 2 : undefined}>
            <AddressDisplay
              address={firstWalletAddressInfo.address}
              hideAddressInSubtitle={true}
              showAccountIcon={false}
              size={iconSizes.icon36}
              variant="subheading1"
            />
            {remainingAddressCount ? (
              <Text color="$neutral3" variant="body3">
                {t('onboarding.import.onDeviceRecovery.wallet.count', {
                  count: remainingAddressCount,
                })}
              </Text>
            ) : undefined}
          </Flex>

          <Text color="$neutral2" variant="body2">
            {convertFiatAmountFormatted(totalBalance, NumberType.PortfolioBalance)}
          </Text>
        </Flex>

        <Button
          px="$spacing12"
          py="$spacing8"
          theme="secondary"
          width="100%"
          onPress={() => onPressViewRecoveryPhrase()}>
          <Text color="$neutral2" variant="buttonLabel4">
            {t('onboarding.import.onDeviceRecovery.wallet.button')}
          </Text>
        </Button>
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
    <Loader.Box
      height={120}
      opacity={1 - (LOADING_MIN_OPACITY_SUBTRACT * (index + 1)) / totalCount}
      {...cardProps}
    />
  )
}
