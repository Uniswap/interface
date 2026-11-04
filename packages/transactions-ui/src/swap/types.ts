/**
 * The package's display vocabulary. Adapters (today) and swap-widget (later) fill these
 * shapes; views only render them. Everything arrives formatted and locale-aware.
 */
import type { ReactNode } from 'react'

/** A swap rate in both orientations, pre-formatted. */
export interface RateDisplay {
  /** e.g. `1 UNI = 0.0031 ETH` */
  rate: string
  /** Fiat value of the `rate` side, pre-formatted. The swap adapter passes the formatter's placeholder (`-`) when the price is unknown; other callers may omit it. */
  rateUsd?: string
  /** Set only when `rate` was abbreviated (e.g. `1.24B`): the same rate written out in full, shown on hover. */
  fullPrecisionRate?: string
  /** e.g. `1 ETH = 322.58 UNI` */
  invertedRate: string
  invertedRateUsd?: string
  invertedFullPrecisionRate?: string
}

/** The slippage tolerance a swap executes under, pre-formatted. */
export interface SlippageDisplay {
  /** Formatted percent, e.g. `0.50%`. */
  tolerance: string
  /** Tolerance is exactly 0; the row renders "None" instead of `tolerance`. */
  isZero: boolean
  /** User set the tolerance by hand. false = auto, which renders the Auto pill. */
  isCustom: boolean
  /** Tolerance exceeds the auto value; the value renders in the warning color. */
  exceedsAuto: boolean
}

/**
 * The shell an info-content view renders in. Tooltip and modal bodies differ in layout
 * (text variant, alignment, padding), never in what they say. Adapters set it from the
 * slot the body goes into (tooltip text vs modal caption), or from WarningInfo's
 * `infoButton` callback for content both shells share. Never from the platform.
 */
export type InfoContainer = 'tooltip' | 'modal'

/**
 * Display severity of a swap warning. Mirrors the uniswap WarningSeverity enum
 * (None/Low/Medium/High/Blocked) as a small string enum; adapters map with
 * toSwapWarningSeverity. Views turn it into tokens and never receive a color.
 */
export type SwapWarningSeverity = 'none' | 'low' | 'medium' | 'high' | 'blocked'

/**
 * A swap warning decomposed for display. Only the fields a view renders; the
 * uniswap Warning aggregate never crosses. Later warning views append optional
 * display-ready fields (title, message) here.
 */
export interface SwapWarningDisplay {
  severity: SwapWarningSeverity
}

/** Which body the "Best route" info popover shows, in the order the old caption branched. */
export enum RoutingCaptionKind {
  UniswapX = 'uniswapX',
  Diagram = 'diagram',
  PoolsSummary = 'poolsSummary',
}

/** Body of the "Best route" info popover for a non-plan, non-bridge trade. */
export type RoutingCaptionDisplay =
  /** The translated sentence with the gradient "UniswapX" word composed in. The adapter builds it: the escaping `Trans` lives in ui/src. */
  | { kind: RoutingCaptionKind.UniswapX; content: ReactNode }
  | { kind: RoutingCaptionKind.Diagram; diagram: ReactNode; descriptionText: string }
  | { kind: RoutingCaptionKind.PoolsSummary; pools: number; versions: string[] }

/** Badge on a plan step's logo: a bridge hop shows both chains' tokens, an approval shows one. */
export enum PlanStepLogoKind {
  Bridge = 'bridge',
  Approval = 'approval',
}
