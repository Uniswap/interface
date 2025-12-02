// Chart dimensions and spacing
export const CHART_PADDING = {
  RANGE_PAD_UNITS: 25, // Padding in scaled coordinate units for visible range
} as const

// Price coordinate scaling
export const COORDINATE_SCALING = {
  PRICE_SCALE_FACTOR: 10000, // Scale factor for converting prices to integer coordinates (supports precision to 0.0001)
} as const

// Label configuration
export const LABEL_CONFIG = {
  FONT_SIZE: 10,
  LINE_HEIGHT: 10,
  BOTTOM_POSITION: -2, // Distance from bottom of chart (negative moves labels down/away from chart)
  HEIGHT: 16, // Height of labels layer
} as const

// Tooltip configuration
export const TOOLTIP_CONFIG = {
  PADDING: '4px 6px',
  BORDER_RADIUS: '6px',
  FONT_SIZE: 12,
  OFFSET_X: 10, // Horizontal offset from cursor
  VERTICAL_OFFSET_PERCENT: 120, // Vertical offset as percentage
} as const

// Clearing price line configuration
export const CLEARING_PRICE_LINE = {
  WIDTH: 2, // Line width in pixels
  DASH_PATTERN: [6, 4], // Dash pattern for the line (6px dash, 4px gap)
  LABEL_OFFSET_Y: 12, // Vertical offset for the label from top of chart
} as const

// Chart scale margins
export const CHART_SCALE_MARGINS = {
  TOP: 0.2,
  BOTTOM: 0,
} as const

// Bar styling
export const BAR_STYLE = {
  BORDER_RADIUS: 12, // Corresponds to $rounded12
  SPACING: 2, // Gap between adjacent bars in pixels
} as const

// TODO | Toucan: Make gradient dynamic based on token color
// The gradient should be calculated from the token's brand color (obtained via getRGBColor
// from the token's image URL). For the test token, this resolves to #7482FF from
// specialCaseTokens.ts. The START_COLOR should use the token color with opacity (e.g., 32%),
// and END_COLOR should be a darker variant with 0% opacity. This will require passing the
// token color to the renderer and dynamically generating the gradient colors.
// Concentration gradient styling
export const CONCENTRATION_GRADIENT = {
  START_COLOR: 'rgba(127, 124, 251, 0.32)', // Bottom of gradient (visible)
  END_COLOR: 'rgba(75, 74, 149, 0)', // Top of gradient (transparent)
} as const

// Zoom configuration
export const ZOOM_DEFAULTS = {
  INITIAL_TICK_COUNT: 20, // Number of ticks to show in initial view
} as const

export const ZOOM_TOLERANCE = 0.01 // Tolerance for detecting "full zoom" state (1%)

// Floating point comparison tolerances
export const TOLERANCE = {
  TICK_COMPARISON: 0.001, // Tolerance for tick value comparisons (0.1% of tick size)
  TICK_MATCHING: 0.1, // Tolerance for matching ticks in concentration band (10% of tick size)
  FALLBACK: 0.01, // Fallback tolerance when tick size is unavailable
} as const

// Chart data constraints
export const CHART_CONSTRAINTS = {
  MIN_BARS: 20, // Minimum number of bars to display
} as const

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
