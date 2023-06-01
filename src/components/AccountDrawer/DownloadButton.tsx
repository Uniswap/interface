import { PropsWithChildren } from 'react'
import styled from 'styled-components/macro'
import { ClickableStyle } from 'theme'

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
const MICROSITE_LINK = 'https://paliwallet.com/'

const openAppStore = () => {
  window.open(APP_STORE_LINK, /* target = */ 'pali_wallet_appstore')
}
export const openWalletMicrosite = () => {
  window.open(MICROSITE_LINK, /* target = */ 'pali_wallet_microsite')
}

// export function openDownloadApp() {
//   if (isIOS) openAppStore()
//   else openWalletMicrosite()
// }

// // Launches App Store if on an iOS device, else navigates to Uniswap Wallet microsite
// export function DownloadButton({ onClick, text = 'Download' }: { onClick?: () => void; text?: string }) {
//   const onButtonClick = useCallback(() => {
//     // handles any actions required by the parent, i.e. cancelling wallet connection attempt or dismissing an ad
//     onClick?.()
//     openDownloadApp()
//   }, [onClick])

//   return (
//     <BaseButton branded onClick={onButtonClick}>
//       {text}
//     </BaseButton>
//   )
// }
