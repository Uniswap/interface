import { css } from 'styled-components/macro'

export const flexColumnNoWrap = css`
  display: flex;
  flex-flow: column nowrap;
`

export const flexRowNoWrap = css`
  display: flex;
  flex-flow: row nowrap;
`

export enum TRANSITION_DURATIONS {
  slow = 500,
  medium = 250,
  fast = 125,
}
