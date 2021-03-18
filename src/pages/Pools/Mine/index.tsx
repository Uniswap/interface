import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { PageWrapper } from '../styleds'

import { TYPE, HideSmall } from '../../../theme'
import { Box, Flex, Text } from 'rebass'
import { RowBetween, RowFixed } from '../../../components/Row'
import { ButtonPrimary, ButtonSecondary } from '../../../components/Button'
import { AutoColumn } from '../../../components/Column'
import { UndecoratedLink } from '../../../components/UndercoratedLink'
import { useLiquidityMiningFeatureFlag } from '../../../hooks/useLiquidityMiningFeatureFlag'
import PairsList from '../../../components/Pool/PairsList'
import { useLPPairs } from '../../../hooks/useLiquidityPositions'
import { useActiveWeb3React } from '../../../hooks'

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const ButtonRow = styled(RowFixed)`
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: row-reverse;
    justify-content: space-between;
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

export default function MyPairs() {
  const { account } = useActiveWeb3React()
  const liquidityMiningEnabled = useLiquidityMiningFeatureFlag()
  const { loading: loadingPairs, pairs } = useLPPairs(account || undefined)

  return (
    <PageWrapper>
      <AutoColumn gap="lg" justify="center">
        <AutoColumn gap="lg" style={{ width: '100%' }}>
          <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
            <HideSmall>
              <Flex alignItems="center">
                <Box mr="8px">
                  <UndecoratedLink to="/pools">
                    <TYPE.mediumHeader fontWeight="400" fontSize="26px" lineHeight="32px" color="text4">
                      Pairs
                    </TYPE.mediumHeader>
                  </UndecoratedLink>
                </Box>
                <Box mr="8px">
                  <TYPE.mediumHeader fontWeight="400" fontSize="26px" lineHeight="32px" color="text4">
                    /
                  </TYPE.mediumHeader>
                </Box>
                <Box>
                  <TYPE.mediumHeader fontWeight="400" fontSize="26px" lineHeight="32px">
                    MINE
                  </TYPE.mediumHeader>
                </Box>
              </Flex>
            </HideSmall>
            <ButtonRow>
              <ResponsiveButtonPrimary id="join-pool-button" as={Link} padding="8px 14px" to="/create">
                <Text fontWeight={700} fontSize={12}>
                  CREATE PAIR
                </Text>
              </ResponsiveButtonPrimary>
              {liquidityMiningEnabled && (
                <ResponsiveButtonSecondary as={Link} padding="8px 14px" to="/liquidity-mining/create">
                  <Text fontWeight={700} fontSize={12} lineHeight="15px">
                    CREATE LIQ. MINING
                  </Text>
                </ResponsiveButtonSecondary>
              )}
            </ButtonRow>
          </TitleRow>
          <PairsList loading={loadingPairs} pairs={pairs} />
        </AutoColumn>
      </AutoColumn>
    </PageWrapper>
  )
}
