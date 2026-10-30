// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="../../../index.d.ts" />

// @universe/swap-ui: presentational swap views. All data via props, actions via
// callbacks, zero imports from business logic or analytics code. Rules: CLAUDE.md.

export {
  AcrossApiLabel,
  AcrossPoweredBy,
  type AcrossPoweredByProps,
  AcrossRoutingCaption,
  AcrossRoutingRow,
  type AcrossRoutingRowProps,
} from './details/AcrossRoutingInfo'
export {
  PLAN_STEP_ICON_SIZE,
  PlanRoutingCaption,
  type PlanRoutingCaptionProps,
  PlanStepLogo,
  type PlanStepLogoProps,
} from './details/PlanRoutingCaption'
export { RoutingCaption, type RoutingCaptionProps } from './details/RoutingCaption'
export {
  BestRouteLabel,
  type BestRouteLabelProps,
  RoutingInfoRow,
  type RoutingInfoRowProps,
} from './details/RoutingInfoRow'
export { AcceptNewQuoteRow, type AcceptNewQuoteRowProps } from './review/AcceptNewQuoteRow'
export { EstimatedSwapTime, type EstimatedSwapTimeProps } from './review/EstimatedSwapTime'
export { EstimatedTime, type EstimatedTimeProps } from './review/EstimatedTime'
export {
  PriceDifferenceCaption,
  type PriceDifferenceCaptionProps,
  PriceDifferenceLearnMoreButton,
  type PriceDifferenceLearnMoreButtonProps,
} from './review/PriceDifferenceInfoContent'
export { PriceDifferenceLabel, PriceDifferenceRow, type PriceDifferenceRowProps } from './review/PriceDifferenceRow'
export { RateRatio, type RateRatioProps, type RateRatioStyling } from './review/RateRatio'
export { RateRow, type RateRowProps } from './review/RateRow'
export { SlippageInfoCaption, type SlippageInfoCaptionProps } from './review/SlippageInfoCaption'
export { SlippageRow, SlippageRowLabel, type SlippageRowLabelProps, type SlippageRowProps } from './review/SlippageRow'
export { IndicativeLoadingWrapper } from './shared/IndicativeLoadingWrapper'
export { infoBodyTextVariant } from './shared/infoBodyText'
export {
  type InfoContainer,
  PlanStepLogoKind,
  type RateDisplay,
  type RoutingCaptionDisplay,
  RoutingCaptionKind,
  type SlippageDisplay,
  type SwapWarningDisplay,
  type SwapWarningSeverity,
} from './types'
export { getWarningTextColor, type WarningTextColor } from './warnings/warningColors'
