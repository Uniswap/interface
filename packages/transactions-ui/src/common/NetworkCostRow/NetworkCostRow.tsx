import { Text } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { AutoPill } from '@universe/transactions-ui/src/common/AutoPill/AutoPill'
import { DetailRow } from '@universe/transactions-ui/src/common/DetailRow/DetailRow'
import { useTranslation } from 'react-i18next'

export interface NetworkCostRowProps {
  /** Formatted network cost, e.g. "$1.24". Omit it while unknown and the row shows `—`. */
  value?: string
  /** Custom gas entry is on but this transaction has no saved overrides: the Auto pill precedes the value. */
  isAuto?: boolean
  /** The saved gas overrides trip a validation warning: an amber icon precedes the value, painted amber. */
  hasWarning?: boolean
  /** Small print under the row, e.g. the smart wallet activation note. */
  caption?: string
  /** The whole row presses, with a trailing chevron. Omit it on display-only surfaces such as swap review. */
  onPress?: () => void
  testID?: string
}

/**
 * The "Network cost" row shown while gas overrides are available: the swap form details,
 * the swap review screen and the wallet dapp transaction request. Auto pill, warning
 * icon and placeholder are this row's; the frame, chevron and caption come from
 * DetailRow.
 *
 * Replaces NetworkCostRow's markup in packages/uniswap.
 */
export function NetworkCostRow({
  value,
  isAuto,
  hasWarning,
  caption,
  onPress,
  testID,
}: NetworkCostRowProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <DetailRow
      caption={caption}
      label={t('gas.override.title')}
      testID={testID}
      value={
        <>
          {isAuto ? <AutoPill label={t('common.auto')} /> : null}
          {hasWarning ? (
            <AlertTriangleFilled color="$statusWarning" size="$icon.16" testID="network-cost-warning-icon" />
          ) : null}
          <Text color={hasWarning ? '$statusWarning' : '$neutral1'} variant="body3">
            {value ?? '—'}
          </Text>
        </>
      }
      onPress={onPress}
    />
  )
}
