import React from 'react'
import styled, { keyframes } from 'styled-components'
import Potion1 from '../../assets/images/potion_01.png'
import Potion2 from '../../assets/images/potion_02.png'
import Potion3 from '../../assets/images/potion_03.png'
import Potion4 from '../../assets/images/potion_04.png'

const Image = styled.img<{ width: number; height: number }>`
  display: inline-block;
  max-width: ${(props) => (props.width ? props.width : 50)}px;
  max-height: ${(props) => (props.height ? props.height : 50)}px;
  width: 100%;
  height: auto;
  object-fit: contain;
  //object-position: 100% 10%;
  //flex-shrink: 0;
  vertical-align: sub;
  margin-left: -10px;
`

export const PotionIcon = (props: any) => <Image width={props.width} height={props.width} src={Potion1} />
export const PotionIcon2 = (props: any) => <Image width={props.width} height={props.width} src={Potion2} />
export const PotionIcon3 = (props: any) => <Image width={props.width} height={props.width} src={Potion3} />
export const PotionIcon4 = (props: any) => <Image width={props.width} height={props.width} src={Potion4} />

const bunnyFall = keyframes`
  0% {
    opacity: 1;
    transform: translate(0, -100%) rotateZ(0deg);
  }
  75% {
    opacity: 1;
    transform: translate(100px, 75vh) rotateZ(270deg);
  }
  100% {
    opacity: 0;
    transform: translate(150px, 100vh) rotateZ(360deg);
  }
`

const Potion = styled.div<{ position: any; duration: any; iterations: any }>`
  display: inline-flex;
  position: fixed;
  top: 0;
  left: ${({ position }) => `${position}vw`};
  transform: translate3d(0, -100%, 0);
  user-select: none;
  pointer-events: none;
  z-index: 99999;
  animation-name: ${bunnyFall};
  animation-duration: ${({ duration }) => `${duration}s`};
  animation-timing-function: linear;
  animation-iteration-count: ${({ iterations }) => (Number.isFinite(iterations) ? String(iterations) : 'infinite')};
  animation-play-state: running;
  &:nth-child(5n + 5) {
    animation-delay: ${({ duration }) => `${(duration / 10) * 1.3}s`};
  }
  &:nth-child(3n + 2) {
    animation-delay: ${({ duration }) => `${(duration / 10) * 1.5}s`};
  }
  &:nth-child(2n + 5) {
    animation-delay: ${({ duration }) => `${(duration / 10) * 1.7}s`};
  }
  &:nth-child(3n + 10) {
    animation-delay: ${({ duration }) => `${(duration / 10) * 2.7}s`};
  }
  &:nth-child(7n + 2) {
    animation-delay: ${({ duration }) => `${(duration / 10) * 3.5}s`};
  }
  &:nth-child(4n + 5) {
    animation-delay: ${({ duration }) => `${(duration / 10) * 5.5}s`};
  }
  &:nth-child(3n + 7) {
    animation-delay: ${({ duration }) => `${(duration / 10) * 8}s`};
  }
`

// eslint-disable-next-line react/prop-types
export const ThrowPotions = ({ count = 30, size = 32, iterations = Infinity, duration = 10 }) => {
  const potions = [...Array(count)].map((_, index) => (
    <div key={String(index)}>
      <Potion key={String(index)} position={Math.random() * 100} iterations={iterations} duration={duration}>
        <PotionIcon width={size} height={size} />
      </Potion>
      <Potion key={String(index)} position={Math.random() * 100} iterations={iterations} duration={duration}>
        <PotionIcon2 width={size} height={size} />
      </Potion>
      <Potion key={String(index)} position={Math.random() * 100} iterations={iterations} duration={duration}>
        <PotionIcon3 width={size} height={size} />
      </Potion>
      <Potion key={String(index)} position={Math.random() * 100} iterations={iterations} duration={duration}>
        <PotionIcon4 width={size} height={size} />
      </Potion>
    </div>
  ))

  return <div>{potions}</div>
}
