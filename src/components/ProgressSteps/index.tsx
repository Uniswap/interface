import React from 'react'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { AutoColumn } from '../Column'
import { transparentize } from 'polished'

const Wrapper = styled(AutoColumn)`
  margin-top: 1.25rem;
`

const Grouping = styled(RowBetween)`
  width: 50%;
`

const Circle = styled.div<{ confirmed?: boolean; disabled?: boolean }>`
  min-width: 20px;
  min-height: 20px;
  background-color: ${({ theme, confirmed, disabled }) =>
    disabled ? theme.bg4 : confirmed ? theme.green1 : theme.primary1};
  border-radius: 50%;
  color: ${({ theme }) => theme.white};
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 8px;
  font-size: 12px;
`

const CircleRow = styled.div`
  width: calc(100% - 20px);
  display: flex;
  align-items: center;
`

const Connector = styled.div<{ prevConfirmed?: boolean }>`
  width: 100%;
  height: 2px;
  background-color: ;
  background: linear-gradient(
    90deg,
    ${({ theme, prevConfirmed }) => transparentize(0.5, prevConfirmed ? theme.green1 : theme.primary1)} 0%,
    ${({ theme, prevConfirmed }) => (prevConfirmed ? theme.primary1 : theme.bg4)} 80%
  );
  opacity: 0.6;
`

interface ProgressCirclesProps {
  steps: boolean[]
}

/**
 * Based on array of steps, create a step counter of circles.
 * A circle can be enabled, disabled, or confirmed. States are derived
 * from previous step.
 *
 * An extra circle is added to represent the ability to swap, add, or remove.
 * This step will never be marked as complete (because no 'txn done' state in body ui).
 *
 * @param steps  array of booleans where true means step is complete
 */
export default function ProgressCircles({ steps }: ProgressCirclesProps) {
  return (
    <Wrapper justify={'center'}>
      <Grouping>
        {steps.map((step, i) => {
          return (
            <CircleRow key={i}>
              <Circle confirmed={step} disabled={!steps[i - 1] && i !== 0}>
                {step ? '✓' : i + 1}
              </Circle>
              <Connector prevConfirmed={step} />
            </CircleRow>
          )
        })}
        <Circle disabled={!steps[steps.length - 1]}>{steps.length + 1}</Circle>
      </Grouping>
    </Wrapper>
  )
}
