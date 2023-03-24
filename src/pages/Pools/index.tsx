import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfacePageName } from '@uniswap/analytics-events'
import PoolTable from 'components/Pools/PoolTable'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { filterStringAtom } from 'components/Tokens/state'
import { MouseoverTooltip } from 'components/Tooltip'
import { useResetAtom } from 'jotai/utils'
import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { usePoolDatas } from './poolData'

const ExploreContainer = styled.div`
  width: 100%;
  min-width: 320px;
  padding: 68px 12px 0px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`
const TitleContainer = styled.div`
  margin-bottom: 32px;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin-left: auto;
  margin-right: auto;
  display: flex;
`
function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}

const Pools = () => {
  const resetFilterString = useResetAtom(filterStringAtom)
  const location = useLocation()
  const allPoolData = usePoolDatas()

  const poolDatas = useMemo(() => {
    return Object.values(allPoolData.data ?? {})
      .map((p) => p)
      .filter(notEmpty)
  }, [allPoolData])
  useEffect(() => {
    resetFilterString()
  }, [location, resetFilterString])

  return (
    <Trace page={InterfacePageName.TOKENS_PAGE} shouldLogImpression>
      <ExploreContainer>
        <TitleContainer>
          <MouseoverTooltip
            text={<Trans>This table contains the top pools by volume, sorted based on your input.</Trans>}
            placement="bottom"
          >
            <ThemedText.LargeHeader>
              <Trans>Top pools on Forge</Trans>
            </ThemedText.LargeHeader>
          </MouseoverTooltip>
        </TitleContainer>
        <PoolTable poolDatas={poolDatas} />
      </ExploreContainer>
    </Trace>
  )
}

export default Pools
