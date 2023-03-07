import { Fraction } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Placement } from '@popperjs/core'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import { MoneyBag } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { Farm } from 'state/farms/classic/types'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { useFarmApr } from 'utils/dmm'

type Props = {
  poolAPR: number
  fairlaunchAddress: string
  pid: number
  tooltipPlacement?: Placement
}

export const APRTooltipContent = ({ poolAPR, farmAPR }: { poolAPR: number; farmAPR: number }) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        background: theme.tableHeader,
        gap: '8px',
        width: upToSmall ? '300px' : 'fit-content',
      }}
    >
      <Text as="span" fontSize={'14px'}>
        Total APR:{' '}
        <Text as="span" color={theme.text} fontWeight={500}>
          {(poolAPR + farmAPR).toFixed(2)}%
        </Text>
      </Text>
      <Box
        sx={{
          width: '100%',
          borderBottom: `1px solid ${theme.border}`,
        }}
      ></Box>
      <Flex
        sx={{
          flexDirection: 'column',
          fontSize: '12px',
          lineHeight: '16px',
        }}
      >
        <Text as="span">
          Pool APR:{' '}
          <Text as="span" color={theme.text} fontWeight={500}>
            {poolAPR.toFixed(2)}%
          </Text>
        </Text>
        <Text
          as="span"
          fontStyle="italic"
          sx={{
            whiteSpace: upToSmall ? 'wrap' : 'nowrap',
          }}
        >
          <Trans>Estimated return from trading fees if you participate in the pool</Trans>
        </Text>
      </Flex>

      <Flex
        sx={{
          flexDirection: 'column',
          fontSize: '12px',
          lineHeight: '16px',
        }}
      >
        <Text as="span" color={theme.warning}>
          Farm APR:{' '}
          <Text as="span" fontWeight={500}>
            {farmAPR.toFixed(2)}%
          </Text>
        </Text>
        <Text
          as="span"
          fontStyle="italic"
          sx={{
            whiteSpace: upToSmall ? 'wrap' : 'nowrap',
          }}
        >
          <Trans>Estimated return from additional rewards if you also participate in the farm</Trans>
        </Text>
      </Flex>
    </Flex>
  )
}

const FarmingPoolAPRCell: React.FC<Props> = ({ poolAPR, fairlaunchAddress, pid, tooltipPlacement = 'right' }) => {
  const theme = useTheme()

  const { farms } = useElasticFarms()
  const pool = farms
    ?.find(farm => farm.id.toLowerCase() === fairlaunchAddress.toLowerCase())
    ?.pools.find(pool => Number(pool.pid) === Number(pid))

  const tokenPrices = useTokenPrices(
    [
      pool?.token0.wrapped.address,
      pool?.token1.wrapped.address,
      ...(pool?.rewardTokens.map(rw => rw.wrapped.address) as string[]),
    ].filter(address => !!address) as string[],
  )

  let farmAPR = 0
  if (pool) {
    const totalRewardValue = pool.totalRewards.reduce(
      (total, rw) => total + Number(rw.toExact()) * tokenPrices[rw.currency.wrapped.address],
      0,
    )

    const farmDuration = (pool.endTime - pool.startTime) / 86400
    farmAPR = (365 * 100 * (totalRewardValue || 0)) / farmDuration / pool.poolTvl
  }

  return (
    <Flex
      alignItems={'center'}
      sx={{
        gap: '4px',
      }}
    >
      <Text as="span">{(poolAPR + farmAPR).toFixed(2)}%</Text>
      <MouseoverTooltip
        width="fit-content"
        placement={tooltipPlacement}
        text={<APRTooltipContent farmAPR={farmAPR} poolAPR={poolAPR} />}
      >
        <MoneyBag size={16} color={theme.apr} />
      </MouseoverTooltip>
    </Flex>
  )
}

export const ClassicFarmingPoolAPRCell = ({ poolAPR, farm }: { poolAPR: number; farm: Farm }) => {
  const theme = useTheme()
  const lpTokenRatio = new Fraction(
    farm.totalStake.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)),
  ).divide(
    new Fraction(parseUnits(farm.totalSupply, 18).toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))),
  )
  const liquidity = parseFloat(lpTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)
  const farmAPR = useFarmApr(farm, liquidity.toString())

  return (
    <Flex
      alignItems={'center'}
      sx={{
        gap: '4px',
      }}
    >
      <Text as="span">{(poolAPR + farmAPR).toFixed(2)}%</Text>
      <MouseoverTooltip width="fit-content" text={<APRTooltipContent farmAPR={farmAPR} poolAPR={poolAPR} />}>
        <MoneyBag size={16} color={theme.apr} />
      </MouseoverTooltip>
    </Flex>
  )
}

export default FarmingPoolAPRCell
