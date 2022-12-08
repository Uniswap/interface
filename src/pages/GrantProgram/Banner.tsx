import { useState } from 'react'
import styled, { keyframes } from 'styled-components'

const shine = keyframes`
  to {
    background-position-x: -200%;
  }
`

const ImageContainer = styled.div`
  position: relative;
  border-radius: 20px;
  width: 100%;
  padding-bottom: calc(5 / 12 * 100%); // 2.4 / 1
  height: 0;
  overflow: hidden;
`

const StyledImg = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: 20px;
`

const Loading = styled.div`
  width: 100%;
  height: 100%;

  position: absolute;
  top: 0;
  left: 0;

  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.tableHeader} 8%,
    ${({ theme }) => theme.tableHeader} 18%,
    ${({ theme }) => theme.tableHeader} 33%
  );
  border-radius: 20px;
  background-size: 200% 100%;
  animation: 1.5s ${shine} linear infinite;
`

type Props = {
  src?: string
  alt?: string
}

const Banner: React.FC<Props> = ({ src, alt = '' }) => {
  const [isImageLoaded, setImageLoaded] = useState(false)

  return (
    <ImageContainer>
      {isImageLoaded ? null : <Loading />}
      {src ? (
        <StyledImg
          src={src}
          alt={alt}
          onLoad={() => {
            setImageLoaded(true)
          }}
        />
      ) : null}
    </ImageContainer>
  )
}

export default Banner
