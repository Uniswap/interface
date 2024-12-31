import { MoveDirection, OutMode, type Container, type ISourceOptions } from '@tsparticles/engine'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { useEffect, useMemo, useState } from 'react'

const UbestarterParticles = () => {
  const [init, setInit] = useState(false)

  useEffect(() => {
    console.log('Initializing particles engine...')
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      console.log('Particles engine initialized!')
      setInit(true)
    })
  }, [])

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log('Particles container loaded:', container)
  }

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: {
        enable: true,
        zIndex: 0,
      },
      particles: {
        number: {
          value: 10,
          density: {
            enable: true,
            area: 800,
          },
        },
        color: {
          value: '#8878c3',
        },
        shape: {
          type: 'image',
          options: {
            image: {
              src: '/images/rocket-purple.png',
              width: 100,
              height: 100,
            },
          },
        },
        opacity: {
          value: 0.3,
          animation: {
            enable: false,
            speed: 1,
            minimumValue: 0.1,
            sync: false,
          },
        },
        size: {
          value: 25,
          animation: {
            enable: false,
            speed: 40,
            minimumValue: 0.1,
            sync: false,
          },
        },
        links: {
          enable: false,
        },
        move: {
          enable: true,
          speed: 3,
          direction: MoveDirection.top,
          random: false,
          straight: true,
          outModes: {
            default: OutMode.out,
          },
          attract: {
            enable: false,
            rotate: {
              x: 600,
              y: 1200,
            },
          },
        },
      },
      interactivity: {
        detectsOn: 'canvas',
        events: {
          onHover: {
            enable: false,
          },
          onClick: {
            enable: false,
          },
          resize: {
            enable: true,
            delay: 0.5,
          },
        },
      },
      detectRetina: true,
      background: {
        color: '#ffffff',
        opacity: 0,
        size: 'cover',
        position: '50% 50%',
      },
    }),
    []
  )

  if (!init) {
    return null
  }

  return (
    <div className="absolute inset-0" style={{ zIndex: 0 }}>
      <Particles
        id="ubestarterParticles"
        particlesLoaded={particlesLoaded}
        options={options}
        className="w-full h-full"
      />
    </div>
  )
}

export default UbestarterParticles
