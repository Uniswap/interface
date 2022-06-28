import { formatEther } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import styled from 'styled-components/macro'

import { IXttPresaleState, Status } from '../../state/xtt-presale/reducer'
import { Separator, ThemedText } from '../../theme'
import ProgressBar from '../PorgressBar'
import { RowBetween, RowFixed } from '../Row'

const StyledXttPresaleHeader = styled.div`
  padding: 1rem 1.25rem 0.5rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
  display: flex;
  gap: 8px;
  flex-direction: column;
`

interface Props {
  state: IXttPresaleState
}

export default function XttPresaleHeader({ state }: Props) {
  const formattedState = useMemo(() => {
    if (state.status !== Status.SUCCESS) {
      return null
    }
    console.log(formatEther(state.hardCapEthAmount))
    return {}
  }, [state])

  if (state.status !== Status.SUCCESS) {
    return null
  }

  return (
    <StyledXttPresaleHeader>
      <RowBetween>
        <RowFixed>
          <ThemedText.Black fontWeight={700} fontSize={18}>
            <Trans>XTT Presale</Trans>
          </ThemedText.Black>
        </RowFixed>
      </RowBetween>
      <Separator />
      <RowBetween>
        <RowFixed>
          <ThemedText.Black fontWeight={400} fontSize={16}>
            Start time:
          </ThemedText.Black>
          <ThemedText.Black fontSize={14} style={{ marginLeft: '8px' }}>
            {0}
          </ThemedText.Black>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <RowFixed>
          <ThemedText.Black fontWeight={400} fontSize={16}>
            End time:
          </ThemedText.Black>
          <ThemedText.Black fontSize={14} style={{ marginLeft: '8px' }}>
            {0}
          </ThemedText.Black>
        </RowFixed>
      </RowBetween>
      <Separator />
      <RowBetween>
        <RowFixed>
          <ThemedText.Black fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
            Sold: {0}
          </ThemedText.Black>
        </RowFixed>
        <RowFixed>
          <ThemedText.Black fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
            Hard Cap: {0}
          </ThemedText.Black>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <ProgressBar progress={0} height="100%" />
      </RowBetween>
    </StyledXttPresaleHeader>
  )
}
