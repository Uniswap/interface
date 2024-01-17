import { motion } from 'framer-motion'
import styled from 'styled-components'

const Mask = motion(styled.div`
  position: relative;
  display: flex;
  flex: 0;
  min-height: 52px;
  width: 100%;
  overflow: hidden;
  @media (max-width: 1024px) {
    min-height: 40px;
  }
  @media (max-width: 768px) {
    min-height: 32px;
  }
`)
const Char = motion(styled.div`
  font-variant-numeric: lining-nums tabular-nums;
  font-family: Basel;
  font-size: 52px;
  font-style: normal;
  font-weight: 500;
  color: ${({ theme }) => theme.neutral1};
  line-height: 52px;
  @media (max-width: 1024px) {
    font-size: 40px;
    line-height: 40px;
  }
  @media (max-width: 768px) {
    font-size: 32px;
    line-height: 32px;
  }
`)
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  border-radius: 20px;

  width: 100%;
  height: 100%;

  padding: 32px;

  background-color: ${({ theme }) => theme.surface2};
  overflow: hidden;

  @media (max-width: 1024px) {
    padding: 24px;
  }
  @media (max-width: 768px) {
  }
`
const SpriteContainer = motion(styled.div`
  pointer-events: none;
  diplay: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.neutral2};
`)
const Title = styled.h3`
  padding: 0;
  margin: 0;
  font-family: Basel;
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  line-height: 32px; /* 133.333% */
  color: ${({ theme }) => theme.neutral2};
  @media (max-width: 1024px) {
    font-size: 20px;
    line-height: 26px;
  }
  @media (max-width: 768px) {
    font-size: 20px;
    line-height: 20px;
  }
`
type StatCardProps = {
  title: string
  value: string
  prefix?: string
  suffix?: string
  delay?: number
  inView?: boolean
}

function rotateArray<T>(arr: T[], n: number) {
  return arr.slice(n, arr.length).concat(arr.slice(0, n))
}

const numeric = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const currency = ['¥', '£', '€', '$']
const suffixes = [' ', 'K', 'M', 'B', 'T']
const delineators = [',', '.']

export function StatCard(props: StatCardProps) {
  return (
    <Container>
      <Title>{props.title}</Title>
      <StringInterpolationWithMotion
        prefix={props.prefix}
        suffix={props.suffix}
        value={props.value}
        delay={props.delay}
        inView={props.inView}
      />
    </Container>
  )
}

function StringInterpolationWithMotion({ value, delay, inView }: Omit<StatCardProps, 'title'>) {
  const chars = value.split('')

  return (
    <Mask
      initial="initial"
      animate={inView ? 'animate' : 'initial'}
      transition={{ staggerChildren: 0.025, delayChildren: delay }}
    >
      {chars.map((char: string, index: number) => {
        // select charset based on char
        const charset = numeric.includes(char)
          ? numeric
          : delineators.includes(char)
          ? delineators
          : currency.includes(char)
          ? currency
          : suffixes

        return <NumberSprite char={char} key={index} charset={charset} />
      })}
    </Mask>
  )
}

function NumberSprite({ char, charset }: { char: string; charset: string[] }) {
  const height = 60

  // rotate array so that the char is at the top
  const chars = rotateArray(charset, charset.indexOf(char))

  const idx = chars.indexOf(char)

  const variants = {
    initial: {
      y: idx + 3 * -height,
    },
    animate: {
      y: idx * -height,
      transition: {
        duration: 1,
        type: 'spring',
      },
    },
  }

  return (
    <SpriteContainer variants={variants}>
      {chars.map((char, index) => {
        const charVariants = {
          initial: {
            opacity: 0.25,
          },
          animate: {
            opacity: idx === index ? 1 : 0,
            transition: {
              opacity: {
                duration: 0.5,
              },
              duration: 1,
              type: 'spring',
            },
          },
        }

        return (
          <Char variants={charVariants} key={index}>
            {char}
          </Char>
        )
      })}
    </SpriteContainer>
  )
}
