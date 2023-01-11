import { Trans } from '@lingui/macro'
import { Box, Text } from 'rebass'
import styled from 'styled-components'

import IconFailure from 'assets/svg/notification_icon_failure.svg'
import IconSuccess from 'assets/svg/notification_icon_success.svg'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { NotificationType } from 'state/application/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { ExternalLink, HideSmall } from 'theme'
import { getEtherscanLink } from 'utils'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

export const SUMMARY: {
  [type in TRANSACTION_TYPE]: {
    success: (summary?: string, isShort?: boolean) => string
    pending: (summary?: string, isShort?: boolean) => string
    failure: (summary?: string, isShort?: boolean) => string
  }
} = {
  [TRANSACTION_TYPE.WRAP]: {
    success: summary => 'Wrapped ' + summary,
    pending: summary => 'Wrapping ' + summary,
    failure: summary => 'Error wrapping ' + summary,
  },
  [TRANSACTION_TYPE.UNWRAP]: {
    success: summary => 'Unwrapped ' + summary,
    pending: summary => 'Unwrapping ' + summary,
    failure: summary => 'Error unwrapping ' + summary,
  },
  [TRANSACTION_TYPE.APPROVE]: {
    success: summary => summary + ' was approved',
    pending: summary => 'Approving ' + summary,
    failure: summary => 'Error approving ' + summary,
  },
  [TRANSACTION_TYPE.BRIDGE]: {
    success: summary => `Your bridge transaction from ${summary} is being processed.`,
    pending: summary => 'Transferring ' + summary,
    failure: summary => 'Error Transferring ' + summary,
  },
  [TRANSACTION_TYPE.SWAP]: {
    success: summary => 'Swapped ' + summary,
    pending: summary => 'Swapping ' + summary,
    failure: summary => 'Error swapping ' + summary,
  },
  [TRANSACTION_TYPE.CREATE_POOL]: {
    success: summary => 'Created pool ' + summary,
    pending: summary => 'Creating pool ' + summary,
    failure: summary => 'Error creating pool ' + summary,
  },
  [TRANSACTION_TYPE.ELASTIC_CREATE_POOL]: {
    success: summary => 'Created pool and added ' + summary,
    pending: summary => 'Creating pool and adding ' + summary,
    failure: summary => 'Error Creating ' + summary,
  },
  [TRANSACTION_TYPE.ADD_LIQUIDITY]: {
    success: summary => 'Added ' + summary,
    pending: summary => 'Adding ' + summary,
    failure: summary => 'Error adding ' + summary,
  },
  [TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY]: {
    success: summary => 'Added ' + summary,
    pending: summary => 'Adding ' + summary,
    failure: summary => 'Error adding ' + summary,
  },
  [TRANSACTION_TYPE.REMOVE_LIQUIDITY]: {
    success: summary => 'Removed ' + summary,
    pending: summary => 'Removing ' + summary,
    failure: summary => 'Error removing ' + summary,
  },
  [TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY]: {
    success: summary => 'Removed ' + summary,
    pending: summary => 'Removing ' + summary,
    failure: summary => 'Error removing ' + summary,
  },
  [TRANSACTION_TYPE.INCREASE_LIQUIDITY]: {
    success: summary => 'Increased ' + summary,
    pending: summary => 'Increasing ' + summary,
    failure: summary => 'Error increasing ' + summary,
  },
  [TRANSACTION_TYPE.COLLECT_FEE]: {
    success: summary => 'Collected ' + summary,
    pending: summary => 'Collecting ' + summary,
    failure: summary => 'Error collecting ' + summary,
  },
  [TRANSACTION_TYPE.STAKE]: {
    success: summary => 'Staked ' + summary,
    pending: summary => 'Staking ' + summary,
    failure: summary => 'Error staking ' + summary,
  },
  [TRANSACTION_TYPE.UNSTAKE]: {
    success: summary => 'Unstaked ' + summary,
    pending: summary => 'Unstaking ' + summary,
    failure: summary => 'Error unstaking ' + summary,
  },
  [TRANSACTION_TYPE.HARVEST]: {
    success: () => 'Harvested your rewards',
    pending: () => 'Harvesting your rewards',
    failure: () => 'Error harvesting your rewards',
  },
  [TRANSACTION_TYPE.CLAIM]: {
    success: summary => 'Claimed ' + summary,
    pending: summary => 'Claiming ' + summary,
    failure: summary => 'Error claiming ' + summary,
  },
  [TRANSACTION_TYPE.MIGRATE]: {
    success: () => 'Migrated your liquidity',
    pending: () => 'Migrating your liquidity',
    failure: () => 'Error migrating your liquidity',
  },
  [TRANSACTION_TYPE.CLAIM_REWARD]: {
    success: summary => 'Claimed ' + summary,
    pending: summary => 'Claiming ' + summary,
    failure: summary => 'Error claiming ' + summary,
  },
  [TRANSACTION_TYPE.DEPOSIT]: {
    success: summary => 'Deposited ' + summary,
    pending: summary => 'Depositing ' + summary,
    failure: summary => 'Error depositing ' + summary,
  },
  [TRANSACTION_TYPE.WITHDRAW]: {
    success: summary => 'Withdrawn ' + summary,
    pending: summary => 'Withdrawing ' + summary,
    failure: summary => 'Error withdrawing ' + summary,
  },
  [TRANSACTION_TYPE.FORCE_WITHDRAW]: {
    success: () => 'Force Withdrawn ',
    pending: () => 'Force Withdrawing ',
    failure: () => 'Error Force withdrawing ',
  },
  [TRANSACTION_TYPE.KYBERDAO_STAKE]: {
    success: summary => `${summary}`,
    pending: summary => `${summary}`,
    failure: summary => `${summary}`,
  },
  [TRANSACTION_TYPE.KYBERDAO_UNSTAKE]: {
    success: summary => `${summary}`,
    pending: summary => `${summary}`,
    failure: summary => `${summary}`,
  },
  [TRANSACTION_TYPE.KYBERDAO_DELEGATE]: {
    success: summary => `${summary}`,
    pending: summary => `${summary}`,
    failure: summary => `${summary}`,
  },
  [TRANSACTION_TYPE.KYBERDAO_UNDELEGATE]: {
    success: summary => `${summary}`,
    pending: summary => `${summary}`,
    failure: summary => `${summary}`,
  },
  [TRANSACTION_TYPE.KYBERDAO_MIGRATE]: {
    success: summary => `${summary}`,
    pending: summary => `${summary}`,
    failure: summary => `${summary}`,
  },
  [TRANSACTION_TYPE.KYBERDAO_CLAIM]: {
    success: summary => `${summary}`,
    pending: summary => `${summary}`,
    failure: summary => `${summary}`,
  },
  [TRANSACTION_TYPE.KYBERDAO_VOTE]: {
    success: summary => `${summary}`,
    pending: summary => `${summary}`,
    failure: summary => `${summary}`,
  },
  [TRANSACTION_TYPE.SETUP]: {
    success: (summary, isShort) => (isShort ? 'Setting up transaction' : 'Setting up some stuff to ' + summary),
    pending: (summary, isShort) => (isShort ? 'Setting up transaction' : 'Setting up some stuff to ' + summary),
    failure: (summary, isShort) =>
      isShort ? 'Setting up transaction' : 'There was an issue while setting up your swap. Please try again.',
  },
  [TRANSACTION_TYPE.CANCEL_LIMIT_ORDER]: {
    success: summary => `Your cancellation ${summary} has been submitted`,
    pending: summary => 'Cancelling ' + summary,
    failure: summary => 'Error Cancel ' + summary,
  },
}

