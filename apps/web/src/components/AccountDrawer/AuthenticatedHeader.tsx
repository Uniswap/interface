import { NetworkStatus } from '@apollo/client'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { MultiBlockchainAddressDisplay } from 'components/AccountDetails/MultiBlockchainAddressDisplay'
import { ActionTile } from 'components/AccountDrawer/ActionTile'
import { DownloadGraduatedWalletCard } from 'components/AccountDrawer/DownloadGraduatedWalletCard'
import IconButton, { IconWithConfirmTextButton } from 'components/AccountDrawer/IconButton'
import { EmptyWallet } from 'components/AccountDrawer/MiniPortfolio/EmptyWallet'
import { ExtensionDeeplinks } from 'components/AccountDrawer/MiniPortfolio/ExtensionDeeplinks'
import MiniPortfolio from 'components/AccountDrawer/MiniPortfolio/MiniPortfolio'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { LimitedSupportBanner } from 'components/Banner/LimitedSupportBanner'
import { Power } from 'components/Icons/Power'
import { Settings } from 'components/Icons/Settings'
import StatusIcon from 'components/Identicon/StatusIcon'

import { ReceiveModalState, receiveCryptoModalStateAtom } from 'components/ReceiveCryptoModal/state'
import DelegationMismatchModal from 'components/delegation/DelegationMismatchModal'
import { useAccount } from 'hooks/useAccount'
import { useDisconnect } from 'hooks/useDisconnect'
import { useIsUniExtensionConnected } from 'hooks/useIsUniExtensionConnected'
import { useModalState } from 'hooks/useModalState'
import { useSignOutWithPasskey } from 'hooks/useSignOutWithPasskey'
import { useAtom } from 'jotai'
import { SendFormModal } from 'pages/Swap/Send/SendFormModal'
import { useCallback, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { useUserHasAvailableClaim, useUserUnclaimedAmount } from 'state/claim/hooks'
import { CopyHelper } from 'theme/components/CopyHelper'
import { Button, Flex, Text } from 'ui/src'
import { ArrowDownCircleFilled } from 'ui/src/components/icons/ArrowDownCircleFilled'
import { SendAction } from 'ui/src/components/icons/SendAction'
import { Shine } from 'ui/src/loading/Shine'
import AnimatedNumber, {
  BALANCE_CHANGE_INDICATION_DURATION,
} from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { TestnetModeBanner } from 'uniswap/src/components/banners/TestnetModeBanner'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balances'
import { useENSName } from 'uniswap/src/features/ens/api'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { useHasAccountMismatchOnAnyChain } from 'uniswap/src/features/smartWallet/mismatch/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import i18next from 'uniswap/src/i18n'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'

export default function AuthenticatedHeader({ account, openSettings }: { account: string; openSettings: () => void }) {
  const disconnect = useDisconnect()
  const { data: ENSName } = useENSName(account)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const wallet = useWallet()

  const [, setReceiveModalState] = useAtom(receiveCryptoModalStateAtom)

  const isUniExtensionConnected = useIsUniExtensionConnected()
  const isExtensionDeeplinkingDisabled = useFeatureFlag(FeatureFlags.DisableExtensionDeeplinks)
  const shouldShowExtensionDeeplinks = isUniExtensionConnected && !isExtensionDeeplinkingDisabled

  const { isTestnetModeEnabled } = useEnabledChains()
  const connectedAccount = useAccount()
  const connectedWithEmbeddedWallet =
    connectedAccount.connector?.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID
  const { signOutWithPasskey } = useSignOutWithPasskey()
  const isRightToLeft = i18next.dir() === 'rtl'

  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(account)
  const isUnclaimed = useUserHasAvailableClaim(account)
  const { toggleModal: toggleClaimModal } = useModalState(ModalName.AddressClaim)

  const accountDrawer = useAccountDrawer()
  const dispatch = useDispatch()

  const handleDisconnect = useCallback(async () => {
    if (connectedWithEmbeddedWallet) {
      await signOutWithPasskey()
    }
    dispatch(setIsTestnetModeEnabled(false))
    disconnect()
    accountDrawer.close()
  }, [connectedWithEmbeddedWallet, dispatch, disconnect, accountDrawer, signOutWithPasskey])

  const handleBuyCryptoClick = useCallback(() => {
    accountDrawer.close()
    navigate(`/buy`, { replace: true })
  }, [accountDrawer, navigate])

  const openAddressQRModal = useEvent(() => setReceiveModalState(ReceiveModalState.QR_CODE))
  const openCEXTransferModal = useEvent(() => setReceiveModalState(ReceiveModalState.CEX_TRANSFER))
  const openReceiveCryptoModal = useEvent(() => setReceiveModalState(ReceiveModalState.DEFAULT))
  const {
    isOpen: isSendFormModalOpen,
    openModal: openSendFormModal,
    closeModal: closeSendFormModal,
  } = useModalState(ModalName.Send)

  const { data, networkStatus, loading } = usePortfolioTotalValue({
    address: account,
  })

  const { percentChange, absoluteChangeUSD, balanceUSD } = data || {}

  const isLoading = loading && !data
  const isWarmLoading = !!data && networkStatus === NetworkStatus.loading

  const currency = useAppFiatCurrency()
  const currencyComponents = useAppFiatCurrencyInfo()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const totalFormattedValue = convertFiatAmountFormatted(balanceUSD, NumberType.PortfolioBalance)

  // denominated portfolio balance on testnet is always 0
  const isPortfolioZero = !isTestnetModeEnabled && balanceUSD === 0
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const isDelegationMismatch = useHasAccountMismatchOnAnyChain()
  const isPermitMismatchUxEnabled = useFeatureFlag(FeatureFlags.EnablePermitMismatchUX)
  const shouldShowDelegationMismatch = isPermitMismatchUxEnabled && isDelegationMismatch
  const [displayDelegationMismatchModal, setDisplayDelegationMismatchModal] = useState(false)

  const { data: unitag } = useUnitagsAddressQuery({
    params: account ? { address: account } : undefined,
  })
  const showAddress = ENSName || unitag?.username

  const amount = unclaimedAmount?.toFixed(0, { groupSeparator: ',' }) ?? '-'

  const shouldFadePortfolioDecimals =
    (currency === FiatCurrency.UnitedStatesDollar || currency === FiatCurrency.Euro) && currencyComponents.symbolAtFront

  return (
    <>
      <Flex flex={1} px="$padding16" py={isUniExtensionConnected ? '$spacing16' : '$spacing20'}>
        <TestnetModeBanner mt={isUniExtensionConnected ? -16 : -20} mx={-24} mb="$spacing16" />
        <Flex row justifyContent="space-between" alignItems="flex-start" mb="$spacing8">
          <StatusIcon size={48} />
          <Flex row gap="$spacing8">
            <IconButton
              hideHorizontal={showDisconnectConfirm}
              data-testid="wallet-settings"
              onClick={openSettings}
              Icon={Settings}
            />
            <Trace
              logPress
              element={ElementName.DisconnectWalletButton}
              properties={{ connector_id: connectedAccount.connector?.id }}
            >
              <IconWithConfirmTextButton
                data-testid="wallet-disconnect"
                onConfirm={handleDisconnect}
                onShowConfirm={setShowDisconnectConfirm}
                Icon={Power}
                text={t('common.button.disconnect')}
                dismissOnHoverOut
              />
            </Trace>
          </Flex>
        </Flex>
        <Flex gap="$spacing4">
          <MultiBlockchainAddressDisplay enableCopyAddress={!showAddress} wallet={wallet} />
          {showAddress && (
            <CopyHelper iconSize={14} iconPosition="right" toCopy={account}>
              <Text variant="body3" color="neutral3" data-testid={TestID.AddressDisplayCopyHelper}>
                {shortenAddress(account)}
              </Text>
            </CopyHelper>
          )}
        </Flex>
        <Flex flex={1} mt="$spacing16">
          <Flex gap="$spacing4" mb="$spacing16" data-testid="portfolio-total-balance">
            <AnimatedNumber
              balance={balanceUSD}
              isRightToLeft={isRightToLeft}
              colorIndicationDuration={BALANCE_CHANGE_INDICATION_DURATION}
              loading={isLoading}
              loadingPlaceholderText="000000.00"
              shouldFadeDecimals={shouldFadePortfolioDecimals}
              value={totalFormattedValue}
              warmLoading={isWarmLoading}
            />
            {!isPortfolioZero && (
              <Shine disabled={!isWarmLoading}>
                <RelativeChange
                  absoluteChange={absoluteChangeUSD}
                  arrowSize="$icon.16"
                  change={percentChange}
                  loading={isLoading}
                  negativeChangeColor={isWarmLoading ? '$neutral2' : '$statusCritical'}
                  positiveChangeColor={isWarmLoading ? '$neutral2' : '$statusSuccess'}
                  variant="body3"
                />
              </Shine>
            )}
          </Flex>
          {shouldShowDelegationMismatch && (
            <LimitedSupportBanner onPress={() => setDisplayDelegationMismatchModal(true)} />
          )}
          {shouldShowExtensionDeeplinks ? (
            <ExtensionDeeplinks account={account} />
          ) : (
            <>
              {isPortfolioZero ? (
                <EmptyWallet
                  handleBuyCryptoClick={handleBuyCryptoClick}
                  handleReceiveCryptoClick={openAddressQRModal}
                  handleCEXTransferClick={openCEXTransferModal}
                />
              ) : (
                <>
                  <Flex row gap="$gap8">
                    <ActionTile
                      dataTestId={TestID.Send}
                      Icon={<SendAction size={24} color="$accent1" />}
                      name={t('common.send.button')}
                      onClick={openSendFormModal}
                    />
                    <ActionTile
                      dataTestId={TestID.WalletReceiveCrypto}
                      Icon={<ArrowDownCircleFilled size={24} color="$accent1" />}
                      name={t('common.receive')}
                      onClick={openReceiveCryptoModal}
                    />
                  </Flex>
                  <DownloadGraduatedWalletCard />
                  <MiniPortfolio account={account} />
                </>
              )}
              {isUnclaimed && (
                <Button
                  my="$spacing8"
                  fill={false}
                  onPress={toggleClaimModal}
                  style={{ background: 'linear-gradient(to right, #9139b0 0%, #4261d6 100%)' }}
                >
                  <Trans i18nKey="account.authHeader.claimReward" values={{ amount }} />
                </Button>
              )}
            </>
          )}
        </Flex>
      </Flex>
      {isSendFormModalOpen && <SendFormModal isModalOpen={isSendFormModalOpen} onClose={closeSendFormModal} />}
      {displayDelegationMismatchModal && (
        <DelegationMismatchModal onClose={() => setDisplayDelegationMismatchModal(false)} />
      )}
    </>
  )
}
