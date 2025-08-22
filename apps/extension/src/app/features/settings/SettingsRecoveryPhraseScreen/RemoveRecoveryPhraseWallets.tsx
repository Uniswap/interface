import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SettingsRecoveryPhrase } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/SettingsRecoveryPhrase'
import { AppRoutes, RemoveRecoveryPhraseRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex, ScrollView, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { useAccountListData } from 'wallet/src/features/accounts/useAccountListData'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

export function RemoveRecoveryPhraseWallets(): JSX.Element {
  const { t } = useTranslation()
  const { navigateTo } = useExtensionNavigation()

  const accounts = useSignerAccounts()

  return (
    <Flex grow backgroundColor="$surface1">
      <ScreenHeader title={t('setting.recoveryPhrase.remove')} />
      <SettingsRecoveryPhrase
        icon={<AlertTriangleFilled color="$statusCritical" size="$icon.24" />}
        nextButtonEnabled={true}
        nextButtonText={t('common.button.continue')}
        nextButtonEmphasis="secondary"
        subtitle={t('setting.recoveryPhrase.remove.initial.subtitle')}
        title={t('setting.recoveryPhrase.remove.initial.title')}
        onNextPressed={(): void => {
          navigateTo(
            `/${AppRoutes.Settings}/${SettingsRoutes.RemoveRecoveryPhrase}/${RemoveRecoveryPhraseRoutes.Verify}`,
          )
        }}
      >
        <AssociatedAccountsList accounts={accounts} />
      </SettingsRecoveryPhrase>
    </Flex>
  )
}

// TODO(@thomasthachil): merge this with mobile AccountList
function AssociatedAccountsList({ accounts }: { accounts: Account[] }): JSX.Element {
  const addresses = useMemo(() => accounts.map((account) => account.address), [accounts])
  const { data, loading } = useAccountListData({
    addresses,
    notifyOnNetworkStatusChange: true,
  })

  const sortedAddressesByBalance = addresses
    .map((address) => {
      const wallet = data?.portfolios?.find((portfolio) => portfolio?.ownerAddress === address)
      return { address, balance: wallet?.tokensTotalDenominatedValue?.value }
    })
    .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))

  return (
    <Flex borderColor="$surface3" borderRadius="$rounded20" borderWidth="$spacing1" px="$spacing12" width="100%">
      <ScrollView bounces={false}>
        {sortedAddressesByBalance.map(({ address, balance }, index) => (
          <AssociatedAccountRow
            key={address}
            address={address}
            balance={balance}
            index={index}
            loading={loading}
            totalCount={accounts.length}
          />
        ))}
      </ScrollView>
    </Flex>
  )
}

function AssociatedAccountRow({
  index,
  address,
  balance,
  totalCount,
  loading,
}: {
  index: number
  address: string
  balance: number | undefined
  totalCount: number
  loading: boolean
}): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const balanceFormatted = convertFiatAmountFormatted(balance, NumberType.PortfolioBalance)

  return (
    <Flex
      key={address}
      row
      alignItems="center"
      justifyContent="space-between"
      pb={index !== totalCount - 1 ? '$spacing16' : undefined}
      px="$spacing4"
      py="$spacing12"
    >
      <Flex shrink>
        <AddressDisplay
          disableForcedWidth
          address={address}
          captionVariant="body3"
          size={iconSizes.icon36}
          variant="body2"
        />
      </Flex>
      <Flex flexGrow={0} pl="$padding8">
        <Text color="$neutral2" loading={loading} numberOfLines={1} variant="body3">
          {balanceFormatted}
        </Text>
      </Flex>
    </Flex>
  )
}
