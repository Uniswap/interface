import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'

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

export default function XttPresaleHeader({
  progress = 0,
  startTime,
  endTime,
  sold,
  hardCap,
}: {
  progress: number
  startTime: Date
  endTime: Date
  sold: number
  hardCap: number
}) {
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
            {startTime}
          </ThemedText.Black>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <RowFixed>
          <ThemedText.Black fontWeight={400} fontSize={16}>
            End time:
          </ThemedText.Black>
          <ThemedText.Black fontSize={14} style={{ marginLeft: '8px' }}>
            {endTime}
          </ThemedText.Black>
        </RowFixed>
      </RowBetween>
      <Separator />
      <RowBetween>
        <RowFixed>
          <ThemedText.Black fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
            Sold: {sold}
          </ThemedText.Black>
        </RowFixed>
        <RowFixed>
          <ThemedText.Black fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
            Hard Cap: {hardCap}
          </ThemedText.Black>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <ProgressBar progress={progress} height="100%" />
      </RowBetween>
    </StyledXttPresaleHeader>
  )
}
