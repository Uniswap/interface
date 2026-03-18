// Label configuration
export const LABEL_CONFIG = {
  FONT_SIZE: 10,
  LINE_HEIGHT: 10,
  BOTTOM_POSITION: -23, // Distance from bottom of chart (negative moves labels down/away from chart)
  HEIGHT: 22, // Height of labels layer (increased to prevent x-axis label cutoff)
  PADDING_BOTTOM: 30, // Padding below labels for x-axis visibility (lightweight-charts time scale is ~26px)
} as const

// Tooltip configuration
export const TOOLTIP_CONFIG = {
  PADDING: '4px 6px',
  BORDER_RADIUS: '6px',
  FONT_SIZE: 12,
  TOOLTIP_FONT_SIZE: 10, // Font size for tooltip content
  OFFSET_X: 10, // Horizontal offset from cursor
  VERTICAL_OFFSET_PERCENT: 120, // Vertical offset as percentage
  HORIZONTAL_OFFSET: 60, // Offset to position tooltip right of cursor for better centering
} as const

// Clearing price line configuration
// Note: Gradient/arrow colors are passed via clearingPriceLineColors prop to support light/dark themes.
// The opacity values here are used when constructing rgba() colors from theme tokens.
export const CLEARING_PRICE_LINE = {
  WIDTH: 1, // Line width in pixels
  CROSSHAIR_WIDTH: 1, // Crosshair line width when hovering
  DASH_PATTERN: [4, 2], // Dash pattern for the line (4px dash, 2px gap)
  LABEL_OFFSET_X: 10, // Horizontal offset for the label from clearing price line
  LABEL_OFFSET_Y: 12, // Vertical offset for the label from top of chart
  LABEL_FONT_SIZE: 12, // Main label font size
  LABEL_SUBTITLE_FONT_SIZE: 10, // Subtitle font size
  GRADIENT_START_OPACITY: 0.0, // Top of line (fully transparent)
  GRADIENT_END_OPACITY: 0.5, // Bottom of line (50% opacity)
  ARROW_WIDTH: 6,
  ARROW_HEIGHT: 5,
} as const

// User bid line configuration
// Similar to clearing price line but with solid line and white dot indicator
export const BID_LINE = {
  WIDTH: 1, // Line width in pixels (same as clearing price)
  DOT_SIZE: 5, // Size of the solid neutral1 dot at bottom of line (5px x 5px)
  X_OFFSET: 1, // Horizontal offset in pixels to shift line/dot right for better alignment with bar center
  GRADIENT_START_OPACITY: 0.0, // Top of line (fully transparent)
  GRADIENT_END_OPACITY: 0.6, // Bottom of line (60% opacity - slightly more visible than clearing price)
  LABEL_OFFSET_Y: 12, // Vertical offset for the label from top of chart
  TOOLTIP_AVATAR_SIZE: 12, // Size of avatar in tooltip
  TOOLTIP_OFFSET_X: 4, // Horizontal offset from bid line (half applied in controller, half in renderer)
  TOOLTIP_TOP: 18, // Distance from top of chart
} as const

// Diagonal stripe pattern for user bid bar highlight
export const BID_BAR_STRIPES = {
  SPACING: 14, // Spacing between stripes in pixels
  WIDTH: 1, // Width of each stripe line in pixels
  ANGLE: 45, // Angle of stripes in degrees (45 = bottom-left to top-right)
  OPACITY: 0.5, // Opacity of stripe lines (0.5 = 50%)
} as const

// Out-of-range indicator configuration for bid line
export const BID_OUT_OF_RANGE_INDICATOR = {
  ARROW_SIZE: 6, // Size of the arrow indicator
  PADDING: 8, // Padding from chart edge
  LABEL_OFFSET: 4, // Offset between arrow and label
  VALUE_FONT_SIZE: 10, // Font size for the bid value
} as const

// Chart scale margins
export const CHART_SCALE_MARGINS = {
  TOP: 0.2,
  BOTTOM: 0,
} as const

// Bar styling
export const BAR_STYLE = {
  BORDER_RADIUS: 4, // Corresponds to Figma design (4px corner radius)
  SPACING: 1, // Gap between adjacent bars in pixels (reduced from 2px per design)
} as const

