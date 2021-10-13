import { Icon } from 'react-feather'

import themed, { Colors } from '.'

export function themedIcon(Icon: Icon, color = 'icon' as keyof Colors) {
  return themed(Icon)`
  height: 18px;
  width: 18px;

  > * {
    stroke: ${({ theme }) => theme[color]};
  }
  `
}

export function inlaidIcon(Icon: Icon, Inlay: Icon) {
  const ThemedIcon = themedIcon(Icon)
  const ThemedInlay = themed(themedIcon(Inlay))`
  background-color: ${({ theme }) => theme.bg};
  border-radius: 0.2em;
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
