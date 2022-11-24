import { t } from '@lingui/macro'
import { Step } from 'walktour'

export interface StepTutorial extends Step {
  stopPropagationMouseDown?: boolean // stop Propagation onMouseDown event, ex: prevent Menufly setting auto close
  center?: boolean // popup at center
  hasPointer?: boolean
  spotlightInteraction?: boolean
  pcOnly?: boolean
  popupStyle?: React.CSSProperties
  requiredClickSelector?: string // click other element before enter this step
  selectorHint?: string // this is element to check we clicked requiredClickSelector or not.
  stepNumber?: number // for tracking, display
  callbackEndStep?: () => void
  lastStep?: boolean
}

// please do not remove TutorialIds.xxxxxx in some where to make sure tutorial work well
export const TutorialIds = {
  BUTTON_CONNECT_WALLET: 'btnConnectWallet',
  BUTTON_ADDRESS_WALLET: 'web3-status-connected',
  SELECT_NETWORK: 'selectNetwork',

  SWAP_FORM: 'swapForm',
  SWAP_FORM_CONTENT: 'swap-page',
  TRADING_SETTING_CONTENT: 'tradingSettingContent',

  BUTTON_SETTING: 'open-settings-dialog-button',
  BUTTON_SETTING_SWAP_FORM: 'btnSettingSwapForm',

  EARNING_LINKS: 'earningLinks',
  BRIDGE_LINKS: 'bridgeLinks',
  DISCOVER_LINK: 'discoverLink',
  CAMPAIGN_LINK: 'campaignLink',
  BUTTON_VIEW_GUIDE_SWAP: 'btnViewGuideSwap',
}

export const LIST_TITLE = {
  WELCOME: t`Welcome to KyberSwap!`,
  YOUR_WALLET: t`Your wallet address`,
  CONNECT_WALLET: t`Connect a wallet`,
  SELECT_NETWORK: t`Select your network`,
  START_TRADING: t`Select tokens to swap & start trading`,
  SETTING: t`Customize your settings`,
  EARN: t`Earn trading fees through our Pools / Farms`,
  DISCOVER: t`Discover trending soon tokens`,
  CAMPAIGN: t`Participate in our campaigns`,
  VIEW_GUIDE: t`View our KyberSwap Guide again`,
  BRIDGE: t`Buy Crypto or Bridge Tokens`,
}
