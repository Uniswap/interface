import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo } from 'react'
import { BarChart2, Plus, Share2 } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import bgimg from 'assets/images/card-background.png'
import { ReactComponent as ViewPositionIcon } from 'assets/svg/view_positions.svg'
import { ButtonLight, ButtonOutlined } from 'components/Button'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MoneyBag } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT, PROMM_ANALYTICS_URL } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { IconWrapper } from 'pages/Pools/styleds'
import { useToggleEthPowAckModal } from 'state/application/hooks'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { useUrlOnEthPowAck } from 'state/pools/hooks'
import { ExternalLink } from 'theme'
import { ElasticPoolDetail } from 'types/pool'
import { isAddressString, shortenAddress } from 'utils'
import { formatDollarAmount } from 'utils/numbers'

const StyledLink = styled(ExternalLink)`
  :hover {
    text-decoration: none;
  }
`

interface ListItemProps {
  pool: ElasticPoolDetail
  onShared: (id: string) => void
  userPositions: { [key: string]: number }
}

const getPrommAnalyticLink = (chainId: ChainId, poolAddress: string) => {
  if (!chainId) return ''
  return `${PROMM_ANALYTICS_URL[chainId]}/pool/${poolAddress.toLowerCase()}`
}

const Wrapper = styled.div`
  border-radius: 20px;
  padding: 16px;
  background-image: url(${bgimg});
  background-size: cover;
  background-repeat: no-repeat;
  background-color: ${({ theme }) => theme.buttonBlack};
`
export default function ProAmmPoolCardItem({ pool, onShared, userPositions }: ListItemProps) {
  const { chainId, networkInfo } = useActiveWeb3React()
  const theme = useTheme()
  const navigate = useNavigate()
  const [, setUrlOnEthPoWAck] = useUrlOnEthPowAck()
  const toggleEthPowAckModal = useToggleEthPowAckModal()

  const allTokens = useAllTokens()
  const { farms } = useElasticFarms()

  const token0 =
    allTokens[isAddressString(chainId, pool.token0.address)] ||
    new Token(chainId, pool.token0.address, pool.token0.decimals, pool.token0.symbol)
  const token1 =
    allTokens[isAddressString(chainId, pool.token1.address)] ||
    new Token(chainId, pool.token1.address, pool.token1.decimals, pool.token1.symbol)

  const nativeToken = NativeCurrencies[chainId]

  const isToken0WETH = token0.address.toLowerCase() === WETH[chainId].address.toLowerCase()
  const isToken1WETH = token1.address.toLowerCase() === WETH[chainId].address.toLowerCase()

  const token0Slug = isToken0WETH ? nativeToken.symbol : token0.address
  const token0Symbol = isToken0WETH ? nativeToken.symbol : token0.symbol

  const token1Slug = isToken1WETH ? nativeToken.symbol : token1.address
  const token1Symbol = isToken1WETH ? nativeToken.symbol : token1.symbol

  const myLiquidity = userPositions[pool.address]
  const hasLiquidity = pool.address in userPositions

  const isFarmingPool: boolean = useMemo(() => {
    let fairlaunchAddress = ''
    let pid = -1

    farms?.forEach(farm => {
      const p = farm.pools
        .filter(item => item.endTime > Date.now() / 1000)
        .find(item => item.poolAddress.toLowerCase() === pool.address.toLowerCase())

      if (p) {
        fairlaunchAddress = farm.id
        pid = Number(p.pid)
      }
    })

    return !!fairlaunchAddress && pid !== -1
  }, [farms, pool.address])

  return (
    <Wrapper key={pool.address}>
      <Link
        to={`${APP_PATHS.ELASTIC_CREATE_POOL}/${token0Slug}/${token1Slug}/${pool.feeTier}`}
        style={{
          textDecoration: 'none',
        }}
      >
        <Flex alignItems="center">
          <DoubleCurrencyLogo
            size={20}
            currency0={isToken0WETH ? nativeToken : token0}
            currency1={isToken1WETH ? nativeToken : token1}
          />
          <Text fontSize={16} fontWeight="500">
            {token0Symbol} - {token1Symbol}
          </Text>
          <FeeTag style={{ fontSize: '12px', marginRight: '4px' }}>
            Fee {(pool.feeTier * 100) / ELASTIC_BASE_FEE_UNIT}%
          </FeeTag>

          {isFarmingPool && (
            <MouseoverTooltip
              noArrow
              text={
                <Text>
                  <Trans>
                    Available for yield farming. Click{' '}
                    <Link to={`${APP_PATHS.FARMS}/${networkInfo.route}?tab=elastic&type=active&search=${pool.address}`}>
                      here
                    </Link>{' '}
                    to go to the farm.
                  </Trans>
                </Text>
              }
            >
              <IconWrapper style={{ background: rgba(theme.primary, 0.2), width: '20px', height: '20px' }}>
                <MoneyBag size={12} color={theme.apr} />
              </IconWrapper>
            </MouseoverTooltip>
          )}
        </Flex>
      </Link>

      <Flex
        marginTop="0.75rem"
        alignItems="center"
        sx={{ gap: '6px' }}
        fontSize="12px"
        color={theme.subText}
        width="max-content"
        fontWeight="500"
      >
        <Flex alignItems="center" sx={{ gap: '4px' }}>
          <CopyHelper toCopy={pool.address} />
          <Text>{shortenAddress(chainId, pool.address, 2)}</Text>
        </Flex>

        <Flex
          marginLeft="12px"
          onClick={() => {
            onShared(pool.address)
          }}
          sx={{
            cursor: 'pointer',
            gap: '4px',
          }}
          role="button"
          color={theme.subText}
        >
          <Share2 size="14px" color={theme.subText} />
          <Trans>Share</Trans>
        </Flex>
      </Flex>

      <Text
        width="fit-content"
        lineHeight="16px"
        fontSize="12px"
        fontWeight="500"
        color={theme.subText}
        sx={{ borderBottom: `1px dashed ${theme.border}` }}
        marginTop="16px"
      >
        <MouseoverTooltip
          width="fit-content"
          placement="right"
          text={<APRTooltipContent farmAPR={pool.farmAPR || 0} poolAPR={pool.apr} />}
        >
          <Trans>Avg APR</Trans>
        </MouseoverTooltip>
      </Text>

      <Flex justifyContent="space-between" alignItems="center">
        <Text fontSize="28px" fontWeight="500" color={theme.apr}>
          {((pool.farmAPR || 0) + pool.apr).toFixed(2)}%
        </Text>

        <StyledLink href={getPrommAnalyticLink(chainId, pool.address)}>
          <Flex alignItems="flex-end">
            <BarChart2 size="16px" color={theme.subText} />
            <Text fontSize="12px" fontWeight="500" marginLeft="4px" color={theme.subText}>
              Pool Analytics ↗
            </Text>
          </Flex>
        </StyledLink>
      </Flex>

      <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500" marginTop="1rem">
        <Text>
          <Trans>Volume (24H)</Trans>
        </Text>
        <Text>
          <Trans>Fees (24H)</Trans>
        </Text>
      </Flex>

      <Flex justifyContent="space-between" fontSize="16px" fontWeight="500" marginTop="0.25rem" marginBottom="1rem">
        <Text>{formatDollarAmount(pool.volumeUSDLast24h)}</Text>
        <Text>{formatDollarAmount(pool.volumeUSDLast24h * (pool.feeTier / ELASTIC_BASE_FEE_UNIT))}</Text>
      </Flex>

      <Divider />

      <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500" marginTop="1rem">
        <Text>TVL</Text>
        <Text>My Liquidity</Text>
      </Flex>

      <Flex justifyContent="space-between" fontSize="16px" fontWeight="500" marginTop="0.25rem" marginBottom="1rem">
        <Text>{formatDollarAmount(pool.tvlUSD)}</Text>
        <Text>{myLiquidity ? formatDollarAmount(Number(myLiquidity)) : '-'}</Text>
      </Flex>

      <Flex marginTop="20px" justifyContent="space-between" fontSize="14px" style={{ gap: '16px' }}>
        {hasLiquidity && (
          <ButtonOutlined
            as={Link}
            to={`${APP_PATHS.MY_POOLS}/${networkInfo.route}?tab=${VERSION.ELASTIC}&search=${pool.address}`}
            padding="10px"
            style={{ height: '36px' }}
          >
            <ViewPositionIcon />
            <Text width="max-content" fontSize="14px">
              <Trans>View Positions</Trans>
            </Text>
          </ButtonOutlined>
        )}

        <ButtonLight
          padding="10px"
          style={{ height: '36px' }}
          onClick={() => {
            const url = `${APP_PATHS.ELASTIC_CREATE_POOL}/${token0Slug}/${token1Slug}/${pool.feeTier}`

            if (chainId === ChainId.ETHW) {
              setUrlOnEthPoWAck(url)
              toggleEthPowAckModal()
            } else {
              navigate(url)
            }
          }}
        >
          <Plus size={16} />
          <Text width="max-content" fontSize="14px" marginLeft="4px">
            <Trans>Add Liquidity</Trans>
          </Text>
        </ButtonLight>
      </Flex>
    </Wrapper>
  )
}
