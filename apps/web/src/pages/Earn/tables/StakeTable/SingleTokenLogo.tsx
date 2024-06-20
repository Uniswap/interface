import { Token } from '@ubeswap/sdk-core'
import blankTokenUrl from 'assets/svg/blank_token.svg'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import styled from 'styled-components'

interface DoubleLogoProps {
  logo?: string
  onError?: () => void
  size: number
}
const SingleLogoContainer = styled.div<{ size: number }>`
  display: flex;
  gap: 0px;
  position: relative;
  top: 0;
  left: 0;
  img {
    width: ${({ size }) => size}px;
    height: ${({ size }) => size}px;
    object-fit: cover;
    border-radius: ${({ size }) => `${size / 2}px`};
    object-position: 0 0;
  }
`

const CircleLogoImage = styled.img<{ size: number }>`
  width: ${({ size }) => size / 2}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
`
function DoubleLogo({ logo, onError, size }: DoubleLogoProps) {
  return (
    <SingleLogoContainer size={size}>
      <CircleLogoImage src={logo ?? blankTokenUrl} onError={onError} size={size} />
    </SingleLogoContainer>
  )
}
export default function SingleTokenLogo({
  chainId,
  token,
  size = 32,
}: {
  chainId: number
  token: Token | undefined
  size?: number
}) {
  const tokenIsNative = token?.address === NATIVE_CHAIN_ID
  const [src, nextSrc] = useTokenLogoSource({
    address: token?.address,
    chainId,
    primaryImg: undefined, // token0IsNative ? undefined : tokens?.[0]?.project?.logo?.url,
    isNative: tokenIsNative,
  })

  return <DoubleLogo logo={src} onError={nextSrc} size={size} />
}
