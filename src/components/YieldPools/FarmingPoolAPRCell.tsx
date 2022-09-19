import { Trans } from '@lingui/macro'
import { Placement } from '@popperjs/core'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import { MoneyBag } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { useProMMFarmTVL } from 'state/farms/promm/hooks'
import { MEDIA_WIDTHS } from 'theme'

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
  const { farmAPR } = useProMMFarmTVL(fairlaunchAddress, pid)
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

export default FarmingPoolAPRCell
