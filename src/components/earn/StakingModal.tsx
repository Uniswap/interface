import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

import { StakingInfo } from '../../state/stake/hooks'
import { AutoColumn } from '../Column'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../earn/styled'
import { RowBetween, RowFixed } from '../Row'

const HypotheticalRewardRate = styled.div<{ dim: boolean }>`
  display: flex;
  justify-content: space-between;
  padding-right: 20px;
  padding-left: 20px;

  opacity: ${({ dim }) => (dim ? 0.5 : 1)};
`

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`
export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: StakingInfo
  userLiquidityUnstaked: CurrencyAmount<Token> | undefined
}

export default function StakingModals({ isOpen, onDismiss, stakingInfo, userLiquidityUnstaked }: StakingModalProps) {
  return (
    <VoteCard>
      <CardBGImage />
      <CardNoise />
      <CardSection>
        <AutoColumn gap="md">
          <FixedHeightRow>
            <RowFixed gap="2px" style={{ marginRight: '10px' }}></RowFixed>
          </FixedHeightRow>
          <FixedHeightRow>
            <Text></Text>
          </FixedHeightRow>
        </AutoColumn>
      </CardSection>
    </VoteCard>
  )
}
