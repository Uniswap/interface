import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import { SwapPoolTabs } from '../../../components/NavigationTabs'
import { PageWrapper } from '../styleds'

import { TYPE } from '../../../theme'
import { Box, Flex, Text } from 'rebass'
import { RowBetween } from '../../../components/Row'
import { AutoColumn } from '../../../components/Column'

import { ChevronDown } from 'react-feather'
import { useToken } from '../../../hooks/Tokens'
import { UndecoratedLink } from '../../../components/UndercoratedLink'
import DoubleCurrencyLogo from '../../../components/DoubleLogo'
import { PairState, usePair } from '../../../data/Reserves'
import { useRouter } from '../../../hooks/useRouter'
import PairSearchModal from '../../../components/SearchModal/PairSearchModal'
import Skeleton from 'react-loading-skeleton'
import LiquidityMiningCampaignView from '../../../components/Pool/LiquidityMiningCampaignView'
import { useLiquidityMiningCampaign } from '../../../hooks/useLiquidityMiningCampaign'

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const PointableFlex = styled(Flex)`
  border: solid 1px ${props => props.theme.bg3};
  border-radius: 8px;
  height: 36px;
  align-items: center;
  padding: 0 10px;
  cursor: pointer;
`

export default function LiquidityMiningCampaign({
  match: {
    params: { currencyIdA, currencyIdB, liquidityMiningCampaignId }
  }
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string; liquidityMiningCampaignId: string }>) {
  const router = useRouter()
  const token0 = useToken(currencyIdA)
  const token1 = useToken(currencyIdB)
  const wrappedPair = usePair(token0 || undefined, token1 || undefined)
  const { campaign } = useLiquidityMiningCampaign(wrappedPair[1] || undefined, liquidityMiningCampaignId)

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

  if (token0 && token1 && (wrappedPair[0] === PairState.NOT_EXISTS || wrappedPair[0] === PairState.INVALID))
    return <Redirect to="/pools" />
  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />

        <AutoColumn gap="lg" justify="center">
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
                    <DoubleCurrencyLogo
                      loading={!token0 || !token1}
                      currency0={token0 || undefined}
                      currency1={token1 || undefined}
                      size={20}
                    />
                  </Box>
                  <Box mr="4px">
                    <Text fontWeight="600" fontSize="16px" lineHeight="20px">
                      {!token0 || !token1 ? <Skeleton width="60px" /> : `${token0.symbol}/${token1.symbol}`}
                    </Text>
                  </Box>
                  <Box>
                    <ChevronDown size={12} />
                  </Box>
                </PointableFlex>
              </Flex>
            </TitleRow>
            <LiquidityMiningCampaignView campaign={campaign} />
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <PairSearchModal isOpen={openPairsModal} onDismiss={handleModalClose} onPairSelect={handlePairSelect} />
    </>
  )
}
