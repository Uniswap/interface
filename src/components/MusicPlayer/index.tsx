import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, SkipForward } from 'react-feather'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'

// @ts-ignore
import song1 from '../../assets/audio/uniswap1.mp3'
// @ts-ignore
import song2 from '../../assets/audio/uniswap2.mp3'
// @ts-ignore
import song3 from '../../assets/audio/uniswap3.mp3'

const Controls = styled.div`
  bottom: 2em;
  display: none;
  position: absolute;
  right: 1em;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
  }
`

const Control = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.text1};
  opacity: 0.1;
  cursor: pointer;
  outline: none;
  transition: 600ms ease opacity;
  &:hover {
    opacity: 0.3;
  }
`

export default function MusicPlayer() {
  const [song, setSong] = useState(1)
  const [playing, setPlaying] = useState(false)
  const audioEl = useRef<HTMLAudioElement | null>(null)

  const onMobile = matchMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`).matches

  const playMusic = useCallback(() => {
    if (!audioEl.current) return
    audioEl.current.play()
  }, [])
  const stopMusic = useCallback(() => {
    if (!audioEl.current) return
    audioEl.current.pause()
  }, [])

  useEffect(() => {
    !onMobile ? playMusic() : stopMusic()
    matchMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`).addEventListener('change', stopMusic)
    return () => {
      matchMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`).removeEventListener('change', stopMusic)
    }
  }, [onMobile, playMusic, stopMusic])

  const togglePlayback = useCallback(() => {
    if (!audioEl.current) return
    playing ? stopMusic() : playMusic()
  }, [playMusic, playing, stopMusic])

  const playNext = useCallback(() => {
    if (song === 3) {
      setSong(1)
    } else {
      setSong(song + 1)
    }
  }, [song])

  const trackFile = useMemo(() => {
    switch (song) {
      case 1:
        return song1
      case 2:
        return song2
      case 3:
        return song3
      default:
        return song1
    }
  }, [song])
  return (
    <>
      <Controls>
        <Control onClick={togglePlayback}>{playing ? <Pause /> : <Play />}</Control>
        <Control onClick={playNext}>
          <SkipForward />
        </Control>
      </Controls>

      <audio
        style={{ display: 'none' }}
        src={trackFile}
        controls={false}
        ref={audioEl}
        autoPlay={!onMobile}
        onEnded={playNext}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </>
  )
}
