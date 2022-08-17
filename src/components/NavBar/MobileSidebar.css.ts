import { style } from '@vanilla-extract/css'
import { subhead } from 'nft/css/common.css'

import { sprinkles } from '../../nft/css/sprinkles.css'

export const sidebar = style([
  sprinkles({
    display: 'flex',
    position: 'fixed',
    background: 'white',
    height: 'full',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    paddingBottom: '16',
    justifyContent: 'space-between',
  }),
  {
    zIndex: 20,
  },
])

export const icon = style([
  sprinkles({
    width: '32',
    height: '32',
  }),
])

export const iconContainer = style([
  sprinkles({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    color: 'darkGray',
    background: 'none',
    border: 'none',
    justifyContent: 'flex-end',
    textAlign: 'center',
    cursor: 'pointer',
    padding: '6',
  }),
])

export const linkRow = style([
  subhead,
  sprinkles({
    color: 'blackBlue',
    width: 'full',
    paddingLeft: '16',
    paddingY: '12',
    cursor: 'pointer',
  }),
  {
    lineHeight: '24px',
    textDecoration: 'none',
  },
])

export const activeLinkRow = style([
  linkRow,
  sprinkles({
    background: 'lightGrayButton',
  }),
])

export const separator = style([
  sprinkles({
    height: '0',
    borderStyle: 'solid',
    borderColor: 'medGray',
    borderWidth: '1px',
    marginY: '8',
    marginX: '16',
  }),
])

export const extraLinkRow = style([
  subhead,
  sprinkles({
    width: 'full',
    color: 'blackBlue',
    paddingY: '12',
    paddingLeft: '16',
    cursor: 'pointer',
  }),
  {
    lineHeight: '24px',
    textDecoration: 'none',
  },
])

export const bottomExternalLinks = style([
  sprinkles({
    gap: '4',
    paddingX: '4',
    width: 'max',
    flexWrap: 'wrap',
  }),
])

export const bottomJointExternalLinksContainer = style([
  sprinkles({
    paddingX: '8',
    paddingY: '4',
    color: 'darkGray',
    fontWeight: 'medium',
    fontSize: '12',
  }),
  {
    lineHeight: '20px',
  },
])

export const IconRow = style([
  sprinkles({
    gap: '12',
    width: 'max',
  }),
])
