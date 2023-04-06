import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { Clock } from 'components/Icons'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import { useInputCurrency, useOutputCurrency, useSwapState } from 'state/swap/hooks'
import { currencyId } from 'utils/currencyId'

const PriceAlertButton = styled.div`
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
`

export default function SlippageSettingGroup({
  isStablePairSwap,
  isWrapOrUnwrap,
}: {
  isStablePairSwap: boolean
  isWrapOrUnwrap: boolean
}) {
  const theme = useTheme()
  const navigate = useNavigate()
  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()
  const { typedValue } = useSwapState()
  const { chainId } = useActiveWeb3React()

  const priceAlert = (
    <PriceAlertButton
      onClick={() =>
        navigate(
          `${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.CREATE_ALERT}?${stringify({
            amount: typedValue || undefined,
            inputCurrency: currencyId(currencyIn, chainId),
            outputCurrency: currencyId(currencyOut, chainId),
          })}`,
        )
      }
    >
      <Clock size={14} color={theme.subText} />
      <Text color={theme.subText} style={{ whiteSpace: 'nowrap' }}>
        <Trans>Price Alert</Trans>
      </Text>
    </PriceAlertButton>
  )
  return (
    <Flex alignItems="flex-start" fontSize={12} color={theme.subText} justifyContent="space-between">
      {isWrapOrUnwrap ? <div /> : <SlippageSetting isStablePairSwap={isStablePairSwap} rightComponent={priceAlert} />}
      {isWrapOrUnwrap && priceAlert}
    </Flex>
  )
}
