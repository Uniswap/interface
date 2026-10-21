import { Flex, iconSizes, Text } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SettingsRecoveryPhrase } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/SettingsRecoveryPhrase'
import { AppRoutes, RemoveRecoveryPhraseRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Trans } from 'ui/src'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { useAccountListData } from 'wallet/src/features/accounts/useAccountListData'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { isEmbeddedWalletAccount } from 'wallet/src/utils/mnemonics'

export function RemoveRecoveryPhraseWallets(): JSX.Element {
  const { t } = useTranslation()
  const { navigateTo } = useExtensionNavigation()

  const accounts = useSignerAccounts()
  const isEmbeddedWallet = accounts.some(isEmbeddedWalletAccount)

  const subtitle = isEmbeddedWallet ? (
    <Trans
      components={{ highlight: <Text color="$statusCritical" variant="body3" /> }}
      i18nKey="account.recoveryPhrase.remove.embeddedWallet.description"
    />
  ) : (
    t('setting.recoveryPhrase.remove.initial.subtitle')
  )

  return (
    <Flex grow backgroundColor="$surface1">
      <ScreenHeader title={t('setting.recoveryPhrase.remove')} />
      <SettingsRecoveryPhrase
        icon={<AlertTriangleFilled color="$statusCritical" size="$icon.24" />}
        nextButtonEnabled={true}
        nextButtonText={t('common.button.continue')}
        nextButtonEmphasis="secondary"
        subtitle={subtitle}
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
  const { balancesByAddress, loading } = useAccountListData({
    addresses,
  })

  const sortedAddressesByBalance = addresses
    .map((address) => ({ address, balance: balancesByAddress?.[address] }))
    .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))

  return (
    <Flex borderColor="$surface3" borderRadius="$rounded20" borderWidth="$spacing1" px="$spacing12" width="100%">
      {sortedAddressesByBalance.map(({ address, balance }) => (
        <AssociatedAccountRow key={address} address={address} balance={balance} loading={loading} />
      ))}
    </Flex>
  )
}

function AssociatedAccountRow({
  address,
  balance,
  loading,
}: {
  address: string
  balance: number | undefined
  loading: boolean
}): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const balanceFormatted = convertFiatAmountFormatted(balance, NumberType.PortfolioBalance)

  return (
    <Flex key={address} row alignItems="center" justifyContent="space-between" px="$spacing4" py="$spacing12">
      <Flex shrink>
        <AddressDisplay address={address} captionVariant="body3" size={iconSizes.icon36} variant="body2" />
      </Flex>
      <Flex flexGrow={0} pl="$padding8">
        <Text color="$neutral2" loading={loading} numberOfLines={1} variant="body3">
          {balanceFormatted}
        </Text>
      </Flex>
    </Flex>
  )
}
