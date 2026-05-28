export const TEAM = 'swap-pod'

export const SWAP_POD_RUNBOOK =
  'https://www.notion.so/uniswaplabs/Swap-Pod-On-Call-Runbook-135c52b2548b8037a4dac8ccd0f9dff9'

export const UNIVERSE_REPO_URL = 'https://github.com/Uniswap/universe'

// Every apps-pod-swap-fe monitor broadcasts to the FE-specific channel in
// addition to the team default (@slack-apps-alerts-swap, routed via ESC).
// Apply via `additionalSlackChannels: SWAP_FE_ADDITIONAL_SLACK_CHANNELS`.
export const SWAP_FE_ADDITIONAL_SLACK_CHANNELS = ['@slack-apps-alerts-swap-fe']
