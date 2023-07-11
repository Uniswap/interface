import { Trans } from '@lingui/macro'
import { ChainId } from '@thinkincoin-libs/sdk-core'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { getChainInfo } from 'constants/chainInfo'
import styled from 'styled-components/macro'

import { ThemedText } from '../../theme'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

const ColumnContainer = styled(AutoColumn)`
  margin: 0 12px;
`

export const PopupAlertTriangle = styled(AlertTriangleFilled)`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
`

export default function FailedNetworkSwitchPopup({ chainId }: { chainId: ChainId }) {
  const chainInfo = getChainInfo(chainId)

  return (
    <RowNoFlex gap="12px">
      <PopupAlertTriangle />
      <ColumnContainer gap="sm">
        <ThemedText.SubHeader color="textSecondary">
          <Trans>Failed to switch networks</Trans>
        </ThemedText.SubHeader>

        <ThemedText.BodySmall color="textSecondary">
          <Trans>To use Uniswap on {chainInfo.label}, switch the network in your wallet’s settings.</Trans>
        </ThemedText.BodySmall>
      </ColumnContainer>
    </RowNoFlex>
  )
}
