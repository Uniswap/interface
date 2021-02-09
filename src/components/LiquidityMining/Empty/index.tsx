import React from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import { ResponsiveButtonPrimary } from '../../../pages/LiquidityMining/styleds'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const BorderedFlex = styled(Flex)`
  border: solid 1px ${props => props.theme.bg5};
  border-radius: 8px;
`

export default function Empty() {
  const { t } = useTranslation()

  return (
    <BorderedFlex flexDirection="column" alignItems="center" justifyContent="center" width="100%" height="195px">
      <Box mb="24px">
        <Text fontSize="12px" fontWeight="700" lineHeight="15px" letterSpacing="0.08em">
          NO ACTIVE LIQUIDITY MINING
        </Text>
      </Box>
      <Box>
        <ResponsiveButtonPrimary as={Link} padding="8px 14px" to="/liquidity-mining/create">
          <Text fontWeight={700} fontSize={12}>
            {t('liquidityMining.action.create')}
          </Text>
        </ResponsiveButtonPrimary>
      </Box>
    </BorderedFlex>
  )
}
