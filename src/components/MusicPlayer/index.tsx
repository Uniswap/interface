import { useCallback, useMemo, useRef, useState } from 'react'
import { Pause, Play, SkipForward } from 'react-feather'
import styled from 'styled-components/macro'

// @ts-ignore
import song1 from '../../assets/audio/uniswap1.mp3'
// @ts-ignore
import song2 from '../../assets/audio/uniswap2.mp3'
// @ts-ignore
import song3 from '../../assets/audio/uniswap3.mp3'

const Controls = styled.div`
  position: absolute;
  bottom: 2em;
  right: 1em;
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

  const togglePlayback = useCallback(() => {
    if (!audioEl.current) return
    if (playing) {
      audioEl.current.pause()
    } else {
      audioEl.current.play()
    }
  }, [playing])

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
        autoPlay
        loop
        onEnded={playNext}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </>
  )
}
