import { Trans } from '@lingui/macro'
import { useState } from 'react'
import styled from 'styled-components'

import { GreyCard } from 'components/Card'
import { ColumnCenter } from 'components/Column'
import Loader from 'components/Loader'
import { RowFixed } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useInterval from 'hooks/useInterval'
import useTheme from 'hooks/useTheme'

const ConfirmedIcon = styled(ColumnCenter)`
  width: 40px;
`
const CountdountNumber = styled.div`
  position: absolute;
  margin-top: 7px;
`

function HurryUpBanner({ startedTime }: { startedTime: number | undefined }) {
  const theme = useTheme()
  const { isSolana } = useActiveWeb3React()
  const [, rerender] = useState({})

  useInterval(() => rerender({}), 1000)

  if (!startedTime) return null
  if (!isSolana) return null

  const currentTime = Math.round((Date.now() - startedTime) / 1000) + 1
  const color = currentTime <= 5 ? theme.green : currentTime <= 10 ? theme.yellow1 : theme.red2

  return (
    <GreyCard style={{ padding: '12px 16px', marginTop: '24px', fontSize: '12px' }}>
      <RowFixed style={{ gap: '8px' }}>
        <ConfirmedIcon>
          <CountdountNumber style={{ color }}>{currentTime}</CountdountNumber>
          <Loader size="28px" stroke={color} />
        </ConfirmedIcon>

        <Trans>We&apos;ve got you the best price! Confirm soon to lock-in this rate</Trans>
      </RowFixed>
    </GreyCard>
  )
}

export default HurryUpBanner
