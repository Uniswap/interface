import { ReactNode } from 'react'

import { LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { MultichainTransfer } from 'hooks/bridge/useGetBridgeTransfers'

export type Announcement = {
  isRead: boolean
  id: number
  templateBody: AnnouncementTemplatePopup
}

export enum PrivateAnnouncementType {
  LIMIT_ORDER = 'LIMIT_ORDER',
  BRIDGE = 'BRIDGE_ASSET',
  TRENDING_SOON_TOKEN = 'TRENDING_SOON',
}

export type PrivateAnnouncement = {
  id: number
  templateType: PrivateAnnouncementType
  templateId: number
  templateBody: AnnouncementTemplate
  isRead: boolean
  sentAt: number
}

export type AnnouncementCTA = { name: string; url: string }

export type TrueSightToken = {
  symbol: string
  price: string
  changePercentage: string
  logo: string
}

// for private announcement

export type LimitOrderNotification = {
  walletAddress: string
  makingAmount: string
  makerAssetSymbol: string
  takingAmount: string
  takerAssetSymbol: string
  makingAmountRate: string
  takingAmountRate: string
  filledMakingAmount: string
  filledTakingAmount: string
  makerAssetLogoURL: string
  takerAssetLogoURL: string
  kyberswapURL: string
  status: LimitOrderStatus
  // for partial fill
  filledPercent: string
  increasedFilledPercent: string
}
export type AnnouncementTemplateLimitOrder = {
  order: LimitOrderNotification
}
export type AnnouncementTemplateBridge = { transaction: MultichainTransfer }
export type AnnouncementTemplateTrendingSoon = { tokens: TrueSightToken[] }

// for general announcement
export type AnnouncementTemplatePopup = {
  name: string
  content: string
  thumbnailImageURL: string
  type: 'NORMAL' | 'CRITICAL'
  startAt: number
  endAt: number
  chainIds: string[]

  ctas: AnnouncementCTA[] // in popup
  ctaURL: string // in noti center
}

type AnnouncementTemplate = (
  | AnnouncementTemplateLimitOrder
  | AnnouncementTemplateBridge
  | AnnouncementTemplateTrendingSoon
  | AnnouncementTemplatePopup
) & {
  popupType: PopupType
}

export enum NotificationType {
  SUCCESS,
  ERROR,
  WARNING,
}

export enum PopupType {
  TRANSACTION, // top right
  SIMPLE, // top right
  TOP_RIGHT = 'TOP_RIGHT', // popup noti from server: limit order, bridge, ...
  TOP_BAR = 'TOP_BAR',
  SNIPPET = 'SNIPPET', // bottom left
  CENTER = 'CENTRAL',
}

export type PopupContentTxn = {
  hash: string
  type: NotificationType
}

export type PopupContentSimple = {
  title: string
  summary?: ReactNode
  icon?: ReactNode
  type: NotificationType
}

export type PopupContentAnnouncement = {
  metaMessageId: string
  templateType: PrivateAnnouncementType
  templateBody: AnnouncementTemplate
  startAt: number
  endAt: number
  createdAt: number
}

export type PopupContent = PopupContentTxn | PopupContentSimple | PopupContentAnnouncement
