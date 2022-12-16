import isEqual from 'react-fast-compare'

import { lerp, random, randomElement } from './utils'

export interface SnowflakeProps {
  /** The color of the snowflake, can be any valid CSS color. */
  color: string
  /**
   * The minimum and maximum radius of the snowflake, will be
   * randomly selected within this range.
   *
   * The default value is `[0.5, 3.0]`.
   */
  radius: [number, number]
  /**
   * The minimum and maximum speed of the snowflake.
   *
   * The speed determines how quickly the snowflake moves
   * along the y axis (vertical speed).
   *
   * The values will be randomly selected within this range.
   *
   * The default value is `[1.0, 3.0]`.
   */
  speed: [number, number]
  /**
   * The minimum and maximum wind of the snowflake.
   *
   * The wind determines how quickly the snowflake moves
   * along the x axis (horizontal speed).
   *
   * The values will be randomly selected within this range.
   *
   * The default value is `[-0.5, 2.0]`.
   */
  wind: [number, number]
  /**
   * The frequency in frames that the wind and speed values
   * will update.
   *
   * The default value is 200.
   */
  changeFrequency: number
  /**
   * An array of images that will be rendered as the snowflakes instead
   * of the default circle shapes.
   */
  images?: HTMLImageElement[]
  /**
   * The minimum and maximum rotation speed of the snowflake (in degrees of
   * rotation per frame).
   *
   * The rotation speed determines how quickly the snowflake rotates when
   * an image is being rendered.
   *
   * The values will be randomly selected within this range.
   *
   * The default value is `[-1.0, 1.0]`.
   */
  rotationSpeed: [number, number]
}

export type SnowflakeConfig = Partial<SnowflakeProps>

export const defaultConfig: SnowflakeProps = {
  color: '#dee4fd',
  radius: [0.5, 3.0],
  speed: [1.0, 3.0],
  wind: [-0.5, 2.0],
  changeFrequency: 200,
  rotationSpeed: [-1.0, 1.0],
}

interface SnowflakeParams {
  x: number
  y: number
  radius: number
  rotation: number
  rotationSpeed: number
  speed: number
  wind: number
  nextSpeed: number
  nextWind: number
  nextRotationSpeed: number
}

/**
 * An individual snowflake that will update it's location every call to `update`
 * and draw itself to the canvas every call to `draw`.
 */
class Snowflake {
  static offscreenCanvases = new WeakMap<HTMLImageElement, Record<number, HTMLCanvasElement>>()

  private config!: SnowflakeProps
  private params: SnowflakeParams
  private framesSinceLastUpdate: number
  private image?: HTMLImageElement

  public constructor(canvas: HTMLCanvasElement, config: SnowflakeConfig = {}) {
    // Set custom config
    this.updateConfig(config)

    // Setting initial parameters
    const { radius, wind, speed, rotationSpeed } = this.config

    this.params = {
      x: random(0, canvas.offsetWidth),
      y: random(-canvas.offsetHeight, 0),
      rotation: random(0, 360),
      radius: random(...radius),
      speed: random(...speed),
      wind: random(...wind),
      rotationSpeed: random(...rotationSpeed),
      nextSpeed: random(...wind),
      nextWind: random(...speed),
      nextRotationSpeed: random(...rotationSpeed),
    }

    this.framesSinceLastUpdate = 0
  }

  private selectImage() {
    if (this.config.images && this.config.images.length > 0) {
      this.image = randomElement(this.config.images)
    } else {
      this.image = undefined
    }
  }

  public updateConfig(config: SnowflakeConfig): void {
    const previousConfig = this.config
    this.config = { ...defaultConfig, ...config }
    this.config.changeFrequency = random(this.config.changeFrequency, this.config.changeFrequency * 1.5)

    // Update the radius if the config has changed, it won't gradually update on it's own
    if (this.params && !isEqual(this.config.radius, previousConfig?.radius)) {
      this.params.radius = random(...this.config.radius)
    }

    if (!isEqual(this.config.images, previousConfig?.images)) {
      this.selectImage()
    }
  }

  private updateTargetParams(): void {
    this.params.nextSpeed = random(...this.config.speed)
    this.params.nextWind = random(...this.config.wind)
    if (this.image) {
      this.params.nextRotationSpeed = random(...this.config.rotationSpeed)
    }
  }

  public update(canvas: HTMLCanvasElement, framesPassed = 1): void {
    const { x, y, rotation, rotationSpeed, nextRotationSpeed, wind, speed, nextWind, nextSpeed, radius } = this.params

    // Update current location, wrapping around if going off the canvas
    this.params.x = (x + wind * framesPassed) % (canvas.offsetWidth + radius * 2)
    if (this.params.x > canvas.offsetWidth + radius) this.params.x = -radius
    this.params.y = (y + speed * framesPassed) % (canvas.offsetHeight + radius * 2)
    if (this.params.y > canvas.offsetHeight + radius) this.params.y = -radius

    // Apply rotation
    if (this.image) {
      this.params.rotation = (rotation + rotationSpeed) % 360
    }

    // Update the wind, speed and rotation towards the desired values
    this.params.speed = lerp(speed, nextSpeed, 0.01)
    this.params.wind = lerp(wind, nextWind, 0.01)
    this.params.rotationSpeed = lerp(rotationSpeed, nextRotationSpeed, 0.01)

    if (this.framesSinceLastUpdate++ > this.config.changeFrequency) {
      this.updateTargetParams()
      this.framesSinceLastUpdate = 0
    }
  }

  private getImageOffscreenCanvas(image: HTMLImageElement, size: number): CanvasImageSource {
    if (image.loading) return image
    let sizes = Snowflake.offscreenCanvases.get(image)

    if (!sizes) {
      sizes = {}
      Snowflake.offscreenCanvases.set(image, sizes)
    }

    if (!(size in sizes)) {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      canvas.getContext('2d')?.drawImage(image, 0, 0, size, size)
      sizes[size] = canvas
    }

    return sizes[size] ?? image
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // https://stackoverflow.com/a/1977898/8153505
    if (this.image?.complete && this.image.naturalWidth) {
      // ctx.save()
      // ctx.translate(this.params.x, this.params.y)
      ctx.setTransform(1, 0, 0, 1, this.params.x, this.params.y)

      const radius = Math.ceil(this.params.radius)
      ctx.rotate((this.params.rotation * Math.PI) / 180)
      ctx.drawImage(
        this.getImageOffscreenCanvas(this.image, radius),
        -Math.ceil(radius / 2),
        -Math.ceil(radius / 2),
        radius,
        radius,
      )

      // ctx.restore()
    } else {
      ctx.beginPath()
      ctx.arc(this.params.x, this.params.y, this.params.radius, 0, 2 * Math.PI)
      ctx.fillStyle = this.config.color
      ctx.closePath()
      ctx.fill()
    }
  }
}

export default Snowflake
