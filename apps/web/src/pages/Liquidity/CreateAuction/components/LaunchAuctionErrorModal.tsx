import { useTranslation } from 'react-i18next'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { getCreateAuctionErrorMessage } from '~/pages/Liquidity/CreateAuction/getCreateAuctionErrorMessage'
import {
  AuctionInsufficientBalanceError,
  AuctionStartTimePassedError,
  AuctionWindowTooShortError,
  AuctionXWalletMismatchError,
} from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionSubmit'

interface LaunchAuctionErrorModalProps {
  isOpen: boolean
  tokenSymbol: string
  /** The launch error, when known: specific errors map to actionable copy below. */
  error?: Error
  onClose: () => void
  onRetry: () => void
  /**
   * Returns to the token-info step. Used as the primary action for the X wallet-mismatch error,
   * where retrying can only fail again — the fix is re-verifying X with the connected wallet.
   */
  onEditTokenInfo: () => void
}

export function LaunchAuctionErrorModal({
  isOpen,
  tokenSymbol,
  error,
  onClose,
  onRetry,
  onEditTokenInfo,
}: LaunchAuctionErrorModalProps): JSX.Element {
  const { t } = useTranslation()

  const isXWalletMismatch = error instanceof AuctionXWalletMismatchError

  // Known pre-submission errors get specific, actionable copy. Backend input-validation failures
  // (e.g. an unsupported fee tier) carry a meaningful reason worth surfacing verbatim; everything
  // else falls back to a generic, localized reason since raw backend messages aren't user-friendly.
  const validationReason = getCreateAuctionErrorMessage(error)
  const genericReason = t('toucan.createAuction.launchError.genericReason')
  const subtext =
    error instanceof AuctionStartTimePassedError
      ? t('toucan.createAuction.launchError.startTimePassed', { tokenSymbol })
      : error instanceof AuctionInsufficientBalanceError
        ? t('toucan.createAuction.launchError.insufficientBalance', { tokenSymbol })
        : error instanceof AuctionWindowTooShortError
          ? t('toucan.createAuction.launchError.windowTooShort', { tokenSymbol })
          : isXWalletMismatch
            ? t('toucan.createAuction.launchError.xWalletMismatch', { tokenSymbol })
            : validationReason
              ? t('toucan.createAuction.launchError.withReason', { tokenSymbol, reason: validationReason })
              : t('toucan.createAuction.launchError.description', { tokenSymbol, reason: genericReason })

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      modalName={ModalName.LaunchAuctionError}
      displayHelpCTA
      getHelpUrl={UniswapHelpUrls.articles.toucanLaunchAuctionHelp}
      icon={<AlertTriangleFilled color="$neutral1" size="$icon.24" />}
      iconBackgroundColor="$surface3"
      title={t('toucan.createAuction.launchError.title')}
      subtext={subtext}
      secondaryButton={{
        text: t('common.button.cancel'),
        onPress: onClose,
      }}
      primaryButton={
        isXWalletMismatch
          ? {
              text: t('common.button.goBack'),
              onPress: onEditTokenInfo,
            }
          : {
              text: t('common.button.tryAgain'),
              onPress: onRetry,
            }
      }
    />
  )
}
