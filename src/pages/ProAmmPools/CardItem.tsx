import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { ChevronUp, Share2 } from 'react-feather'
import { Link, useHistory } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import AgriCulture from 'components/Icons/AgriCulture'
import InfoHelper from 'components/InfoHelper'
import { MouseoverTooltip } from 'components/Tooltip'
import { ELASTIC_BASE_FEE_UNIT, PROMM_ANALYTICS_URL } from 'constants/index'
import { nativeOnChain } from 'constants/tokens'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { IconWrapper } from 'pages/Pools/styleds'
import { useToggleEthPowAckModal } from 'state/application/hooks'
import { useProMMFarms } from 'state/farms/promm/hooks'
import { useUrlOnEthPowAck } from 'state/pools/hooks'
import { ProMMPoolData } from 'state/prommPools/hooks'
import { ExternalLink } from 'theme'
import { isAddressString, shortenAddress } from 'utils'
import { formatDollarAmount } from 'utils/numbers'

interface ListItemProps {
  pair: ProMMPoolData[]
  idx: number
  onShared: (id: string) => void
  userPositions: { [key: string]: number }
}

const getPrommAnalyticLink = (chainId: ChainId | undefined, poolAddress: string) => {
  if (!chainId) return ''
  return `${PROMM_ANALYTICS_URL[chainId]}/pool/${poolAddress.toLowerCase()}`
}

export const Wrapper = styled.div`
  position: relative;
  padding: 20px 16px;
  font-size: 12px;
  background-color: ${({ theme }) => theme.background};
  border-radius: 20px;
  margin-bottom: 20px;
`

const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text};
  flex-direction: column;
`

const PoolAddressContainer = styled(Flex)`
  align-items: center;
`

const ButtonIcon = styled(ButtonEmpty)`
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  width: 28px;
  height: 28px;
  border-radius: 50%;
  padding: 0;
  color: ${({ theme }) => theme.subText};
