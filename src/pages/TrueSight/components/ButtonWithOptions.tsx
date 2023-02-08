import { getAddress } from '@ethersproject/address'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { CSSProperties, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { ReactComponent as ChevronDown } from 'assets/svg/down.svg'
import { ButtonPrimary } from 'components/Button'
import Cart from 'components/Icons/Cart'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO, TRUESIGHT_NETWORK_TO_CHAINID } from 'constants/networks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { OptionsContainer } from 'pages/TrueSight/styled'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'

const ButtonWithOptions = ({
  platforms,
  style,
  tokenData,
  variant = 'primary',
}: {
  platforms: Map<string, string>
  style?: CSSProperties
  tokenData: TrueSightTokenData
  variant?: 'primary' | 'light'
}) => {
  const theme = useTheme()
  const [isShowNetworks, setIsShowNetworks] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(containerRef, () => setIsShowNetworks(false))

  const { tab } = useParsedQueryString<{ tab: string }>()
  const { mixpanelHandler } = useMixpanel()

  const triggerDiscoverSwapInitiated = (platform: string) => {
    mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SWAP_INITIATED, {
      token_name: tokenData.name,
      token_on_chain: tokenData.present_on_chains.map(chain => chain.toUpperCase()),
      token_contract_address: getAddress(platforms.get(platform) ?? ''),
      trending_or_trending_soon: tab === 'trending' ? 'Trending' : 'Trending Soon',
    })
  }

  const location = useLocation()
  const navigate = useNavigate()
  const isInSwapPage = location.pathname.startsWith(APP_PATHS.SWAP)
  const toggleTrendingSoonTokenDetailModal = useToggleModal(ApplicationModal.TRENDING_SOON_TOKEN_DETAIL)

  return (
    <ButtonPrimary
      minWidth="160px"
      width="fit-content"
      padding="0 36px"
      fontSize="14px"
      style={{
        position: 'relative',
        zIndex: 1,
        height: '36px',
        background: rgba(theme.primary, variant === 'light' ? 0.2 : 1),
        ...style,
      }}
      onClick={e => {
        e.stopPropagation()
        setIsShowNetworks(prev => !prev)
      }}
      ref={containerRef}
    >
      <Cart color={variant === 'light' ? theme.primary : theme.textReverse} />
      <ChevronDown
        color={variant === 'light' ? theme.primary : theme.textReverse}
        style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)' }}
      />
      {isShowNetworks && (
        <OptionsContainer>
          {Array.from(platforms.keys()).map(platform => {
            const mappedChainId = platform ? TRUESIGHT_NETWORK_TO_CHAINID[platform] : undefined
            if (mappedChainId) {
              if (isInSwapPage)
                return (
                  <Flex
                    key={platform}
                    alignItems="center"
                    onClick={() => {
                      toggleTrendingSoonTokenDetailModal()
                      navigate(
                        `/swap/${NETWORKS_INFO[mappedChainId].route}?inputCurrency=ETH&outputCurrency=${getAddress(
                          platforms.get(platform) ?? '',
                        )}`,
                      )
                      mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SWAP_BUY_NOW_POPUP_CLICKED, {
                        trending_token: tokenData.symbol,
                      })
                    }}
                  >
                    <img
                      src={NETWORKS_INFO[mappedChainId].icon}
                      alt="Network"
                      style={{ minWidth: '16px', width: '16px' }}
                    />
                    <Text
                      marginLeft="4px"
                      color={theme.subText}
                      fontSize="12px"
                      fontWeight={500}
                      minWidth="fit-content"
                    >
                      <Trans>Swap on {NETWORKS_INFO[mappedChainId].name}</Trans>
                    </Text>
                  </Flex>
                )
              return (
                <Flex
                  key={platform}
                  alignItems="center"
                  as={ExternalLink}
                  href={`/swap/${NETWORKS_INFO[mappedChainId].route}?inputCurrency=ETH&outputCurrency=${getAddress(
                    platforms.get(platform) ?? '',
                  )}`}
                  onClick={() => {
                    triggerDiscoverSwapInitiated(platform)
                  }}
                >
                  <img
                    src={NETWORKS_INFO[mappedChainId].icon}
                    alt="Network"
                    style={{ minWidth: '16px', width: '16px' }}
                  />
                  <Text marginLeft="4px" color={theme.subText} fontSize="12px" fontWeight={500} minWidth="fit-content">
                    <Trans>Swap on {NETWORKS_INFO[mappedChainId].name}</Trans>
                  </Text>
                </Flex>
              )
            }
            return null
          })}
        </OptionsContainer>
      )}
    </ButtonPrimary>
  )
}

export default ButtonWithOptions
