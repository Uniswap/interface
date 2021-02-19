import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { Link, Redirect, RouteComponentProps } from 'react-router-dom'
import { SwapPoolTabs } from '../../../components/NavigationTabs'
import { PageWrapper } from '../styleds'

import { TYPE, HideSmall, StyledInternalLink } from '../../../theme'
import { Box, Flex, Text } from 'rebass'
import { RowBetween, RowFixed } from '../../../components/Row'
import { ButtonSecondary, ButtonWithLink } from '../../../components/Button'
import { AutoColumn } from '../../../components/Column'

import { useActiveWeb3React } from '../../../hooks'
import { ChevronDown } from 'react-feather'
import { CardSection } from '../../../components/earn/styled'
import { useToken } from '../../../hooks/Tokens'
import { UndecoratedLink } from '../../../components/UndercoratedLink'
import DoubleCurrencyLogo from '../../../components/DoubleLogo'
import { PairState, usePair } from '../../../data/Reserves'
import PairView from '../../../components/Pool/PairView'
import { useRouter } from '../../../hooks/useRouter'
import PairSearchModal from '../../../components/SearchModal/PairSearchModal'

const VoteCard = styled.div`
  overflow: hidden;
  background-color: ${({ theme }) => theme.bg1};
  border: 1px solid ${({ theme }) => theme.bg2};
  border-radius: 8px;
`

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

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

const PointableFlex = styled(Flex)`
  cursor: pointer;
`

export default function Pair({
  match: {
    params: { currencyIdA, currencyIdB }
  }
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const { account } = useActiveWeb3React()
  const router = useRouter()
  const token0 = useToken(currencyIdA)
  const token1 = useToken(currencyIdB)
  const wrappedPair = usePair(token0 || undefined, token1 || undefined)

  const [openPairsModal, setOpenPairsModal] = useState(false)

  const handleAllClick = useCallback(() => {
    setOpenPairsModal(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setOpenPairsModal(false)
  }, [])

  const handlePairSelect = useCallback(
    pair => {
      router.push({
        pathname: `/pools/${pair.token0.address}/${pair.token1.address}`
      })
    },
    [router]
  )

  if (wrappedPair[0] === PairState.INVALID || wrappedPair[0] === PairState.NOT_EXISTS) return <Redirect to="/pools" />
  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />

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
                  <PointableFlex onClick={handleAllClick}>
                    <Box mr="4px">
                      <DoubleCurrencyLogo currency0={token0 || undefined} currency1={token1 || undefined} size={20} />
                    </Box>
                    <Box mr="4px">
                      <Text fontWeight="600" fontSize="16px" lineHeight="20px">
                        {token0?.symbol}/{token1?.symbol}
                      </Text>
                    </Box>
                  </PointableFlex>
                  <Box>
                    <ChevronDown size={12} />
                  </Box>
                </Flex>
              </HideSmall>
              <ButtonRow>
                <ResponsiveButtonSecondary
                  as={Link}
                  padding="8px 14px"
                  to={`/add/${token0?.address}/${token1?.address}`}
                >
                  <Text fontWeight={700} fontSize={12} lineHeight="15px">
                    ADD/REMOVE LIQUIDITY
                  </Text>
                </ResponsiveButtonSecondary>
              </ButtonRow>
            </TitleRow>
            <PairView loading={wrappedPair[1] === null} pair={wrappedPair[1]} />
          </AutoColumn>
        </AutoColumn>
        <ButtonWithLink
          link={`https://dxstats.eth.link/#/account/${account}`}
          text={'ACCOUNT ANALYTICS AND ACCRUED FEES'}
          marginTop="32px"
        />
        <TYPE.body color="text4" textAlign="center" fontWeight="500" fontSize="14px" lineHeight="17px" marginTop="32px">
          Don't see a pool you joined?{' '}
          <StyledInternalLink color="text5" id="import-pool-link" to="/find">
            Import it.
          </StyledInternalLink>
        </TYPE.body>

        <VoteCard style={{ marginTop: '32px' }}>
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.body fontWeight={600} lineHeight="20px">
                  Liquidity provider rewards
                </TYPE.body>
              </RowBetween>
              <RowBetween>
                <TYPE.body fontWeight="500" fontSize="12px" lineHeight="20px" letterSpacing="-0.4px">
                  Liquidity providers earn a swap fee (0.25% by default) on all trades proportional to their share of
                  the pool.
                  <br /> Fees are added to the pool, accrue in real time and can be claimed by withdrawing your
                  liquidity.
                  <br /> The swap fee value is decided by DXdao and liquidty providers, it can be between 0% and 10% and
                  it uses 0.25% as default value that is assigned when the pair is created.
                </TYPE.body>
              </RowBetween>
              {/*<RowBetween>*/}
              {/*  /!* TODO: this should be a link to a blog post or something *!/*/}
              {/*  <TYPE.body fontSize="14px" lineHeight="17px" style={{ textDecoration: 'underline' }}>*/}
              {/*    Read more about providing liquidity*/}
              {/*  </TYPE.body>*/}
              {/*</RowBetween>*/}
            </AutoColumn>
          </CardSection>
        </VoteCard>
      </PageWrapper>
      <PairSearchModal isOpen={openPairsModal} onDismiss={handleModalClose} onPairSelect={handlePairSelect} />
    </>
  )
}
