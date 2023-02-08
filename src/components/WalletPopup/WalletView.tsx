import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, FileText, StopCircle, X } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DragHandleIcon } from 'assets/svg/wallet_drag_handle.svg'
import SendIcon from 'components/Icons/SendIcon'
import Row from 'components/Row'
import AccountInfo from 'components/WalletPopup/AccountInfo'
import MyAssets from 'components/WalletPopup/MyAssets'
import PinButton from 'components/WalletPopup/PinButton'
import SendToken from 'components/WalletPopup/SendToken'
import { APP_PATHS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useTokensHasBalance } from 'state/wallet/hooks'

import ReceiveToken from './ReceiveToken'
import ListTransaction from './Transactions'

export const HANDLE_CLASS_NAME = 'walletPopupDragHandle'

type WrapperProps = { $pinned: boolean; $blur: boolean }
const Wrapper = styled.div.attrs<WrapperProps>(props => ({
  'data-pinned': props.$pinned,
  'data-blur': props.$blur,
}))<WrapperProps>`
  width: 100%;
  height: 100%;
  padding-top: 0px;

  display: flex;

  border-radius: 20px 0px 0px 0px;
  background-color: ${({ theme }) => theme.tabActive};
  box-shadow: 0px 0px 12px 8px rgb(0 0 0 / 4%);

  overflow: hidden;

  &[data-pinned='true'] {
    border-radius: 20px;
  }

  &[data-blur='true'] {
    background-color: ${({ theme }) => rgba(theme.tabActive, 0.92)};
    backdrop-filter: blur(4px);
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-bottom: 0;
    height: unset;
  `};
