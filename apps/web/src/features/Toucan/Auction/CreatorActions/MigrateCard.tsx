import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { GraduatedCardFrame } from '~/features/Toucan/Auction/Bids/GraduatedCardFrame'
import { getMigrateCtaState } from '~/features/Toucan/Auction/CreatorActions/getMigrateCtaState'
import { useAuctionCreatorInfo } from '~/features/Toucan/Auction/hooks/useAuctionCreatorInfo'
import { useDurationRemaining } from '~/features/Toucan/Auction/hooks/useDurationRemaining'
import { useMigrateSubmit } from '~/features/Toucan/Auction/hooks/useMigrateSubmit'
import { useAuctionOutcome, useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getLbpMigrationState } from '~/features/Toucan/Auction/utils/creatorActions'
import { ToucanActionButton } from '~/features/Toucan/Shared/ToucanActionButton'

/**
 * Post-auction migrate CTA for graduated auctions whose LBP migration hasn't run yet
 * (lbp_migration_tx_hash unset). The call is permissionless, so it is enabled for anyone once
 * currentBlock reaches lbp_migration_block; before that only the creator sees it, disabled,
 * with a countdown. Uses the same glow hero shell as the creator sweep card (GraduatedCardFrame).
 * Because it renders for signed-out visitors too, the CTA first prompts to connect a wallet.
 */
export function MigrateCard(): JSX.Element | null {
  const { t } = useTranslation()
  const outcome = useAuctionOutcome()
  const { auctionDetails, currentBlockNumber, tokenColor } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    currentBlockNumber: state.currentBlockNumber,
    tokenColor: state.tokenColor,
  }))
  const { isConnectedTokensRecipient } = useAuctionCreatorInfo()
  const isWalletConnected = Boolean(useActiveAddress(Platform.EVM))
  const accountDrawer = useAccountDrawer()

  const migration = getLbpMigrationState({
    lbpStrategyAddress: auctionDetails?.lbpStrategyAddress,
    lbpMigrationBlock: auctionDetails?.lbpMigrationBlock,
    lbpMigrationTxHash: auctionDetails?.lbpMigrationTxHash,
    currentBlockNumber,
  })

  const { onSubmit, isPending, isWaitingForWallet, isConfirmed, error } = useMigrateSubmit({})

  const ctaState = getMigrateCtaState({
    outcome,
    migration,
    isConnectedTokensRecipient,
    hasLocallyMigrated: isConfirmed,
  })

  const durationRemaining = useDurationRemaining(
    auctionDetails?.chainId,
    ctaState.visible && !ctaState.enabled && !ctaState.showComplete ? migration.migrationBlock : undefined,
  )

  const auctionToken = auctionDetails?.token
  const chainId = auctionDetails?.chainId

  if (!ctaState.visible || chainId === undefined) {
    return null
  }

  const onButtonPress = (): void => {
    if (!isWalletConnected) {
      accountDrawer.open()
      return
    }
    void onSubmit()
  }

  const buttonLabel = (() => {
    if (!isWalletConnected) {
      return t('common.connectWallet.button')
    }
    if (ctaState.showComplete) {
      return t('toucan.creator.migrate.complete')
    }
    if (isWaitingForWallet) {
      return t('common.confirmWallet')
    }
    if (!ctaState.enabled) {
      return durationRemaining
        ? t('toucan.creator.migrate.availableIn', { time: durationRemaining })
        : t('toucan.creator.migrate.notYetAvailable')
    }
    return t('toucan.creator.migrate.button')
  })()

  return (
    <Flex gap="$spacing12" width="100%">
      <GraduatedCardFrame
        auctionLogoUrl={auctionToken?.logoUrl}
        auctionSymbol={auctionToken?.currency.symbol ?? auctionDetails?.tokenSymbol}
        chainId={chainId}
        tokenColor={tokenColor}
      >
        {/* Top-anchored below the logo (logo→title 34, then 6px between lines). */}
        <Flex flex={1} gap={6} width="100%" alignItems="center">
          <Text variant="subheading1" color="$neutral1" textAlign="center" mt={34}>
            {t('toucan.creator.migrate.title')}
          </Text>
          <Text variant="body2" color="$neutral2" textAlign="center" maxWidth={320}>
            {t('toucan.creator.migrate.description')}
          </Text>
        </Flex>
      </GraduatedCardFrame>
      {error && (
        <Text variant="body3" color="$statusCritical" textAlign="center">
          {t('common.error.general')}
        </Text>
      )}
      <ToucanActionButton
        elementName={ElementName.AuctionMigrateButton}
        label={buttonLabel}
        onPress={onButtonPress}
        isDisabled={isWalletConnected && (!ctaState.enabled || isPending)}
        loading={isWalletConnected && isPending}
        shouldUseBranded={isWalletConnected}
        shouldUseSoftBranded={!isWalletConnected}
      />
    </Flex>
  )
}
