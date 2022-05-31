import React from 'react'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import styled from 'styled-components'
import { Flex, Image, Text } from 'rebass'
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
  setSelectedToken,
}: {
  tokenData: TrueSightTokenData
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
        <Text
          fontSize="14px"
          mr="4px"
          color={theme.subText}
          style={{ cursor: 'pointer', flex: '1' }}
          onClick={onSelectToken}
        >
          {tokenData.symbol}
        </Text>
        <Text fontSize="12px">{formattedNum(tokenData.price.toString(), true)}</Text>
        <Text fontSize="12px" color={tokenData.price_change_percentage_24h >= 0 ? theme.apr : theme.red}>
          (
          {tokenData.price_change_percentage_24h >= 1
            ? formatNumberWithPrecisionRange(tokenData.price_change_percentage_24h, 0, 0)
            : formatNumberWithPrecisionRange(tokenData.price_change_percentage_24h, 0, 2)}
          %)
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
              borderRadius: '50%',
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
            borderRadius: '50%',
          }}
          onClick={() =>
            mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SWAP_BUY_NOW_CLICKED, { trending_token: tokenData.symbol })
          }
        >
          <Cart color={theme.primary} size={12} />
        </ButtonEmpty>
        {/*</MouseoverTooltipDesktopOnly>*/}
      </Flex>
    </Container>
  )
}

const Container = styled.div`
  padding: 6px 12px;
  background: ${({ theme }) => theme.buttonBlack};
  position: relative;
  border-radius: 40px;
`

export default TopTrendingSoonTokenItem
