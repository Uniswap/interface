import React from 'react'

import './oversized-panel.scss'

export default function OversizedPanel(props) {
  return (
    <div className="oversized-panel">
      {props.hideTop || <div className="oversized-panel__top" />}
      {props.children}
      {props.hideBottom || <div className="oversized-panel__bottom" />}
    </div>
  )
}
