export type UnitagClaim = {
  address?: string
  username: string
  avatarUri?: string
}

export type UnitagClaimSource = 'onboarding' | 'home' | 'settings'

export type UnitagClaimContext = {
  source: UnitagClaimSource
  hasENSAddress: boolean
}
