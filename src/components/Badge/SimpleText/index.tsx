import React from 'react'

import styled from 'styled-components'

const BadgeText = styled.div<{ color: string }>`
  height: 16px;
  border: solid 1.75px;
  border-color: ${props => props.color};
  color: ${props => props.color};
  border-radius: 4px;
  width: fit-content;
  padding: 0 4px;
  font-size: 9px;
  font-weight: bold;
  font-family: 'Montserrat';
`

const SimpleText = ({ color, text }: { color: string; text: string }) => {
  return <BadgeText color={color}>{text}</BadgeText>
}

export default SimpleText
