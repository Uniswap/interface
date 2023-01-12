import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as MasterCard } from 'assets/buy-crypto/master-card.svg'
import { ReactComponent as Visa } from 'assets/buy-crypto/visa.svg'
import MultichainLogoDark from 'assets/images/multichain_black.png'
import MultichainLogoLight from 'assets/images/multichain_white.png'
import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import { ReactComponent as BuyCrypto } from 'assets/svg/buy_crypto.svg'
import { ReactComponent as LimitOrderIcon } from 'assets/svg/limit_order.svg'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useIsDarkMode } from 'state/user/hooks'
import { isSupportLimitOrder } from 'utils'

import { DropdownTextAnchor, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'

const IconWrapper = styled.div`
  flex: 0 0 16px;
  display: flex;
  width: 16px;
  height: 16px;
  align-items: center;
`

const VisaSVG = styled(Visa)`
  path {
    fill: ${({ theme }) => theme.text};
  }
`

const StyledBridgeIcon = styled(BridgeIcon)`
  path {
    fill: currentColor;
  }
`
const StyledBuyCrypto = styled(BuyCrypto)`
  path {
    fill: currentColor;
  }
`

const BetaTag = styled.span`
  right: -40px;
  top: 0px;
  font-size: 10px;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.buttonGray};
  color: ${({ theme }) => theme.subText};
  padding: 2px 6px;
`

const SwapNavGroup = () => {
  const { isSolana, chainId } = useActiveWeb3React()
  const isDark = useIsDarkMode()
  const { pathname } = useLocation()
  const upTo420 = useMedia('(max-width: 420px)')

  const [{ show: isShowTutorial = false, stepInfo }] = useTutorialSwapGuide()
  const { mixpanelHandler } = useMixpanel()

  const isActive = [APP_PATHS.SWAP, APP_PATHS.BUY_CRYPTO, APP_PATHS.BRIDGE, APP_PATHS.LIMIT].some(path =>
    pathname.includes(path),
  )

  return (
    <NavGroup
      dropdownAlign={upTo420 ? 'right' : 'left'}
      isActive={isActive}
      forceOpen={isShowTutorial && stepInfo?.selector === `#${TutorialIds.BRIDGE_LINKS}`}
      anchor={
        <DropdownTextAnchor>
          <Trans>Swap</Trans>
        </DropdownTextAnchor>
      }
      dropdownContent={
        <Flex flexDirection={'column'} id={TutorialIds.BRIDGE_LINKS}>
          <StyledNavLink id={`swapv2-nav-link`} to={APP_PATHS.SWAP} style={{ flexDirection: 'column' }}>
            <Flex alignItems="center" sx={{ gap: '12px' }}>
              <IconWrapper>
                <Repeat size={16} />
              </IconWrapper>
              <Trans>Swap</Trans>
            </Flex>
          </StyledNavLink>

          {isSupportLimitOrder(chainId) && (
            <StyledNavLink to={APP_PATHS.LIMIT} style={{ flexDirection: 'column', width: '100%' }}>
              <Flex alignItems="center" sx={{ gap: '12px' }}>
                <IconWrapper>
                  <LimitOrderIcon />
                </IconWrapper>
                <Flex alignItems={'center'} sx={{ flex: 1 }} justifyContent={'space-between'}>
                  <Trans>Limit Order</Trans>
                  <BetaTag>Beta</BetaTag>
                </Flex>
              </Flex>
            </StyledNavLink>
          )}

          {isSolana || (
            <StyledNavLink to={APP_PATHS.BRIDGE} style={{ flexDirection: 'column', width: '100%' }}>
              <Flex alignItems="center" sx={{ gap: '12px' }} justifyContent="space-between">
                <IconWrapper>
                  <StyledBridgeIcon height={15} />
                </IconWrapper>
                <Flex alignItems={'center'} sx={{ flex: 1 }} justifyContent={'space-between'}>
                  <Text>
                    <Trans>Bridge</Trans>
                  </Text>
                  <img
                    src={isDark ? MultichainLogoLight : MultichainLogoDark}
                    alt="kyberswap with multichain"
                    height={10}
                  />
                </Flex>
              </Flex>
            </StyledNavLink>
          )}
          <StyledNavLink
            id={`buy-crypto-nav-link`}
            to={APP_PATHS.BUY_CRYPTO}
            onClick={() => {
              mixpanelHandler(MIXPANEL_TYPE.SWAP_BUY_CRYPTO_CLICKED)
            }}
          >
            <Flex alignItems="center" sx={{ gap: '8px' }} justifyContent="space-between">
              <Flex sx={{ gap: '12px' }}>
                <IconWrapper>
                  <StyledBuyCrypto />
                </IconWrapper>
                <Trans>Buy Crypto</Trans>
              </Flex>
              <Flex sx={{ gap: '8px' }}>
                <VisaSVG width="20" height="20" />
                <MasterCard width="20" height="20" />
              </Flex>
            </Flex>
          </StyledNavLink>
        </Flex>
      }
    />
  )
}

export default SwapNavGroup
