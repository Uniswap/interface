import { useEffect, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import { Box } from 'rebass'
import styled from 'styled-components'

import TrophyImage from 'assets/images/campaign_trophy.png'
import useGetLeaderboardGrantProgram from 'hooks/campaigns/useGetLeaderboardGrantProgram'
import { MEDIA_WIDTHS } from 'theme'
import { ProjectRanking } from 'types/grantProgram'
import { FadeIn } from 'utils/keyframes'

import { RankByConfig } from '.'

const StyledImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
`

const ImageWrapper = styled.div`
  position: absolute;

  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 999px;
  overflow: hidden;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25), inset 0px 4px 4px rgba(255, 255, 255, 0.4);

  animation-duration: 1s;
  animation-name: ${FadeIn};
  animation-iteration-count: 1;
  animation-fill-mode: forwards;

  opacity: 0;

  &[data-rank='1'] {
    top: -2%;
    left: 36.4%;
    width: 22%;
    height: 22%;

    animation-delay: 2.5s;
  }

  &[data-rank='2'] {
    top: 16.6%;
    left: 19.6%;
    width: 16.2%;
    height: 16.2%;

    animation-delay: 2s;
  }

  &[data-rank='3'] {
    top: 26%;
    left: 59.5%;
    width: 14.4%;
    height: 14.4%;

    animation-delay: 1.5s;
  }

  &[data-rank='4'] {
    top: 43.7%;
    left: 31.5%;
    width: 11.7%;
    height: 11.7%;

    animation-delay: 1s;
  }

  &[data-rank='5'] {
    top: 43.7%;
    left: 51%;
    width: 11.7%;
    height: 11.7%;

    animation-delay: 1s;
  }
`

const TopProject: React.FC<{ rank: number; imgSrc: string; alt?: string }> = ({ rank, imgSrc, alt }) => {
  return (
    <ImageWrapper data-rank={rank}>
      <StyledImg src={imgSrc} alt={alt || `Top ${rank}`} />
    </ImageWrapper>
  )
}

// width, height of the image
const IDEAL_WIDTH_HEIGHT = 444

const Trophy: React.FC<{
  top5: ProjectRanking[]
}> = ({ top5 }) => {
  const ref = useRef<HTMLDivElement>()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState<number>()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  useEffect(() => {
    if (!ref.current || !upToExtraSmall) {
      return
    }

    const width = ref.current.parentElement?.clientWidth
    if (width) {
      setWidth(width)
    }
  }, [upToExtraSmall])

  useEffect(() => {
    if (!ref.current) {
      return
    }

    try {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setVisible(true)
            }
          })
        },
        {
          rootMargin: '0px',
          threshold: 0.2,
        },
      )
      observer.observe(ref.current)

      return () => {
        observer.disconnect()
      }
    } catch (e) {
      setVisible(true)
      return // redundant, but make ESLint happy
    }
  }, [])

  return (
    <Box
      width={width || '100%'}
      maxWidth={IDEAL_WIDTH_HEIGHT}
      height="fit-content"
      sx={{
        position: 'relative',
      }}
      ref={ref}
    >
      <Box width={width} height={width}>
        <StyledImg alt="trophy" src={TrophyImage} />
      </Box>
      {visible &&
        top5.map(ranking => {
          return <TopProject key={ranking.competitorId} rank={ranking.rankNo} imgSrc={ranking.logoUrl} />
        })}
    </Box>
  )
}

type Props = {
  programId?: number
  rankByConfig: RankByConfig
}

const EmptyRankings: ProjectRanking[] = []
const TrophyWrapper: React.FC<Props> = ({ programId, rankByConfig }) => {
  const {
    swrData: { data },
  } = useGetLeaderboardGrantProgram({
    id: programId,
    rankBy: rankByConfig.param,
    page: 1,
    pageSize: 5,
  })

  const top5 = data?.rankings.slice(0, 5) || EmptyRankings

  return <Trophy top5={top5} />
}

export default TrophyWrapper
