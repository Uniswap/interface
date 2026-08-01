import type { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, IconButton, Image } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { Settings } from 'ui/src/components/icons/Settings'
import { Shine } from 'ui/src/loading/Shine'
import { iconSizes } from 'ui/src/theme'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { TestnetModeBanner } from 'uniswap/src/components/banners/TestnetModeBanner'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { DataApiOutageBanner } from 'uniswap/src/features/dataApi/outage/DataApiOutageBanner'
import type { DataApiOutageState } from 'uniswap/src/features/dataApi/types'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useHasAccountMismatchOnAnyChain } from 'uniswap/src/features/smartWallet/mismatch/hooks'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { MultiBlockchainAddressDisplay } from '~/components/AccountDetails/MultiBlockchainAddressDisplay'
import { AddBackupLoginCard } from '~/components/AccountDrawer/AddBackupLoginCard'
import { DisconnectButton } from '~/components/AccountDrawer/DisconnectButton'
import { EmptyWallet } from '~/components/AccountDrawer/MiniPortfolio/EmptyWallet'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { MiniPortfolio } from '~/components/AccountDrawer/MiniPortfolio/MiniPortfolio'
import { ReceiveActionTile } from '~/components/ActionTiles/ReceiveActionTile'
import { SendActionTile } from '~/components/ActionTiles/SendActionTile/SendActionTile'
import { LimitedSupportBanner } from '~/components/Banner/LimitedSupportBanner'
import { DelegationMismatchModal } from '~/components/delegation/DelegationMismatchModal'
import { StatusIcon } from '~/components/StatusIcon'
import { ExtensionRequestMethods, useUniswapExtensionRequest } from '~/components/WalletModal/useWagmiConnectorWithId'
import { useAccountsStore } from '~/features/accounts/store/hooks'
import { useUserHasAvailableClaim, useUserUnclaimedAmount } from '~/features/claim/hooks'
import { useDataApiOutageModal } from '~/hooks/useDataApiOutageModal'
import { useIsUniswapExtensionConnected } from '~/hooks/useIsUniswapExtensionConnected'
import { useModalState } from '~/hooks/useModalState'
import { useIsPortfolioZero } from '~/pages/Portfolio/Overview/hooks/useIsPortfolioZero'

