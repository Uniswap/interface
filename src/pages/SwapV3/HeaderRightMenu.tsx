import { Trans, t } from '@lingui/macro'
import { stringify } from 'querystring'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { MoreHorizontal } from 'react-feather'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import { ReactComponent as TutorialSvg } from 'assets/svg/play_circle_outline.svg'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import { ShareButtonWithModal } from 'components/ShareModal'
import { MouseoverTooltip } from 'components/Tooltip'
import Tutorial, { TutorialType } from 'components/Tutorial'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import TokenInfoIcon from 'components/swapv2/TokenInfoIcon'
import { StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { TAB } from 'pages/SwapV3/index'
import { useLimitState } from 'state/limit/hooks'
import { Field } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency } from 'state/swap/hooks'
import { useDegenModeManager } from 'state/user/hooks'
import { currencyId } from 'utils/currencyId'

export const SwapFormActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ theme }) => theme.background};
  border-radius: 18px;
  z-index: ${Z_INDEXS.SWAP_PAGE_HEADER_RIGHT_MENU};
`

const TutorialIcon = styled(TutorialSvg)`
  width: 22px;
  height: 22px;
  path {
    fill: ${({ theme }) => theme.subText};
    stroke: ${({ theme }) => theme.subText};
  }
`

const StyledMoreHorizontal = styled(MoreHorizontal)`
  height: 36px;
  width: 36px;
  padding: 6px;
  cursor: pointer;
`

const TransactionSettingsIconWrapper = styled.span`
  line-height: 0;
`

export default function HeaderRightMenu({
  activeTab,
  setActiveTab,
}: {
  activeTab: TAB
  setActiveTab: Dispatch<SetStateAction<TAB>>
}) {
  const { chainId, networkInfo } = useActiveWeb3React()
  const theme = useTheme()

  const [isShowHeaderMenu, setShowHeaderMenu] = useState(false)

  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  const currencies = useMemo(
    () => ({
      [Field.INPUT]: currencyIn,
      [Field.OUTPUT]: currencyOut,
    }),
    [currencyIn, currencyOut],
  )

  const { mixpanelHandler } = useMixpanel(currencies)

  const { pathname } = useLocation()
  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP)
  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)

  const limitState = useLimitState()
  const currenciesLimit = useMemo(() => {
    return { [Field.INPUT]: limitState.currencyIn, [Field.OUTPUT]: limitState.currencyOut }
  }, [limitState.currencyIn, limitState.currencyOut])

  const onToggleActionTab = (tab: TAB) => setActiveTab(activeTab === tab ? (isLimitPage ? TAB.LIMIT : TAB.SWAP) : tab)

  const shareUrl = useMemo(() => {
    const tokenIn = isSwapPage ? currencyIn : limitState.currencyIn
    const tokenOut = isSwapPage ? currencyOut : limitState.currencyOut
    return `${window.location.origin}${isSwapPage ? APP_PATHS.SWAP : APP_PATHS.LIMIT}/${networkInfo.route}${
      tokenIn && tokenOut
        ? `?${stringify({
            inputCurrency: currencyId(tokenIn, chainId),
            outputCurrency: currencyId(tokenOut, chainId),
          })}`
        : ''
    }`
  }, [networkInfo.route, currencyIn, currencyOut, chainId, limitState.currencyIn, limitState.currencyOut, isSwapPage])

  const [isDegenMode] = useDegenModeManager()

  const onMouseEnterMenu = () => {
    if (isMobile) return
    setShowHeaderMenu(true)
  }
  const onMouseLeaveMenu = () => {
    if (isMobile) return
    setShowHeaderMenu(false)
  }
  const onClickMoreButton = () => {
    setShowHeaderMenu(prev => !prev)
  }

  return (
    <SwapFormActions onMouseEnter={onMouseEnterMenu} onMouseLeave={onMouseLeaveMenu}>
      {isShowHeaderMenu && (
        <>
          <Tutorial
            type={TutorialType.SWAP}
            customIcon={
              <StyledActionButtonSwapForm onClick={() => mixpanelHandler(MIXPANEL_TYPE.SWAP_TUTORIAL_CLICK)}>
                <TutorialIcon />
              </StyledActionButtonSwapForm>
            }
          />
          <TokenInfoIcon
            currencies={isSwapPage ? currencies : currenciesLimit}
            onClick={() => {
              mixpanelHandler(MIXPANEL_TYPE.SWAP_TOKEN_INFO_CLICK)
              onToggleActionTab(TAB.INFO)
            }}
          />
          <ShareButtonWithModal
            title={t`Share this with your friends!`}
            url={shareUrl}
            onShared={() => {
              mixpanelHandler(MIXPANEL_TYPE.TOKEN_SWAP_LINK_SHARED)
            }}
          />
          <StyledActionButtonSwapForm
            active={activeTab === TAB.SETTINGS}
            onClick={() => {
              onToggleActionTab(TAB.SETTINGS)
              mixpanelHandler(MIXPANEL_TYPE.SWAP_SETTINGS_CLICK)
            }}
            aria-label="Swap Settings"
          >
            <MouseoverTooltip
              text={<Trans>Settings</Trans>}
              placement="top"
              width="fit-content"
              disableTooltip={isMobile}
            >
              <TransactionSettingsIconWrapper id={TutorialIds.BUTTON_SETTING_SWAP_FORM}>
                <TransactionSettingsIcon fill={theme.subText} />
              </TransactionSettingsIconWrapper>
            </MouseoverTooltip>
          </StyledActionButtonSwapForm>
        </>
      )}

      <MouseoverTooltip
        text={<Trans>Degen mode is on. Be cautious!</Trans>}
        placement="top"
        width="fit-content"
        disableTooltip={!isDegenMode || isMobile}
      >
        <StyledMoreHorizontal color={isDegenMode ? theme.warning : theme.subText} onClick={onClickMoreButton} />
      </MouseoverTooltip>
    </SwapFormActions>
  )
}
