import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMountedState } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import { MouseoverTooltip } from 'components/Tooltip'
import { getNumberOfInsufficientFundOrders } from 'components/swapv2/LimitOrder/request'
import { Tab } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { getLimitOrderContract } from 'utils'

const WarningBadge = styled.span`
  display: inline-block;
  min-width: 20px;
  padding: 2px 6px;
  color: ${({ theme }) => theme.warning};
  background-color: ${({ theme }) => rgba(theme.warning, 0.3)};
  border-radius: 20px;
  font-weight: 500;
  font-size: 14px;
`

type Props = {
  onClick: () => void
}
export default function LimitTab({ onClick }: Props) {
  const { chainId, account } = useActiveWeb3React()
  const { pathname } = useLocation()
  const [numberOfInsufficientFundOrders, setNumberOfInsufficientFundOrders] = useState(0)

  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)
  const isSupportLimitOrder = getLimitOrderContract(chainId)

  const getMountedState = useMountedState()

  useEffect(() => {
    if (!isSupportLimitOrder || !account) {
      return
    }

    const run = async () => {
      try {
        const num = await getNumberOfInsufficientFundOrders({
          chainId,
          maker: account || '',
        })

        getMountedState() && setNumberOfInsufficientFundOrders(num)
      } catch (e) {
        console.error(e)
      }
    }

    run()
    const interval = setInterval(run, 10_000)

    return () => {
      clearInterval(interval)
    }
  }, [account, chainId, isSupportLimitOrder, getMountedState])

  if (!isSupportLimitOrder) {
    return null
  }

  return (
    <Tab onClick={onClick} isActive={isLimitPage}>
      <Text fontSize={20} fontWeight={500}>
        <Trans>Limit</Trans>{' '}
        {numberOfInsufficientFundOrders ? (
          <MouseoverTooltip
            placement="top"
            text={
              <Trans>
                You have {numberOfInsufficientFundOrders} active orders that don&apos;t have sufficient funds
              </Trans>
            }
          >
            <WarningBadge>{numberOfInsufficientFundOrders}</WarningBadge>
          </MouseoverTooltip>
        ) : null}
      </Text>
    </Tab>
  )
}