`

export default function ProAmmPoolCardItem({ pair, onShared, userPositions, idx }: ListItemProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const [isOpen, setIsOpen] = useState(true)
  const history = useHistory()
  const [, setUrlOnEthPoWAck] = useUrlOnEthPowAck()
  const toggleEthPowAckModal = useToggleEthPowAckModal()

  const allTokens = useAllTokens()
  const { data: farms } = useProMMFarms()
  const token0 =
    allTokens[isAddressString(pair[0].token0.address)] ||
    new Token(chainId as ChainId, pair[0].token0.address, pair[0].token0.decimals, pair[0].token0.symbol)
  const token1 =
    allTokens[isAddressString(pair[0].token1.address)] ||
    new Token(chainId as ChainId, pair[0].token1.address, pair[0].token1.decimals, pair[0].token1.symbol)

  const token0Address =
    token0.address.toLowerCase() === WETH[chainId as ChainId].address.toLowerCase()
      ? nativeOnChain(chainId as ChainId).symbol
      : token0.address
  const token0Symbol =
    token0.address.toLowerCase() === WETH[chainId as ChainId].address.toLowerCase()
      ? nativeOnChain(chainId as ChainId).symbol
      : token0.symbol
  const token1Address =
    token1.address.toLowerCase() === WETH[chainId as ChainId].address.toLowerCase()
      ? nativeOnChain(chainId as ChainId).symbol
      : token1.address
  const token1Symbol =
    token1.address.toLowerCase() === WETH[chainId as ChainId].address.toLowerCase()
      ? nativeOnChain(chainId as ChainId).symbol
      : token1.symbol
  return (
    <>
      <Flex justifyContent="space-between" marginBottom="20px" marginTop={idx === 0 ? 0 : '20px'}>
        <Flex alignItems="center">
          <DoubleCurrencyLogo size={24} currency0={token0} currency1={token1} />
          <Text fontSize={20} fontWeight="500">
            {token0Symbol} - {token1Symbol}
          </Text>
        </Flex>
        <ButtonIcon
          disabled={pair.length === 1}
          onClick={() => {
            pair.length > 1 && setIsOpen(prev => !prev)
          }}
        >
          <ChevronUp
            size="20px"
            color={theme.subText}
            style={{
              transition: 'transform 0.2s',
              transform: `rotate(${isOpen && pair.length > 1 ? '0' : '180deg'})`,
            }}
          />
        </ButtonIcon>
      </Flex>
      {pair.map((pool, index) => {
        const myLiquidity = userPositions[pool.address]
        const hasLiquidity = pool.address in userPositions
        if (pair.length > 1 && index !== 0 && !isOpen) return null

        const isFarmingPool = Object.values(farms)
          .flat()
          .filter(item => item.endTime > +new Date() / 1000)
          .map(item => item.poolAddress.toLowerCase())
          .includes(pool.address.toLowerCase())

        return (
          <Wrapper key={pool.address}>
            {isFarmingPool && (
              <div
                style={{
                  overflow: 'hidden',
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                }}
              >
                <MouseoverTooltip text={t`Available for yield farming`}>
                  <IconWrapper style={{ width: '24px', height: '24px' }}>
                    <AgriCulture width={16} height={16} color={theme.textReverse} />
                  </IconWrapper>
                </MouseoverTooltip>
              </div>
            )}
            <DataText justifyContent="center" marginBottom="1rem">
              <PoolAddressContainer>
                <Text color={theme.text} fontSize="16px">
                  {shortenAddress(pool.address, 3)}
                </Text>
                <CopyHelper toCopy={pool.address} />
              </PoolAddressContainer>
              <Flex marginTop={'4px'}>
                <Text color={theme.subText} fontSize={12}>
                  Fee = {(pool.feeTier * 100) / ELASTIC_BASE_FEE_UNIT}%
                </Text>
                <InfoHelper
                  text={t`A token pair can have multiple pools, each with a different swap fee. Your swap fee earnings will be automatically reinvested in your pool`}
                />
              </Flex>
            </DataText>
            <Divider />

            <Flex marginTop="20px" justifyContent="space-between">
              <Text color={theme.subText} fontWeight="500">
                <Trans>Total Value Locked</Trans>
              </Text>
              <Text>{formatDollarAmount(pool.tvlUSD)}</Text>
            </Flex>

            <Flex marginTop="16px" justifyContent="space-between">
              <Text color={theme.subText} fontWeight="500">
                AVG APR
                <InfoHelper size={14} text={t`Average estimated return based on yearly fees of the pool`} />
              </Text>
              <DataText alignItems="flex-end" color={theme.apr}>
                {pool.apr.toFixed(2)}%
              </DataText>
            </Flex>

            <Flex marginTop="16px" justifyContent="space-between">
              <Text color={theme.subText} fontWeight="500">
                <Trans>Volume (24H)</Trans>
              </Text>
              <Text>{formatDollarAmount(pool.volumeUSD)}</Text>
            </Flex>

            <Flex marginTop="16px" justifyContent="space-between">
              <Text color={theme.subText} fontWeight="500">
                <Trans>Fees (24H)</Trans>
              </Text>
              <Text>{formatDollarAmount(pool.volumeUSD * (pool.feeTier / ELASTIC_BASE_FEE_UNIT))}</Text>
            </Flex>

            <Flex marginTop="16px" justifyContent="space-between">
              <Text color={theme.subText} fontWeight="500">
                <Trans>Your Liquidity Balance</Trans>
              </Text>
              <Text>{myLiquidity ? formatDollarAmount(Number(myLiquidity)) : '-'}</Text>
            </Flex>

            <Flex marginY="20px" justifyContent="space-between" fontSize="14px" style={{ gap: '16px' }}>
              {hasLiquidity && (
                <ButtonOutlined as={Link} to={`/myPools?tab=${VERSION.ELASTIC}search=${pool.address}`} padding="10px">
                  <Text width="max-content" fontSize="14px">
                    <Trans>View Positions</Trans>
                  </Text>
                </ButtonOutlined>
              )}

              <ButtonPrimary
                padding="10px"
                onClick={() => {
                  const url = myLiquidity
                    ? `/myPools?tab=${VERSION.ELASTIC}&search=${pool.address}`
                    : `/elastic/add/${token0Address}/${token1Address}/${pool.feeTier}`

                  if (chainId === ChainId.ETHW) {
                    setUrlOnEthPoWAck(url)
                    toggleEthPowAckModal()
                  } else {
                    history.push(url)
                  }
                }}
              >
                <Text width="max-content" fontSize="14px">
                  <Trans>Add Liquidity</Trans>
                </Text>
              </ButtonPrimary>
            </Flex>

            <Divider />

            <Flex marginTop="16px" fontSize="14px" justifyContent="space-between">
              <ExternalLink href={getPrommAnalyticLink(chainId, pool.address)}>Analytics ↗</ExternalLink>

              <ButtonEmpty
                width="max-content"
                padding="0"
                onClick={e => {
                  e.stopPropagation()
                  onShared(pool.address)
                }}
              >
                <Text marginRight="4px">
                  <Trans>Share</Trans>
                </Text>
                <Share2 size="14px" color={theme.primary} />
              </ButtonEmpty>
            </Flex>
          </Wrapper>
        )
      })}
    </>
  )
}
