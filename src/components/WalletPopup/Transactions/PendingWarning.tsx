import { Trans, t } from '@lingui/macro'
import { Text } from 'rebass'

import { MouseoverTooltip } from 'components/Tooltip'
import { NUMBERS } from 'components/WalletPopup/Transactions/helper'
import useTheme from 'hooks/useTheme'
import ErrorWarningPanel from 'pages/Bridge/ErrorWarning'
import { ExternalLink } from 'theme'

export default function PendingWarning() {
  const theme = useTheme()
  return (
    <ErrorWarningPanel
      style={{ borderRadius: 20, padding: '10px 14px', height: NUMBERS.STALL_WARNING_HEIGHT }}
      type="error"
      title={
        <Text color={theme.red}>
          <Trans>
            Transaction stuck?{' '}
            <MouseoverTooltip
              text={t`Stuck transaction. Your transaction has been processing for more than ${NUMBERS.STALLED_MINS} mins.`}
            >
              <ExternalLink href="https://support.kyberswap.com/hc/en-us/articles/13785666409881-Why-is-my-transaction-stuck-in-Pending-state-">
                See here
              </ExternalLink>
            </MouseoverTooltip>
          </Trans>
        </Text>
      }
    />
  )
}
