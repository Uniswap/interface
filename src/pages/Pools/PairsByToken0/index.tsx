import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { Link, Redirect, RouteComponentProps } from 'react-router-dom'
import { SwapPoolTabs } from '../../../components/NavigationTabs'
import { PageWrapper } from '../styleds'

import { TYPE } from '../../../theme'
import { Box, Flex, Text } from 'rebass'
import { RowBetween, RowFixed } from '../../../components/Row'
import { ButtonPrimary, ButtonSecondary, ButtonWithLink } from '../../../components/Button'
import { AutoColumn } from '../../../components/Column'

import { ChevronDown } from 'react-feather'
import { CardSection } from '../../../components/earn/styled'
import { useToken } from '../../../hooks/Tokens'
import CurrencyLogo from '../../../components/CurrencyLogo'
import { UndecoratedLink } from '../../../components/UndercoratedLink'
import CurrencySearchModal from '../../../components/SearchModal/CurrencySearchModal'
import { useRouter } from '../../../hooks/useRouter'
import { useLiquidityMiningFeatureFlag } from '../../../hooks/useLiquidityMiningFeatureFlag'
import { usePairsByToken0 } from '../../../hooks/usePairsByToken0'
import PairsList from '../../../components/Pool/PairsList'
import { useActiveWeb3React } from '../../../hooks'

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
  gap: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: column;
    justify-content: space-between;
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

const PointableFlex = styled(Flex)`
  cursor: pointer;
`

export default function PairsByToken0({
  match: {
    params: { currencyIdA }
  }
}: RouteComponentProps<{ currencyIdA: string }>) {
  const { account, chainId } = useActiveWeb3React()
  const router = useRouter()
  const token0 = useToken(currencyIdA)
  const { loading: loadingPairs, pairs } = usePairsByToken0(token0)
  const liquidityMiningEnabled = useLiquidityMiningFeatureFlag()

  const [openTokenModal, setOpenTokenModal] = useState(false)

  const handleAllClick = useCallback(() => {
    setOpenTokenModal(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setOpenTokenModal(false)
  }, [])

  const handleCurrencySelect = useCallback(
    token => {
      router.push({
        pathname: `/pools/${token.address}`
      })
    },
    [router]
  )

  if (token0 === undefined) {
    return <Redirect to="/pools" />
  }
  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />

        <AutoColumn gap="lg">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
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
                    <CurrencyLogo currency={token0 || undefined} size="20px" />
                  </Box>
                  <Box mr="4px">
                    <Text fontWeight="600" fontSize="16px" lineHeight="20px">
                      {token0?.symbol}
                    </Text>
                  </Box>
                </PointableFlex>
                <Box>
                  <ChevronDown size={12} />
                </Box>
              </Flex>
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
        {account && (
          <ButtonWithLink
            link={`https://dxstats.eth.link/#/account/${account}?chainId=${chainId}`}
            text={'ACCOUNT ANALYTICS AND ACCRUED FEES'}
            marginTop="32px"
          />
        )}
        {/* Should not be needed since when we fetch liquidity positions from the subgraph */}
        {/* <TYPE.body color="text4" textAlign="center" fontWeight="500" fontSize="14px" lineHeight="17px" marginTop="32px">
          Don't see a pool you joined?{' '}
          <StyledInternalLink color="text5" id="import-pool-link" to="/find">
            Import it.
          </StyledInternalLink>
        </TYPE.body> */}

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
                  Liquidity providers earn a swap fee (0.25% by default, of which ~10% taken by the protocol as a fee)
                  on all trades proportional to their share of the pool.
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
      <CurrencySearchModal
        isOpen={openTokenModal}
        onDismiss={handleModalClose}
        onCurrencySelect={handleCurrencySelect}
        showNativeCurrency={false}
      />
    </>
  )
}
