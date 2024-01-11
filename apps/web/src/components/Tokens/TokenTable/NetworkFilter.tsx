import Badge from 'components/Badge'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { getChainInfo } from 'constants/chainInfo'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import {
  BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS,
  BACKEND_SUPPORTED_CHAINS,
  supportedChainIdFromGQLChain,
  validateUrlChainParam,
} from 'graphql/data/util'
import { useExploreParams } from 'pages/Explore/redirects'
import { Check } from 'react-feather'
import { useNavigate, useParams } from 'react-router-dom'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { css, useTheme } from 'styled-components'
import { EllipsisStyle } from 'theme/components'

const NetworkLabel = styled.div`
  ${EllipsisStyle}
  display: flex;
  gap: 8px;
  align-items: center;
`

const Tag = styled(Badge)`
  background-color: ${({ theme }) => theme.surface2};
  color: ${({ theme }) => theme.neutral2};
  font-size: 10px;
  opacity: 1;
  padding: 4px 6px;
`
const StyledButton = css<{ isInfoExplorePageEnabled: boolean }>`
  ${({ isInfoExplorePageEnabled }) => !isInfoExplorePageEnabled && `min-width: 156px;`}
`
const StyledMenuFlyout = css<{ isInfoExplorePageEnabled: boolean }>`
  max-height: 350px;
  min-width: 240px;

  ${({ isInfoExplorePageEnabled }) =>
    isInfoExplorePageEnabled
      ? css`
          right: 0px;
          @media screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
            left: 0px;
          }
        `
      : css`
          left: 0px;
        `}
`
export default function NetworkFilter() {
  const theme = useTheme()
  const toggleMenu = useToggleModal(ApplicationModal.NETWORK_FILTER)
  const navigate = useNavigate()
  const { tab } = useExploreParams()

  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()

  const currentChainName = validateUrlChainParam(useParams().chainName)
  const chainId = supportedChainIdFromGQLChain(currentChainName)

  const chainInfo = getChainInfo(chainId)

  return (
    <DropdownSelector
      modal={ApplicationModal.NETWORK_FILTER}
      menuLabel={
        <NetworkLabel>
          <ChainLogo chainId={chainId} size={20} /> {!isInfoExplorePageEnabled && chainInfo.label}
        </NetworkLabel>
      }
      internalMenuItems={
        <>
          {BACKEND_SUPPORTED_CHAINS.map((network) => {
            const chainId = supportedChainIdFromGQLChain(network)
            const chainInfo = getChainInfo(chainId)
            return (
              <InternalMenuItem
                key={network}
                data-testid={`tokens-network-filter-option-${network.toLowerCase()}`}
                onClick={() => {
                  isInfoExplorePageEnabled
                    ? navigate(`/explore/${tab}/${network.toLowerCase()}`)
                    : navigate(`/tokens/${network.toLowerCase()}`)
                  toggleMenu()
                }}
              >
                <NetworkLabel>
                  <ChainLogo chainId={chainId} size={20} /> {chainInfo.label}
                </NetworkLabel>
                {network === currentChainName && <Check size={16} color={theme.accent1} />}
              </InternalMenuItem>
            )
          })}
          {BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS.map((network) => {
            const chainInfo = getChainInfo(network)
            return (
              <InternalMenuItem key={network} data-testid={`tokens-network-filter-option-${network}-chain`} disabled>
                <NetworkLabel>
                  <ChainLogo chainId={network} size={20} /> {chainInfo.label}
                </NetworkLabel>
                <Tag>Coming soon</Tag>
              </InternalMenuItem>
            )
          })}
        </>
      }
      buttonCss={StyledButton}
      menuFlyoutCss={StyledMenuFlyout}
    />
  )
}
