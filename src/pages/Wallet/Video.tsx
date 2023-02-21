import ms from 'ms.macro'
import { useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components/macro'
import { isMobile } from 'utils/userAgent'

import lastFrameImg4K from '../../assets/video/last-frame-4k.png'
import lastFrameImg from '../../assets/video/last-frame-mobile.png'
import videoSrcWebmMobile from '../../assets/video/mobile.webm'
import videoSrcWebm from '../../assets/video/output3.webm'

const VideoWrapper = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  height: calc(100vh - 72px);
  margin-top: -50px;
`

export function VideoComponent() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const [showFinalFrame, setShowFinalFrame] = useState<boolean>(false)
  const hasData = useRef(false)

  useEffect(() => {
    const { current: videoElement } = videoRef
    if (videoElement) {
      videoElement.setAttribute('muted', '')
      videoElement.setAttribute('playsInline', '')
      videoElement.setAttribute('defaultMuted', '')
    }
  }, [])

  useEffect(() => {
    setTimeout(() => {
      if (!hasData.current) {
        setShowFinalFrame(true)
      }
    }, ms`0.5s`)
  }, [hasData, setShowFinalFrame])

  return (
    <VideoWrapper>
      <BackupImage display={showFinalFrame} />
      <Video
        display={!showFinalFrame}
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onEnded={() => setShowFinalFrame(true)}
        onLoadedData={() => {
          hasData.current = true
        }}
        onStalled={() => setShowFinalFrame(true)}
        onWaiting={() => setShowFinalFrame(true)}
      >
        <source src={isMobile ? videoSrcWebmMobile : videoSrcWebm} type="video/webm" />
      </Video>
      <Blur />
      <BackgroundBlur />
    </VideoWrapper>
  )
}

const Blur = styled.div`
  position: absolute;
  transform: translateY(-50%);
  width: 100%;
  height: 30%;
  background-image: linear-gradient(
    rgba(255, 255, 255, 0) 0%,
    #ffffff 40.625%,
    #ffffff 59.375%,
    rgba(255, 255, 255, 0) 100%
  );
`
const BackgroundBlur = styled(Blur)`
  z-index: -1;
  height: 50%;
`
const CoverMedia = css<{ display: boolean }>`
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${({ display }) => (display ? 1 : 0)};
`
const Video = styled.video`
  ${CoverMedia}
  transition: opacity 0.25s 0.25s ease-out;
`
const BackupImage = styled.img.attrs(() => ({
  src: isMobile ? lastFrameImg : lastFrameImg4K,
  alt: 'iphone screen image',
}))`
  ${CoverMedia}
  position: absolute;
  transition: opacity 0.25s ease-in;
`