`

const TabItem = styled.div<{ active: boolean }>`
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  padding-bottom: 10px;
  cursor: pointer;
  user-select: none;
  :hover {
    color: ${({ theme }) => theme.primary};
  }
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  gap: 14px;
`

export const View = {
  ASSETS: t`Assets`,
  SEND_TOKEN: t`Send`,
  RECEIVE_TOKEN: t`Receive`,
  TRANSACTIONS: t`Transactions`,
} as const

type Props = {
  onDismiss: () => void
  onPin?: () => void
  onUnpin?: () => void
  isPinned: boolean
  blurBackground?: boolean
}

// This is intentional, we don't need to persist in localStorage
let storedView = View.ASSETS
export default function WalletView({ onDismiss, onPin, isPinned, blurBackground = false, onUnpin }: Props) {
  const [view, setView] = useState<string>(storedView)
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()
  const navigate = useNavigate()
  const nodeRef = useRef<HTMLDivElement>(null)
  const [isMinimal, setMinimal] = useState(false)

  const { loading: loadingTokens, currencies, currencyBalances, totalBalanceInUsd, usdBalances } = useTokensHasBalance()

  const underTab = (
    <Row gap="20px" style={{ borderBottom: `1px solid ${theme.border}` }}>
      <TabItem active={view === View.ASSETS} onClick={() => setView(View.ASSETS)}>
        <StopCircle size={16} /> <Trans>Assets</Trans>
      </TabItem>
      <TabItem
        active={view === View.TRANSACTIONS}
        onClick={() => {
          mixpanelHandler(MIXPANEL_TYPE.WUI_TRANSACTION_CLICK)
          setView(View.TRANSACTIONS)
        }}
      >
        <FileText size={16} /> <Trans>Transactions</Trans>
      </TabItem>
    </Row>
  )

  const renderAccountInfo = () => {
    const handleClickBuy = () => {
      navigate(`${APP_PATHS.BUY_CRYPTO}?step=3`)
      onDismiss()
      mixpanelHandler(MIXPANEL_TYPE.WUI_BUTTON_CLICK, { button_name: 'Buy' })
    }
    const handleClickReceive = () => {
      setView(View.RECEIVE_TOKEN)
      mixpanelHandler(MIXPANEL_TYPE.WUI_BUTTON_CLICK, { button_name: 'Receive' })
    }
    const handleClickSend = () => {
      setView(View.SEND_TOKEN)
      mixpanelHandler(MIXPANEL_TYPE.WUI_BUTTON_CLICK, { button_name: 'Send' })
    }

    return (
      <AccountInfo
        totalBalanceInUsd={totalBalanceInUsd}
        onClickBuy={handleClickBuy}
        onClickReceive={handleClickReceive}
        onClickSend={handleClickSend}
        isMinimal={isMinimal}
        disabledSend={!currencies.length}
      />
    )
  }

  const renderContent = () => {
    switch (view) {
      case View.TRANSACTIONS:
        return (
          <ContentWrapper>
            {renderAccountInfo()}
            {underTab}
            <ListTransaction isMinimal={isMinimal} />
          </ContentWrapper>
        )
      case View.ASSETS:
        return (
          <ContentWrapper>
            {renderAccountInfo()}
            {underTab}
            <MyAssets
              loadingTokens={loadingTokens}
              tokens={currencies}
              usdBalances={usdBalances}
              currencyBalances={currencyBalances}
            />
          </ContentWrapper>
        )
      case View.SEND_TOKEN:
        return <SendToken loadingTokens={loadingTokens} currencies={currencies} currencyBalances={currencyBalances} />
      case View.RECEIVE_TOKEN:
        return <ReceiveToken />
    }
    return null
  }

  const isSendTab = view === View.SEND_TOKEN
  const isExchangeTokenTab = isSendTab || view === View.RECEIVE_TOKEN

  useLayoutEffect(() => {
    // handle minimal mode when width & height become small

    const { ResizeObserver } = window
    const node = nodeRef.current
    if (!node) {
      return
    }

    const resizeHandler = () => {
      const { clientWidth, clientHeight } = node
      setMinimal(clientWidth <= 360 || clientHeight <= 480)
    }

    if (typeof ResizeObserver === 'function') {
      const resizeObserver = new ResizeObserver(resizeHandler)
      resizeObserver.observe(node)

      return () => resizeObserver.disconnect()
    } else {
      window.addEventListener('resize', resizeHandler)
      return () => window.removeEventListener('resize', resizeHandler)
    }
  }, [nodeRef])

  useEffect(() => {
    storedView = view
  }, [view])

  const classNameForHandle = isPinned ? HANDLE_CLASS_NAME : ''
  const cursorForHandle = isPinned ? 'move' : undefined

  return (
    <Wrapper ref={nodeRef} $pinned={isPinned} $blur={blurBackground}>
      <Flex
        className={classNameForHandle}
        sx={{
          height: '100%',
          flex: '0 0 20px',
          cursor: cursorForHandle,
        }}
      />

      <Flex
        sx={{
          flexDirection: 'column',
          width: '100%',
          height: '100%',
        }}
      >
        <Flex
          className={classNameForHandle}
          sx={{
            flexDirection: 'column',
            width: '100%',
            cursor: cursorForHandle,
            marginBottom: '8px',
          }}
        >
          {isPinned && (
            <Flex
              sx={{
                height: '12px',
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: '8px',
              }}
            >
              <DragHandleIcon />
            </Flex>
          )}

          <Flex
            sx={{
              flex: '0 0 48px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {isExchangeTokenTab ? (
              <>
                <ChevronLeft cursor="pointer" size={28} onClick={() => setView(View.ASSETS)} color={theme.subText} />
                <Flex alignItems="center">
                  <SendIcon style={{ marginRight: 7, transform: isSendTab ? 'unset' : 'rotate(180deg)' }} /> {view}
                </Flex>
              </>
            ) : (
              <Text fontWeight={'500'} fontSize="20px" color={theme.subText}>
                <Trans>Your Account</Trans>
              </Text>
            )}
            <Flex style={{ gap: 20 }} alignItems="center">
              {onPin && onUnpin && <PinButton isActive={isPinned} onClick={isPinned ? onUnpin : onPin} />}
              <X onClick={onDismiss} color={theme.subText} cursor="pointer" />
            </Flex>
          </Flex>
        </Flex>

        {renderContent()}

        <Flex
          className={classNameForHandle}
          sx={{
            height: '20px',
            flex: '0 0 20px',
            width: '100%',
            cursor: cursorForHandle,
          }}
        />
      </Flex>

      <Flex
        className={classNameForHandle}
        sx={{
          height: '100%',
          flex: '0 0 20px',
          cursor: cursorForHandle,
        }}
      />
    </Wrapper>
  )
}
