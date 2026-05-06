// Upper bound for the slider's price range, expressed as a percentage above
// the clearing price. 49900% = 500x. The range is traversed exponentially
// (see SLIDER_CURVE_K), so most slider travel still covers the lower end.
export const MAX_PERCENTAGE = 49900
export const MARKER_COUNT = 10
export const TOOLTIP_OPEN_DELAY_MS = 2000

// Number of discrete positions on the slider UI. Each position maps to a
// tick offset via an exponential curve — this decouples the visual step
// count from the (potentially huge) underlying tick count.
export const SLIDER_RESOLUTION = 1000

// Steepness of the exponential position → tick-offset curve. Higher values
// concentrate more travel near the clearing price (where most bids sit).
// With K=6, slider at 50% ≈ 4.7% of the max price range above clearing.
export const SLIDER_CURVE_K = 6

// V2 constants
export const V2_TRACK_HEIGHT = 12
export const V2_THUMB_SIZE = V2_TRACK_HEIGHT

export const THUMB_LABEL_OFFSET = 8
