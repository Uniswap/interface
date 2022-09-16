import { t } from '@lingui/macro'
import { Box, Flex, Text } from 'rebass'

import { MoneyBag } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { useProMMFarmTVL } from 'state/farms/promm/hooks'

type Props = {
  poolAPR: number
  fairlaunchAddress: string
  pid: number
}

export const APRTooltipContent = ({ poolAPR, farmAPR }: { poolAPR: number; farmAPR: number }) => {
  const theme = useTheme()

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        background: theme.tableHeader,
        gap: '8px',
        width: 'fit-content',
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
          sx={{ whiteSpace: 'nowrap' }}
        >{t`Estimated return from trading fees if you participate in the pool`}</Text>
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
          sx={{ whiteSpace: 'nowrap' }}
        >{t`Estimated return from additional rewards if you also participate in the farm`}</Text>
      </Flex>
    </Flex>
  )
}

const FarmingPoolAPRCell: React.FC<Props> = ({ poolAPR, fairlaunchAddress, pid }) => {
  const theme = useTheme()
  const { farmAPR } = useProMMFarmTVL(fairlaunchAddress, pid)

  return (
    <Flex
      alignItems={'center'}
      sx={{
        gap: '4px',
      }}
    >
      {(poolAPR + farmAPR).toFixed(2)}%
      <MouseoverTooltip
        width="fit-content"
        placement="right"
        text={<APRTooltipContent farmAPR={farmAPR} poolAPR={poolAPR} />}
      >
        <MoneyBag size={16} color={theme.apr} />
      </MouseoverTooltip>
    </Flex>
  )
}

export default FarmingPoolAPRCell
