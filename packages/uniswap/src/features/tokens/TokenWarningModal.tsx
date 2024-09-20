import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import DeprecatedTokenWarningModal from 'uniswap/src/features/tokens/DeprecatedTokenWarningModal'
import { currencyId } from 'uniswap/src/utils/currencyId'

interface Props {
  isVisible: boolean
  currencyInfo0: CurrencyInfo
  currencyInfo1?: CurrencyInfo
  disableAccept?: boolean // only show message and close button
  onClose: () => void
  onAccept: () => void
}

/**
 * Warning speedbump for selecting certain tokens.
 */
export default function TokenWarningModal({
  isVisible,
  currencyInfo0,
  disableAccept,
  onClose,
  onAccept,
}: Props): JSX.Element | null {
  const tokenProtectionEnabled = useFeatureFlag(FeatureFlags.TokenProtection)
  return tokenProtectionEnabled ? (
    <WarningModal
      captionComponent={
        <>
          {/* todo: subtitle */}
          <LearnMoreLink url={uniswapUrls.helpArticleUrls.tokenWarning} />
        </>
      }
      isOpen={isVisible}
      modalName={ModalName.TokenWarningModal}
      titleComponent={<>{/* todo: title */}</>}
      onCancel={onClose}
      onClose={onClose}
      onConfirm={onAccept}
    >
      {/* todo: children components */}
    </WarningModal>
  ) : (
    <DeprecatedTokenWarningModal
      currencyId={currencyId(currencyInfo0.currency)}
      disableAccept={disableAccept}
      isVisible={isVisible}
      safetyLevel={currencyInfo0.safetyLevel}
      tokenLogoUrl={currencyInfo0?.logoUrl}
      onAccept={onAccept}
      onClose={onClose}
    />
  )
}
