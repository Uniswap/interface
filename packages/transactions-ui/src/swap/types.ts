/**
 * The package's display vocabulary. Adapters (today) and swap-widget (later) fill these
 * shapes; views only render them. Everything arrives formatted and locale-aware.
 */
import type { ReactNode } from 'react'

/**
 * The shell an info-content view renders in. Tooltip and modal bodies differ in layout
 * (text variant, alignment, padding), never in what they say. Adapters set it from the
 * slot the body goes into (tooltip text vs modal caption), or from WarningInfo's
 * `infoButton` callback for content both shells share. Never from the platform.
 */
export type InfoContainer = 'tooltip' | 'modal'

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
