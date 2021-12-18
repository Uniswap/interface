import React, { SVGProps } from 'react'

const BarChartLoaderSVG: React.FC<SVGProps<any>> = (props) => {
  return (
    <svg width="100%" height="100%" viewBox="0 0 50 25" preserveAspectRatio="none" opacity="0.1" {...props}>
      <rect width="8%" fill="#1FC7D4">
        <animate
          attributeName="height"
          dur="0.9s"
          values="15%; 90%; 15%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.9s"
        />
        <animate
          attributeName="y"
          dur="0.9s"
          values="85%; 10%; 85%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.9s"
        />
      </rect>
      <rect x="10.222%" width="8%" fill="#1FC7D4">
        <animate
          attributeName="height"
          dur="0.9s"
          values="15%; 90%; 15%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.8s"
        />
        <animate
          attributeName="y"
          dur="0.9s"
          values="85%; 10%; 85%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.8s"
        />
      </rect>
      <rect x="20.444%" width="8%" fill="#1FC7D4">
        <animate
          attributeName="height"
          dur="0.9s"
          values="15%; 90%; 15%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.7s"
        />
        <animate
          attributeName="y"
          dur="0.9s"
          values="85%; 10%; 85%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.7s"
        />
      </rect>
      <rect x="30.666%" width="8%" fill="#1FC7D4">
        <animate
          attributeName="height"
          dur="0.9s"
          values="15%; 90%; 15%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.6s"
        />
        <animate
          attributeName="y"
          dur="0.9s"
          values="85%; 10%; 85%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.6s"
        />
      </rect>
      <rect x="40.888%" width="8%" fill="#1FC7D4">
        <animate
          attributeName="height"
          dur="0.9s"
          values="15%; 90%; 15%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.5s"
        />
        <animate
          attributeName="y"
          dur="0.9s"
          values="85%; 10%; 85%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.5s"
        />
      </rect>
      <rect x="51.11%" width="8%" fill="#1FC7D4">
        <animate
          attributeName="height"
          dur="0.9s"
          values="15%; 90%; 15%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.4s"
        />
        <animate
          attributeName="y"
          dur="0.9s"
          values="85%; 10%; 85%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.4s"
        />
      </rect>
      <rect x="61.332%" width="8%" fill="#1FC7D4">
        <animate
          attributeName="height"
          dur="0.9s"
          values="15%; 90%; 15%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.3s"
        />
        <animate
          attributeName="y"
          dur="0.9s"
          values="85%; 10%; 85%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.3s"
        />
      </rect>
      <rect x="71.554%" width="8%" fill="#1FC7D4">
        <animate
          attributeName="height"
          dur="0.9s"
          values="15%; 90%; 15%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.2s"
        />
        <animate
          attributeName="y"
          dur="0.9s"
          values="85%; 10%; 85%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.2s"
        />
      </rect>
      <rect x="81.776%" width="8%" fill="#1FC7D4">
        <animate
          attributeName="height"
          dur="0.9s"
          values="15%; 90%; 15%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.1s"
        />
        <animate
          attributeName="y"
          dur="0.9s"
          values="85%; 10%; 85%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
          begin="-0.1s"
        />
      </rect>
      <rect x="91.998%" width="8%" fill="#1FC7D4">
        <animate
          attributeName="height"
          dur="0.9s"
          values="15%; 90%; 15%"
          keyTimes="0; 0.55; 1"
          repeatCount="indefinite"
        />
        <animate attributeName="y" dur="0.9s" values="85%; 10%; 85%" keyTimes="0; 0.55; 1" repeatCount="indefinite" />
      </rect>
    </svg>
  )
}

export default BarChartLoaderSVG
