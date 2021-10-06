import { Icon } from 'react-feather'

import themed from '.'

export function themedIcon(Icon: Icon) {
  return themed(Icon)`
  height: 20px;
  width: 20px;

  > * {
    stroke: ${({ theme }) => theme.icon1};
  }
  `
}

export function inlaidIcon(Icon: Icon, Inlay: Icon) {
  const ThemedIcon = themedIcon(Icon)
  const ThemedInlay = themed(themedIcon(Inlay))`
  background-color: currentColor;
  border-radius: 1em;
  bottom: 0;
  height: 8px;
  right: 0;
  width: 8px;
  position: absolute; 
`
  return function InlaidIcon() {
    return (
      <div style={{ position: 'relative' }}>
        <ThemedIcon />
        <ThemedInlay />
      </div>
    )
  }
}

export const ThemedButton = themed.button`
  border: none;
  background-color: transparent;
  padding: 0;
  border-radius: 0.5rem;

  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`