const MAP_STATUS: { [key in string]: string } = {
  [TRANSACTION_TYPE.BRIDGE]: '- Processing',
  [TRANSACTION_TYPE.CANCEL_LIMIT_ORDER]: 'Submitted',
}
const getTitle = (type: string, success: boolean) => {
  const statusText = success ? 'Success' : 'Error'
  if (success && MAP_STATUS[type]) {
    // custom
    return `${type} ${MAP_STATUS[type] || statusText}!`
  }
  return `${type} - ${statusText}!`
}

export default function TransactionPopup({
  hash,
  notiType,
  type,
  summary,
}: {
  hash: string
  notiType: NotificationType
  type?: TRANSACTION_TYPE
  summary?: string
}) {
  const { chainId } = useActiveWeb3React()

  const theme = useTheme()
  const success = notiType === NotificationType.SUCCESS

  return (
    <Box>
      <RowNoFlex>
        <div style={{ paddingRight: 16 }}>
          {success ? (
            <img src={IconSuccess} alt="IconSuccess" style={{ display: 'block' }} />
          ) : (
            <img src={IconFailure} alt="IconFailure" style={{ display: 'block' }} />
          )}
        </div>
        <AutoColumn gap="8px">
          {type && (
            <Text fontSize="16px" fontWeight={500} color={success ? theme.primary : theme.red}>
              {getTitle(type, success)}
            </Text>
          )}
          <Text fontSize="14px" fontWeight={400} color={theme.text} lineHeight={1.6}>
            {type
              ? SUMMARY[type]?.[success ? 'success' : 'failure']?.(summary) || summary
              : summary ?? 'Hash: ' + hash.slice(0, 8) + '...' + hash.slice(58, 65)}
          </Text>
        </AutoColumn>
      </RowNoFlex>
      <HideSmall style={{ margin: '8px 0 0 40px', display: 'block' }}>
        <ExternalLink
          href={getEtherscanLink(chainId, hash, 'transaction')}
          style={{ color: success ? theme.primary : theme.red, fontSize: 14 }}
        >
          <Trans>View transaction</Trans>
        </ExternalLink>
      </HideSmall>
    </Box>
  )
}
