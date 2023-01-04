import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfacePageName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { MAX_WIDTH_MEDIA_BREAKPOINT, MEDIUM_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { filterStringAtom } from 'components/Tokens/state'
import NetworkFilter from 'components/Tokens/TokenTable/NetworkFilter'
import SearchBar from 'components/Tokens/TokenTable/SearchBar'
import TimeSelector from 'components/Tokens/TokenTable/TimeSelector'
import TokenTable from 'components/Tokens/TokenTable/TokenTable'
import { MouseoverTooltip } from 'components/Tooltip'
import { chainIdToBackendName, isValidBackendChainName } from 'graphql/data/util'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { useResetAtom } from 'jotai/utils'
import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

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
const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
  height: 40px;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    order: 2;
  }
`
const SearchContainer = styled(FiltersContainer)`
  margin-left: 8px;
  width: 100%;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    margin: 0px;
    order: 1;
  }
`
const FiltersWrapper = styled.div`
  display: flex;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin: 0 auto;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.textTertiary};
  flex-direction: row;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    flex-direction: column;
    gap: 8px;
  }
`

const Tokens = () => {
  const resetFilterString = useResetAtom(filterStringAtom)
  const location = useLocation()
  const navigate = useNavigate()
  const { chainName: chainNameParam } = useParams<{ chainName?: string }>()
  const { chainId: connectedChainId } = useWeb3React()
  const connectedChainName = chainIdToBackendName(connectedChainId)

  useEffect(() => {
    resetFilterString()
  }, [location, resetFilterString])

  useEffect(() => {
    if (!chainNameParam) {
      navigate(`/tokens/${connectedChainName.toLowerCase()}`, { replace: true })
    }
  }, [chainNameParam, connectedChainName, navigate])

  useOnGlobalChainSwitch((chain) => {
    if (isValidBackendChainName(chain)) {
      navigate(`/tokens/${chain.toLowerCase()}`, { replace: true })
    }
  })

  return (
    <Trace page={InterfacePageName.TOKENS_PAGE} shouldLogImpression>
      <ExploreContainer>
        <TitleContainer>
          <MouseoverTooltip
            text={<Trans>This table contains the top tokens by Uniswap volume, sorted based on your input.</Trans>}
            placement="bottom"
          >
            <ThemedText.LargeHeader>
              <Trans>Top tokens on Uniswap</Trans>
            </ThemedText.LargeHeader>
          </MouseoverTooltip>
        </TitleContainer>
        <FiltersWrapper>
          <FiltersContainer>
            <NetworkFilter />
            <TimeSelector />
          </FiltersContainer>
          <SearchContainer>
            <SearchBar />
          </SearchContainer>
        </FiltersWrapper>
        <TokenTable />
      </ExploreContainer>
    </Trace>
  )
}

export default Tokens