export function AuthenticatedHeader({
  evmAddress,
  svmAddress,
  openSettings,
}: {
  evmAddress?: string
  svmAddress?: string
  openSettings: () => void
}) {
  const { t } = useTranslation()

  const isSolanaConnected = useConnectionStatus(Platform.SVM).isConnected
  const multipleWalletsConnected = useAccountsStore((state) => {
    const evmWalletId = state.activeConnectors.evm?.session?.walletId
    const svmWalletId = state.activeConnectors.svm?.session?.walletId
    return Boolean(evmWalletId && svmWalletId && evmWalletId !== svmWalletId)
  }) // if different wallets are connected, do not show mini wallet icon

  const isUniswapExtensionConnected = useIsUniswapExtensionConnected()
  const uniswapExtensionRequest = useUniswapExtensionRequest()
  const shouldShowExtensionButton = isUniswapExtensionConnected && !isSolanaConnected

  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(evmAddress)
  const isUnclaimed = useUserHasAvailableClaim(evmAddress)
  const { toggleModal: toggleClaimModal } = useModalState(ModalName.AddressClaim)

  const accountDrawer = useAccountDrawer()

  const {
    data: portfolioData,
    error: portfolioError,
    isPending: portfolioPending,
    loading: portfolioLoading,
    dataUpdatedAt: portfolioDataUpdatedAt,
  } = usePortfolioTotalValue({
    evmAddress,
    svmAddress,
  })

  const { percentChange, absoluteChangeUSD, balanceUSD } = portfolioData || {}

  // Treat error-before-first-data as loading so the skeleton stays visible
  const isLoading = !portfolioData && (portfolioPending || !!portfolioError)
  const isWarmLoading = !!portfolioData && portfolioLoading

  const [activityOutage, setActivityOutage] = useState<DataApiOutageState>({
    error: undefined,
    dataUpdatedAt: undefined,
  })

  // Prioritize the token error message in the case both tokens and activity data have outages
  const outageError = portfolioError ?? activityOutage.error
  const outageDataUpdatedAt = portfolioError ? portfolioDataUpdatedAt : activityOutage.dataUpdatedAt

  const isOutage = !!outageError
  const { openOutageModal } = useDataApiOutageModal({
    dataUpdatedAt: outageDataUpdatedAt,
  })

  const currency = useAppFiatCurrency()
  const currencyComponents = useAppFiatCurrencyInfo()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const totalFormattedValue = convertFiatAmountFormatted(balanceUSD, NumberType.PortfolioBalance)

  const isPortfolioZero = useIsPortfolioZero()
  const isDelegationMismatch = useHasAccountMismatchOnAnyChain()
  const isPermitMismatchUxEnabled = useFeatureFlag(FeatureFlags.EnablePermitMismatchUX)
  const shouldShowDelegationMismatch = isPermitMismatchUxEnabled && isDelegationMismatch
  const [displayDelegationMismatchModal, setDisplayDelegationMismatchModal] = useState(false)

  const amount = unclaimedAmount?.toFixed(0, { groupSeparator: ',' }) ?? '-'

  const shouldFadePortfolioDecimals =
    (currency === FiatCurrency.UnitedStatesDollar || currency === FiatCurrency.Euro) && currencyComponents.symbolAtFront

  const handleOpenExtensionSidebar = useCallback(() => {
    uniswapExtensionRequest?.(ExtensionRequestMethods.OPEN_SIDEBAR, 'Tokens')
    accountDrawer.close()
  }, [uniswapExtensionRequest, accountDrawer])

  return (
    <>
      <Flex flex={1} px="$padding16" py="$spacing20">
        <TestnetModeBanner mt={-20} mx={-24} mb="$spacing16" />
        {isOutage ? (
          <DataApiOutageBanner
            title={portfolioError ? undefined : t('dataApi.outage.banner.activity.title')}
            onPress={openOutageModal}
          />
        ) : null}
        <Flex row justifyContent="space-between" alignItems="flex-start" mb="$spacing8">
          <StatusIcon
            showMiniIcons={!multipleWalletsConnected}
            showConnectedIndicator={multipleWalletsConnected}
            size={48}
          />
          <Flex row gap="$spacing4">
            {shouldShowExtensionButton && (
              <Trace logPress element={ElementName.AccountDrawerExtensionButton}>
                <IconButton
                  size="small"
                  emphasis="text-only"
                  icon={<Image height={iconSizes.icon24} source={UNISWAP_LOGO} width={iconSizes.icon24} />}
                  borderRadius="$rounded32"
                  hoverStyle={{
                    backgroundColor: '$surface2',
                  }}
                  onPress={handleOpenExtensionSidebar}
                />
              </Trace>
            )}
            <Trace logPress element={ElementName.AccountDrawerSettingsButton}>
              <IconButton
                size="small"
                emphasis="text-only"
                data-testid={TestID.WalletSettings}
                icon={<Settings size="$icon.24" color="$neutral2" />}
                borderRadius="$rounded32"
                hoverStyle={{
                  backgroundColor: '$surface2',
                }}
                onPress={openSettings}
              />
            </Trace>

            <DisconnectButton />
          </Flex>
        </Flex>
        <Flex gap="$spacing4">
          <MultiBlockchainAddressDisplay />
        </Flex>
        <Flex flex={1} mt="$spacing16">
          <Flex gap="$spacing4" mb="$spacing16" data-testid={TestID.MiniPortfolioTotalBalance}>
            <AnimatedNumber
              numericValue={balanceUSD}
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
          {isPortfolioZero ? (
            <EmptyWallet />
          ) : (
            <>
              <Flex row gap="$gap8">
                <Flex grow>
                  <SendActionTile />
                </Flex>
                <Flex grow>
                  <ReceiveActionTile />
                </Flex>
              </Flex>
              <AddBackupLoginCard />
              <MiniPortfolio
                evmAddress={evmAddress}
                svmAddress={svmAddress}
                onActivityOutageChange={setActivityOutage}
              />
            </>
          )}
          {isUnclaimed && (
            <Trace logPress element={ElementName.AccountDrawerClaimReward}>
              <Button
                my="$spacing8"
                fill={false}
                onPress={toggleClaimModal}
                style={{
                  background: 'linear-gradient(to right, #9139b0 0%, #4261d6 100%)',
                }}
              >
                {t('account.authHeader.claimReward', { amount })}
              </Button>
            </Trace>
          )}
        </Flex>
      </Flex>
      {displayDelegationMismatchModal && (
        <DelegationMismatchModal onClose={() => setDisplayDelegationMismatchModal(false)} />
      )}
    </>
  )
}
