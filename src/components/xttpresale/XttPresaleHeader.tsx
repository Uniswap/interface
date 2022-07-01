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
  bonus: boolean
  tokenBalance: string
}

export default function XttPresaleHeader({ state, bonus, tokenBalance }: Props) {
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

      {Number(formatEther(state.balanceOf)) > 0 && (
        <RowBetween>
          <RowFixed>
            <ThemedText.Black fontWeight={200} fontSize={16}>
              Claimable XTT:
            </ThemedText.Black>
            <ThemedText.Black fontSize={16} fontWeight={800} style={{ marginLeft: '8px' }}>
              {formatEther(state.balanceOf || '0')}
            </ThemedText.Black>
          </RowFixed>
        </RowBetween>
      )}
      {Number(formatEther(tokenBalance)) > 0 && (
        <RowBetween>
          <RowFixed>
            <ThemedText.Black fontWeight={200} fontSize={16}>
              XTT Balance:
            </ThemedText.Black>
            <ThemedText.Black fontSize={16} fontWeight={800} style={{ marginLeft: '8px' }}>
              {formatEther(tokenBalance || '0')}
            </ThemedText.Black>
          </RowFixed>
        </RowBetween>
      )}
      {Number(formatEther(state.balanceOf)) === 0 && state.claimEnabledStart > Date.now() / 1000 && (
        <RowBetween>
          <RowFixed>
            <ThemedText.Black fontWeight={200} fontSize={16}>
              Bonus for max deposit:
            </ThemedText.Black>
            <ThemedText.Black
              fontSize={16}
              fontWeight={600}
              style={{
                marginLeft: '8px',
                border: `1px solid ${bonus ? '#090' : ''}`,
                borderRadius: '10px',
                padding: '2px 5px',
                background: bonus ? '#090' : '',
              }}
            >
              + {state.bonus}%
            </ThemedText.Black>
          </RowFixed>
        </RowBetween>
      )}

      <Separator />
      <AutoRow justify="flex-end">
        <ThemedText.Black fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
          Hard Cap: {formattedState?.hardCap}
        </ThemedText.Black>
      </AutoRow>
      <RowBetween>
        <ProgressBar progress={progress} height="100%" />
      </RowBetween>
      <Separator />
    </StyledXttPresaleHeader>
  )
}
