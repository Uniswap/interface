import React from 'react'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import styled from 'styled-components'
import { Flex, Image, Text } from 'rebass'
import Gold from 'assets/svg/gold_icon.svg'
import Silver from 'assets/svg/silver_icon.svg'
import Bronze from 'assets/svg/bronze_icon.svg'
import { rgba } from 'polished'
import { Info } from 'react-feather'
import { ButtonEmpty } from 'components/Button'
import useTheme from 'hooks/useTheme'
import { formatNumberWithPrecisionRange, formattedNum } from 'utils'
import { Link } from 'react-router-dom'
import { TRUESIGHT_NETWORK_TO_CHAINID } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { ChainId } from '@dynamic-amm/sdk'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { t } from '@lingui/macro'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import Cart from 'components/Icons/Cart'

const TopTrendingSoonTokenItem = ({
  tokenData,
  top,
  setSelectedToken,
}: {
  tokenData: TrueSightTokenData
  top: number
  setSelectedToken: React.Dispatch<React.SetStateAction<TrueSightTokenData | undefined>>
}) => {
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()
  const { chainId = ChainId.MAINNET } = useActiveWeb3React()
  const currentNetworkIndex = Object.values(TRUESIGHT_NETWORK_TO_CHAINID).indexOf(chainId)
  const currentNetwork = Object.keys(TRUESIGHT_NETWORK_TO_CHAINID)[currentNetworkIndex]
  const toggleTrendingSoonTokenDetailModal = useToggleModal(ApplicationModal.TRENDING_SOON_TOKEN_DETAIL)

  const onSelectToken = () => {
    setSelectedToken(tokenData)
    toggleTrendingSoonTokenDetailModal()
    mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SWAP_MORE_INFO_CLICKED, { trending_token: tokenData.symbol })
  }

  return (
    <Container>
      {top <= 2 && (
        <Image
          src={top === 0 ? Gold : top === 1 ? Silver : Bronze}
          style={{
            minWidth: '12px',
            width: '12px',
            position: 'absolute',
            top: '2px',
            left: 0,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
      <Flex flexDirection="column" style={{ gap: '10px' }}>
        <Flex style={{ gap: '4px' }} alignItems="center">
          <Image
            src={tokenData.logo_url}
            minWidth="16px"
            width="16px"
            minHeight="16px"
            height="16px"
            style={{ borderRadius: '50%', cursor: 'pointer' }}
            onClick={onSelectToken}
          />
          <Text fontSize="14px" mr="5px" color={theme.subText} style={{ cursor: 'pointer' }} onClick={onSelectToken}>
            {tokenData.symbol}
          </Text>
          <MouseoverTooltipDesktopOnly text={t`More info`} placement="top" width="fit-content">
            <ButtonEmpty
              padding="0"
              onClick={onSelectToken}
              style={{
                background: rgba(theme.buttonGray, 0.2),
                minWidth: '20px',
                minHeight: '20px',
                width: '20px',
                height: '20px',
              }}
            >
              <Info size="10px" color={theme.subText} />
            </ButtonEmpty>
          </MouseoverTooltipDesktopOnly>
          {/*<MouseoverTooltipDesktopOnly text={t`Buy now`} placement="top" width="fit-content">*/}
          <ButtonEmpty
            padding="0"
            as={Link}
            to={`/swap?inputCurrency=ETH&outputCurrency=${tokenData.platforms.get(currentNetwork)}`}
            style={{
              background: rgba(theme.primary, 0.2),
              minWidth: '20px',
              minHeight: '20px',
              width: '20px',
              height: '20px',
            }}
            onClick={() =>
              mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SWAP_BUY_NOW_CLICKED, { trending_token: tokenData.symbol })
            }
          >
            <Cart color={theme.primary} size={12} />
          </ButtonEmpty>
          {/*</MouseoverTooltipDesktopOnly>*/}
        </Flex>
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontSize="12px">{formattedNum(tokenData.price.toString(), true)}</Text>
          <Text fontSize="12px" color={tokenData.price_change_percentage_24h >= 0 ? theme.apr : theme.red}>
            {tokenData.price_change_percentage_24h >= 1
              ? formatNumberWithPrecisionRange(tokenData.price_change_percentage_24h, 0, 0)
              : formatNumberWithPrecisionRange(tokenData.price_change_percentage_24h, 0, 2)}
            %
          </Text>
        </Flex>
      </Flex>
    </Container>
  )
}

const Container = styled.div`
  padding: 8px 12px;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 4px;
  position: relative;
`

export default TopTrendingSoonTokenItem
