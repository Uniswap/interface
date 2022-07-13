import { Currency } from '@uniswap/sdk-core'
import { selectionAsync } from 'expo-haptics'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import { BaseCard } from 'src/components/layout/BaseCard'
import { TokenBalanceList, ViewType } from 'src/components/TokenBalanceList/TokenBalanceList'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesList } from 'src/features/dataApi/balances'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Screens } from 'src/screens/Screens'
import { currencyId } from 'src/utils/currencyId'

export function PortfolioTokensSection({ count, owner }: { count?: number; owner?: string }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigation = useHomeStackNavigation()
  const accountAddress = useActiveAccount()?.address
  const activeAddress = owner ?? accountAddress
  const currentChains = useActiveChainIds()

  const { balances, loading, totalCount } = useAllBalancesList(activeAddress, currentChains, count)

  const onPressToken = (currency: Currency) =>
    navigation.navigate(Screens.TokenDetails, { currencyId: currencyId(currency) })

  // TODO: remove when buy flow ready
  const onPressScan = () => {
    selectionAsync()
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: WalletConnectModalState.ScanQr })
    )
  }

  return (
    <BaseCard.Container>
      <TokenBalanceList
        balances={balances as PortfolioBalance[]}
        empty={
          <BaseCard.EmptyState
            additionalButtonLabel={t('Transfer')}
            buttonLabel={t('Scan')}
            description={t(
              'Fund your wallet by buying tokens with a credit card or transferring from an exchange.'
            )}
            title={t('Add tokens')}
            onPress={onPressScan}
            onPressAdditional={onPressScan}
          />
        }
        header={
          <BaseCard.Header
            title={t('Tokens ({{totalCount}})', { totalCount })}
            onPress={() => navigation.navigate(Screens.PortfolioTokens, { owner })}
          />
        }
        loading={loading}
        view={ViewType.Flat}
        onPressToken={onPressToken}
      />
    </BaseCard.Container>
  )
}
