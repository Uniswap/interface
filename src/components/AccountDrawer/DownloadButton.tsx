import { sendAnalyticsEvent } from '@uniswap/analytics'
import { InterfaceElementName, InterfaceEventName, SharedEventName } from '@uniswap/analytics-events'
import { PropsWithChildren, useCallback } from 'react'
import styled from 'styled-components/macro'
import { ClickableStyle } from 'theme'
import { isIOS } from 'utils/userAgent'

const StyledButton = styled.button<{ padded?: boolean; branded?: boolean }>`
  ${ClickableStyle}
  width: 100%;
  display: flex;
  justify-content: center;
  flex-direction: row;
  gap: 6px;
  padding: 8px 24px;
  border: none;
  white-space: nowrap;
  background: ${({ theme, branded }) => (branded ? theme.promotionalGradient : theme.backgroundInteractive)};
  border-radius: 12px;

  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  color: ${({ theme, branded }) => (branded ? theme.accentTextLightPrimary : theme.textPrimary)};
`

function BaseButton({ onClick, branded, children }: PropsWithChildren<{ onClick?: () => void; branded?: boolean }>) {
  return (
    <StyledButton branded={branded} onClick={onClick}>
      {children}
    </StyledButton>
  )
}

const APP_STORE_LINK = 'https://apps.apple.com/us/app/uniswap-wallet/id6443944476'
const MICROSITE_LINK = 'https://wallet.uniswap.org/'

const openAppStore = () => {
  window.open(APP_STORE_LINK, /* target = */ 'uniswap_wallet_appstore')
}
export const openWalletMicrosite = () => {
  sendAnalyticsEvent(InterfaceEventName.UNISWAP_WALLET_MICROSITE_OPENED)
  window.open(MICROSITE_LINK, /* target = */ 'uniswap_wallet_microsite')
}

export function openDownloadApp(element: InterfaceElementName) {
  sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { element })
  if (isIOS) openAppStore()
  else openWalletMicrosite()
}

// Launches App Store if on an iOS device, else navigates to Uniswap Wallet microsite
export function DownloadButton({
  onClick,
  text = 'Download',
  element,
}: {
  onClick?: () => void
  text?: string
  element: InterfaceElementName
}) {
  const onButtonClick = useCallback(() => {
    // handles any actions required by the parent, i.e. cancelling wallet connection attempt or dismissing an ad
    onClick?.()
    openDownloadApp(element)
  }, [element, onClick])

  return (
    <BaseButton branded onClick={onButtonClick}>
      {text}
    </BaseButton>
  )
}
