import styled from 'styled-components'

import { Box } from '../Generics'

type GenericCardProps = React.ComponentProps<typeof Box> & {
  topSlot: React.ReactNode
  bottomSlot: React.ReactNode
}

export function GenericCard({ topSlot, bottomSlot, ...props }: GenericCardProps) {
  return (
    <Container {...props}>
      {topSlot}
      {bottomSlot}
    </Container>
  )
}

type ContainerProps = {
  aspectRatio?: string
  backgroundColor?: string
  width?: string
  height?: string
}

const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  border-radius: 20px;
  padding: 32px 28px;
  width: ${(props) => props.width || '100%'};
  height: ${(props) => props.height || '100%'};
  aspect-ratio: ${(props) => props.aspectRatio || '1 / 1'};
  background-color: ${(props) => props.backgroundColor};
  overflow: hidden;
`
