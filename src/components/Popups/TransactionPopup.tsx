import React, { useContext } from 'react'
import { Box, Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { useActiveWeb3React } from 'hooks'
import { ExternalLink, HideSmall } from 'theme'
import { getEtherscanLink, getEtherscanLinkText } from 'utils'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import IconSuccess from 'assets/svg/notification_icon_success.svg'
import IconFailure from 'assets/svg/notification_icon_failure.svg'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

export const SUMMARY: {
  [type: string]: {
    success: (summary?: string) => string
    pending: (summary?: string) => string
    failure: (summary?: string) => string
  }
} = {
  Wrap: {
    success: summary => 'Wrapped ' + summary,
    pending: summary => 'Wrapping ' + summary,
    failure: summary => 'Error wrapping ' + summary
  },
  Unwrap: {
    success: summary => 'Unwrapped ' + summary,
    pending: summary => 'Unwrapping ' + summary,
    failure: summary => 'Error unwrapping ' + summary
  },
  Approve: {
    success: summary => summary + ' was approved',
    pending: summary => 'Approving ' + summary,
    failure: summary => 'Error approving ' + summary
  },
  Swap: {
    success: summary => 'Swapped ' + summary,
    pending: summary => 'Swapping ' + summary,
    failure: summary => 'Error swapping ' + summary
  },
  'Create pool': {
    success: summary => 'Created pool ' + summary,
    pending: summary => 'Creating pool ' + summary,
    failure: summary => 'Error creating pool ' + summary
  },
  'Add liquidity': {
    success: summary => 'Added ' + summary,
    pending: summary => 'Adding ' + summary,
    failure: summary => 'Error adding ' + summary
  },
  'Remove liquidity': {
    success: summary => 'Removed ' + summary,
    pending: summary => 'Removing ' + summary,
    failure: summary => 'Error removing ' + summary
  },
  Stake: {
    success: summary => 'Staked ' + summary,
    pending: summary => 'Staking ' + summary,
    failure: summary => 'Error staking ' + summary
  },
  Unstake: {
    success: summary => 'Unstaked ' + summary,
    pending: summary => 'Unstaking ' + summary,
    failure: summary => 'Error unstaking ' + summary
  },
  Harvest: {
    success: () => 'Harvested your rewards',
    pending: () => 'Harvesting your rewards',
    failure: () => 'Error harvesting your rewards'
  },
  Claim: {
    success: summary => 'Claimed ' + summary,
    pending: summary => 'Claiming ' + summary,
    failure: summary => 'Error claiming ' + summary
  },
  Migrate: {
    success: () => 'Migrated your liquidity',
    pending: () => 'Migrating your liquidity',
    failure: () => 'Error migrating your liquidity'
  }
}

export default function TransactionPopup({
  hash,
  success,
  type,
  summary
}: {
  hash: string
  success?: boolean
  type?: string
  summary?: string
}) {
  const { chainId } = useActiveWeb3React()

  const theme = useContext(ThemeContext)

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
              {type + ' - ' + (success ? 'Success' : 'Error') + '!'}
            </Text>
          )}
          <Text fontSize="14px" fontWeight={400} color={theme.text}>
            {type
              ? SUMMARY[type][success ? 'success' : 'failure'](summary)
              : summary ?? 'Hash: ' + hash.slice(0, 8) + '...' + hash.slice(58, 65)}
          </Text>
        </AutoColumn>
      </RowNoFlex>
      {chainId && (
        <HideSmall>
          <ExternalLink
            href={getEtherscanLink(chainId, hash, 'transaction')}
            style={{ margin: '8px 0 0 40px', display: 'block', color: success ? theme.primary : theme.red }}
          >
            {getEtherscanLinkText(chainId)}
          </ExternalLink>
        </HideSmall>
      )}
    </Box>
  )
}
