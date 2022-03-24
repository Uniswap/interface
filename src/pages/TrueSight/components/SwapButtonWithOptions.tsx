import useTheme from 'hooks/useTheme'
import React, { CSSProperties, useRef, useState } from 'react'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { ButtonPrimary } from 'components/Button'
import { Trans } from '@lingui/macro'
import { ChevronDown } from 'react-feather'
import { Flex, Text } from 'rebass'
import { NETWORK_ICON, NETWORK_LABEL, TRUESIGHT_NETWORK_TO_CHAINID } from 'constants/networks'
import { useHistory } from 'react-router'
import { getAddress } from '@ethersproject/address'
import { OptionsContainer } from 'pages/TrueSight/styled'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import useParsedQueryString from 'hooks/useParsedQueryString'

const SwapButtonWithOptions = ({
  platforms,
  style,
  tokenData,
}: {
  platforms: { [p: string]: string }
  style?: CSSProperties
  tokenData: TrueSightTokenData
}) => {
  const history = useHistory()
  const theme = useTheme()
  const [isShowNetworks, setIsShowNetworks] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(containerRef, () => setIsShowNetworks(false))

  const { tab } = useParsedQueryString()
  const { mixpanelHandler } = useMixpanel()
  return (
    <ButtonPrimary
      minWidth="160px"
      width="fit-content"
      height="36px"
      padding="0 36px"
      fontSize="14px"
      style={{ position: 'relative', zIndex: 2, ...style }}
      onClick={e => {
        e.stopPropagation()
        setIsShowNetworks(prev => !prev)
      }}
      ref={containerRef}
    >
      <Trans>Swap</Trans>
      <ChevronDown
        size="16px"
        style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)' }}
      />
      {isShowNetworks && (
        <OptionsContainer>
          {Object.keys(platforms).map(platform => {
            const mappedChainId = platform ? TRUESIGHT_NETWORK_TO_CHAINID[platform] : undefined
            if (mappedChainId)
              return (
                <Flex
                  key={platform}
                  alignItems="center"
                  onClick={() => {
                    mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SWAP_INITIATED, {
                      token_name: tokenData.name,
                      token_on_chain: tokenData.present_on_chains.map(chain => chain.toUpperCase()),
                      token_contract_address: getAddress(platforms[platform]),
                      trending_or_trending_soon: tab === 'trending' ? 'Trending' : 'Trending Soon',
                    })
                    history.push(
                      `/swap?inputCurrency=ETH&outputCurrency=${getAddress(
                        platforms[platform],
                      )}&networkId=${mappedChainId}`,
                    )
                  }}
                >
                  <img src={NETWORK_ICON[mappedChainId]} alt="Network" style={{ minWidth: '16px', width: '16px' }} />
                  <Text marginLeft="4px" color={theme.subText} fontSize="12px" fontWeight={500} minWidth="fit-content">
                    <Trans>Swap on {NETWORK_LABEL[mappedChainId]}</Trans>
                  </Text>
                </Flex>
              )

            return null
          })}
        </OptionsContainer>
      )}
    </ButtonPrimary>
  )
}

export default SwapButtonWithOptions
