import { useTranslation } from 'react-i18next'
import { ReviewButton } from 'src/app/features/send/SendFormScreen/ReviewButton'
import { Flex } from 'ui/src'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { PermissionedTokenTooltip } from 'uniswap/src/features/permissionedTokens/PermissionedTokenTooltip'
import { BlockedAddressWarning } from 'uniswap/src/features/transactions/modals/BlockedAddressWarning'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'
import { useIsSendButtonDisabled } from 'wallet/src/features/transactions/send/hooks/useIsSendButtonDisabled'

type SendBlockingWarningsProps = {
  hasValueGreaterThanZero: boolean
  onPressReview: () => void
}

export function SendBlockingWarnings({
  hasValueGreaterThanZero,
  onPressReview,
}: SendBlockingWarningsProps): JSX.Element {
  const { t } = useTranslation()
  const { derivedSendInfo, warnings } = useSendContext()
  const sendCurrency = derivedSendInfo.currencyInInfo?.currency
  // Derive blocked state from the parsed warnings (single source of truth) instead of a
  // sibling boolean. Mirrors the swap side's useIsBlockedByPermissionedPool().
  const isPermissionedSendBlocked = warnings.blockingWarning?.type === WarningLabel.PermissionedPool

  const {
    isDisabled: isButtonBlocked,
    isActiveBlocked,
    isRecipientBlocked,
  } = useIsSendButtonDisabled({
    hasValueGreaterThanZero,
  })
  const isSubjectBlocked = isActiveBlocked || isRecipientBlocked

  return (
    <>
      {isSubjectBlocked && (
        <BlockedAddressWarning
          row
          alignItems="center"
          backgroundColor="$surface2"
          borderRadius="$rounded16"
          isRecipientBlocked={isRecipientBlocked}
          px="$spacing16"
          py="$spacing12"
        />
      )}
      {isPermissionedSendBlocked ? (
        <PermissionedTokenTooltip
          baseText={t('permissionedPool.surface.disabled.tooltip', {
            tokenSymbol: sendCurrency?.symbol ?? '',
          })}
          // Wrap the trigger in a Flex so Tooltip.Trigger's hover/focus handlers land on a real
          // DOM node: ReviewButton is a custom component that doesn't forward injected props, and
          // the inner Button is disabled (disabled elements don't fire pointer events on web).
          trigger={
            <Flex alignSelf="stretch">
              <ReviewButton disabled onPress={onPressReview} />
            </Flex>
          }
        />
      ) : (
        <ReviewButton disabled={isButtonBlocked} onPress={onPressReview} />
      )}
    </>
  )
}
