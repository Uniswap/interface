import React from 'react'
interface DecoratorProps {
  children?: React.ReactNode
}

export default function Web3Decorator({ children }: DecoratorProps) {
  return (
    <div>
      <div>address</div>
      <button>connect</button>
      <button>disconnect</button>
      <div>{children}</div>
    </div>
  )
}
