import mixpanel from 'mixpanel-browser'
const MIXPANEL_KEY = process.env.REACT_APP_MIXPANEL_KEY
if (MIXPANEL_KEY === undefined) {
  throw new Error(`MIXPANEL_KEY must be a defined environment variable`)
}
mixpanel.init(MIXPANEL_KEY)

// Global function to track an event
export const MixPanelTrackEvent = (msg: {
  category: string
  action: string
  label?: string
  account?: string
  chain?: string
  tokenAddress?: string
}) => {
  // Identify the user performing the event (if applicable)
  // mixpanel.identify(userAgent.device);

  const { category, ...res } = msg

  // Track the event with the provided message object

  mixpanel.track(category, {
    ...res,
  })
}
