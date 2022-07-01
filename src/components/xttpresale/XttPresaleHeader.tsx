import { formatEther } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { intlFormat } from 'date-fns'
import { useMemo } from 'react'
import styled from 'styled-components/macro'

import { IXttPresaleState, Status } from '../../state/xtt-presale/reducer'
import { Separator, ThemedText } from '../../theme'
import Loader from '../Loader'
import ProgressBar from '../PorgressBar'
import { AutoRow, RowBetween, RowFixed } from '../Row'

const StyledXttPresaleHeader = styled.div`
  padding: 1rem 1.25rem 0.5rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
  display: flex;
  gap: 12px;
  flex-direction: column;
  align-items: center;
`

interface Props {
  state: IXttPresaleState
}

export default function XttPresaleHeader({ state }: Props) {
  const formattedState = useMemo(() => {
    if (state.status !== Status.SUCCESS) {
      return null
    }
    return {
      hardCap: formatEther(state.hardCapEthAmount),
      totalBought: formatEther(state.totalBought),
    }
  }, [state])

  const progress = useMemo(() => {
    if (!formattedState) {
      return 0
    }
    const progressRaw = (+formattedState.totalBought * 100) / +formattedState.hardCap
    console.log(progressRaw)
    return Math.round(progressRaw * 100) / 100
  }, [formattedState])

  if (state.status !== Status.SUCCESS) {
    return (
      <StyledXttPresaleHeader>
        <Loader size="48px" />
      </StyledXttPresaleHeader>
    )
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
          <ThemedText.Black fontWeight={200} fontSize={16}>
            Start time:
          </ThemedText.Black>
          <ThemedText.Black fontSize={16} fontWeight={800} style={{ marginLeft: '8px' }}>
            {intlFormat(new Date(state.privateSaleStartTimestamp * 1000), {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </ThemedText.Black>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <RowFixed>
          <ThemedText.Black fontWeight={200} fontSize={16}>
            End time:
          </ThemedText.Black>
          <ThemedText.Black fontSize={16} fontWeight={800} style={{ marginLeft: '8px' }}>
            {intlFormat(new Date(state.privateSaleEndTimestamp * 1000), {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </ThemedText.Black>
        </RowFixed>
      </RowBetween>
      <Separator />
      <AutoRow justify="flex-end">
        <ThemedText.Black fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
          Hard Cap: {formattedState?.hardCap}
        </ThemedText.Black>
      </AutoRow>
      <RowBetween>
        <ProgressBar progress={progress} height="100%" />
      </RowBetween>
    </StyledXttPresaleHeader>
  )
}
