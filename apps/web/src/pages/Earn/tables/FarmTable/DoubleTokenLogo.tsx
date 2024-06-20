import { Token } from '@ubeswap/sdk-core'
import blankTokenUrl from 'assets/svg/blank_token.svg'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import styled from 'styled-components'

interface DoubleLogoProps {
  logo1?: string
  logo2?: string
  onError1?: () => void
  onError2?: () => void
  size: number
}
const DoubleLogoContainer = styled.div<{ size: number }>`
  display: flex;
  gap: 0px;
  position: relative;
  top: 0;
  left: 0;
  img {
    width: ${({ size }) => size}px;
    height: ${({ size }) => size}px;
    object-fit: cover;
  }
  img:first-child {
    border-radius: ${({ size }) => `${size / 2}px`};
    object-position: 0 0;
  }
  img:last-child {
    border-radius: ${({ size }) => `${size / 2}px`};
    object-position: 100% 0;
  }
`

const CircleLogoImage = styled.img<{ size: number }>`
  width: ${({ size }) => size / 2}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
`
function DoubleLogo({ logo1, onError1, logo2, onError2, size }: DoubleLogoProps) {
  return (
    <DoubleLogoContainer size={size}>
      <CircleLogoImage src={logo1 ?? blankTokenUrl} onError={onError1} size={size} />
      <CircleLogoImage src={logo2 ?? blankTokenUrl} onError={onError2} size={size} />
    </DoubleLogoContainer>
  )
}
export default function DoubleTokenLogo({
  chainId,
  tokens,
  size = 32,
}: {
  chainId: number
  tokens: Array<Token | undefined>
  size?: number
}) {
  const token0IsNative = tokens?.[0]?.address === NATIVE_CHAIN_ID
  const token1IsNative = tokens?.[1]?.address === NATIVE_CHAIN_ID
  const [src, nextSrc] = useTokenLogoSource({
    address: tokens?.[0]?.address,
    chainId,
    primaryImg: undefined, // token0IsNative ? undefined : tokens?.[0]?.project?.logo?.url,
    isNative: token0IsNative,
  })
  const [src2, nextSrc2] = useTokenLogoSource({
    address: tokens?.[1]?.address,
    chainId,
    primaryImg: undefined, // token1IsNative ? undefined : tokens?.[1]?.project?.logo?.url,
    isNative: token1IsNative,
  })

  return <DoubleLogo logo1={src} onError1={nextSrc} logo2={src2} onError2={nextSrc2} size={size} />
}
