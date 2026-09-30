import { PlatformSplitStubError } from 'utilities/src/errors'

export interface GrayscaleIssuerLogoProps {
  uri: string
  size: number
}

/**
 * Platform split: use GrayscaleIssuerLogo.web.tsx or GrayscaleIssuerLogo.native.tsx.
 * This stub throws if the platform-specific implementation was not resolved by the bundler.
 */
export function GrayscaleIssuerLogo(_props: GrayscaleIssuerLogoProps): JSX.Element {
  throw new PlatformSplitStubError('GrayscaleIssuerLogo')
}
