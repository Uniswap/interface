import { BigNumber } from '@ethersproject/bignumber'
// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import Collapsible from 'components/Collapsible'
import { AutoRow } from 'components/Row'
import { useV3Positions } from 'hooks/useV3Positions'
import { useActiveWeb3React } from 'hooks/web3'
import { memo } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { PositionDetails } from 'types/position'

import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import LimitOrderListItem from '../LimitOrderListItem'

const LimitOrdersContainer = styled(AutoColumn)`
  gap: 10px;
  width: 100%;
  max-width: 100%;
`

const LimitOrdersWrapper = styled(AutoColumn)<{ direction?: string }>`
  gap: 10px;
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: ${({ direction }) => (direction ? direction : 'row')};

  & > div {
    flex: 1;
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
    max-width: 100%;
    flex-direction: column;
  `};
`

export interface OrderDetails {
  owner: string
  tokenId: BigNumber
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: BigNumber
  processed: BigNumber
  tokensOwed0: BigNumber
  tokensOwed1: BigNumber
}

function LimitOrderList() {
  const { account } = useActiveWeb3React()
  const { positions, fundingBalance, minBalance } = useV3Positions(account)
  const isUnderfunded = minBalance && fundingBalance ? !minBalance?.lessThan(fundingBalance?.quotient) : false

  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.processed ? 1 : 0].push(p)
      return acc
    },
    [[], []]
  ) ?? [[], []]
  Boolean(!account)

  return (
    <LimitOrdersContainer>
      <LimitOrdersWrapper direction={'column'}>
        <Collapsible label={t`Open Orders`} initState={openPositions.length > 0}>
          <AutoColumn gap="1rem">
            {openPositions.map((item, index) => (
              <LimitOrderListItem key={index} limitOrderDetails={item} isUnderfunded={isUnderfunded} />
            ))}
          </AutoColumn>
        </Collapsible>
        <Collapsible label={t`Executed Orders`} initState={closedPositions.length > 0}>
          <AutoColumn gap="1rem">
            {closedPositions.map((item, index) => (
              <LimitOrderListItem key={index} limitOrderDetails={item} isUnderfunded={isUnderfunded} />
            ))}
          </AutoColumn>
        </Collapsible>
      </LimitOrdersWrapper>
      <AutoRow justify="center" textAlign="center" padding="0 1rem">
        <Text fontSize={16} fontWeight={400}>
          <TYPE.main>
            <Trans>Any missing order(s)? Try switching between networks.</Trans>
          </TYPE.main>
        </Text>
      </AutoRow>
    </LimitOrdersContainer>
  )
}

export default memo(LimitOrderList)
