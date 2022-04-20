import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { Currency, Percent } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import Badge, { BadgeVariant } from 'components/Badge'
import { MouseoverTooltip } from 'components/Tooltip'
import { KROM } from 'constants/tokens'
import { formatUnits } from 'ethers/lib/utils'
import { useNewStakingContract } from 'hooks/useContract'
import JSBI from 'jsbi'
import { useCallback, useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, HelpCircle } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { useSingleCallResult } from 'state/multicall/hooks'
import { TransactionType } from 'state/transactions/actions'
import styled from 'styled-components/macro'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import Web3 from 'web3-utils'

import { BIG_INT_ZERO } from '../../constants/misc'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useColor } from '../../hooks/useColor'
import { usePairContract, useStakingContract, useV2RouterContract } from '../../hooks/useContract'
import { useV2LiquidityTokenPermit } from '../../hooks/useERC20Permit'
import { useTotalSupply } from '../../hooks/useTotalSupply'
import { useActiveWeb3React } from '../../hooks/web3'
import { StakingInfo, useDerivedStakeInfo } from '../../state/stake/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { CloseIcon, TYPE } from '../../theme'
import { ExternalLink } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { formatCurrencyAmount } from '../../utils/formatCurrencyAmount'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { unwrappedToken } from '../../utils/unwrappedToken'
import { ButtonConfirmed, ButtonError } from '../Button'
import { ButtonEmpty, ButtonPrimary, ButtonSecondary } from '../Button'
import { GreyCard, LightCard } from '../Card'
import { AutoColumn } from '../Column'
import CurrencyInputPanel from '../CurrencyInputPanel'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../earn/styled'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
import ProgressCircles from '../ProgressSteps'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import { Dots } from '../swap/styleds'

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