// Demand background gap behavior
export const DEMAND_BACKGROUND_GAP_MAX_VISIBLE_TICKS = 30

// Zoom configuration
export const ZOOM_DEFAULTS = {
  INITIAL_TICK_COUNT: 20, // Number of ticks to show in initial view
} as const

export const ZOOM_TOLERANCE = 0.01 // Tolerance for detecting "full zoom" state (1%)

// Zoom factors for programmatic zoom in/out
export const ZOOM_FACTORS = {
  ZOOM_IN: 0.8, // Multiply range by this to zoom in (shrink visible range)
  ZOOM_OUT: 1.25, // Multiply range by this to zoom out (expand visible range)
} as const

// Floating point comparison tolerances
export const TOLERANCE = {
  TICK_COMPARISON: 0.001, // Tolerance for tick value comparisons (0.1% of tick size)
  TICK_MATCHING: 0.1, // Tolerance for matching ticks in concentration band (10% of tick size)
  FALLBACK: 0.01, // Fallback tolerance when tick size is unavailable
  CLEARING_PRICE_HOVER: 0.0001, // Tolerance for detecting hover on clearing price tick
} as const

// Chart data constraints
export const CHART_CONSTRAINTS = {
  MIN_BARS: 20, // Minimum number of bars to display
  MIN_VISIBLE_BARS: 15, // Minimum bars that must remain visible when zooming
  MIN_TICKS_ABOVE_CLEARING_PRICE: 15, // Minimum ticks to render above clearing price
  PREFERRED_TICKS_BELOW_CLEARING_PRICE: 5, // Keep a few ticks below clearing price when clamping
} as const

// Maximum number of bars/ticks we will render on the bid distribution chart.
// Protects against pathological outliers in GetBids responses that would create
// millions of ticks/bars and hang the UI.
export const MAX_RENDERABLE_BARS = 10_000

// Label generation configuration
export const LABEL_GENERATION = {
  MIN_LABELS: 7, // Minimum number of x-axis labels
  MAX_LABELS: 12, // Maximum number of x-axis labels
  IDEAL_LABELS: 10, // Ideal target number of labels
} as const

// Nice number values for rounding and label increments
export const NICE_VALUES = {
  STANDARD: [1, 2, 5] as const, // Standard nice values for chart increments
  WITH_HALF: [1, 2, 2.5, 5] as const, // Includes 2.5 for finer granularity (Y-axis)
} as const

// Default Y-axis levels for empty charts
export const DEFAULT_Y_AXIS_LEVELS = [0, 20000, 40000, 60000, 80000, 100000] as const

// Typography for canvas rendering
// Matches the theme font stack from packages/ui/src/theme/fonts.ts (baselBook/baselMedium)
// Used for lightweight-charts and other canvas-based rendering where React/Tamagui theming isn't available
export const CHART_FONT_FAMILY =
  'Basel, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

// Bid marker configuration
export const MARKER_CONFIG = {
  AVATAR_SIZE: 24, // Size of user avatar markers in pixels
  AVATAR_BAR_OFFSET: 4, // Distance above bar top where markers are positioned (positive = closer to bar)
  POSITION_TOLERANCE: 0.5, // Tolerance in pixels for position equality checks
  MAX_TOOLTIP_BIDS: 7, // Maximum number of bids to display in tooltip before showing "+N more"
} as const

// Shared chart dimensions - keep Bid Distribution and Clearing Price charts in lockstep
// Both charts should use the same height and y-axis width for visual alignment
export const CHART_DIMENSIONS = {
  // Chart height (excluding padding) - used by both BidDistributionChartRenderer and ClearingPriceChart
  HEIGHT: 370,
  // Minimum width for left price scale (y-axis) - ensures y-axis labels have enough space
  // and both charts align horizontally
  Y_AXIS_MIN_WIDTH: 30,
  // Extra height for ClearingPriceChart to match distribution chart's header row height
  // The distribution chart has a header row (Placeholder + Group Ticks toggle) that takes ~40px
  // Instead of adding top padding, we increase the chart height to fill that space
  CLEARING_PRICE_EXTRA_HEIGHT: 43,
} as const

// Tooltip stacking configuration for when BidLineTooltip and ClearingPriceTooltip overlap
export const TOOLTIP_STACKING = {
  GAP: 4, // Gap between stacked tooltips in pixels
} as const
