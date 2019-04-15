/* eslint-disable */

/*
 @asset(/libraries/qr-scanner/qr-scanner-worker.min.js) */
'use strict'
export default class QrScanner {
  constructor(video, onDecode, canvasSize = QrScanner.DEFAULT_CANVAS_SIZE) {
    this.$video = video
    this.$canvas = document.createElement('canvas')
    this._onDecode = onDecode
    this._active = false
    this.$canvas.width = canvasSize
    this.$canvas.height = canvasSize
    this._sourceRect = { x: 0, y: 0, width: canvasSize, height: canvasSize }
    this.$video.addEventListener('canplay', () => this._updateSourceRect())
    this.$video.addEventListener(
      'play',
      () => {
        this._updateSourceRect()
        this._scanFrame()
      },
      false
    )
    this._qrWorker = new Worker(QrScanner.WORKER_PATH)
  }
  _updateSourceRect() {
    const smallestDimension = Math.min(this.$video.videoWidth, this.$video.videoHeight)
    const sourceRectSize = Math.round((2 / 3) * smallestDimension)
    this._sourceRect.width = this._sourceRect.height = sourceRectSize
    this._sourceRect.x = (this.$video.videoWidth - sourceRectSize) / 2
    this._sourceRect.y = (this.$video.videoHeight - sourceRectSize) / 2
  }
  _scanFrame() {
    if (this.$video.paused || this.$video.ended) return false
    requestAnimationFrame(() => {
      QrScanner.scanImage(this.$video, this._sourceRect, this._qrWorker, this.$canvas, true)
        .then(this._onDecode, error => {
          if (error !== 'QR code not found.') console.error(error)
        })
        .then(() => this._scanFrame())
    })
  }
  _getCameraStream(facingMode, exact = false) {
    const constraintsToTry = [{ width: { min: 1024 } }, { width: { min: 768 } }, {}]
    if (facingMode) {
      if (exact) facingMode = { exact: facingMode }
      constraintsToTry.forEach(constraint => (constraint.facingMode = facingMode))
    }
    return this._getMatchingCameraStream(constraintsToTry)
  }
  _getMatchingCameraStream(constraintsToTry) {
    if (constraintsToTry.length === 0) return Promise.reject('Camera not found.')
    return navigator.mediaDevices
      .getUserMedia({ video: constraintsToTry.shift() })
      .catch(() => this._getMatchingCameraStream(constraintsToTry))
  }
  start() {
    if (this._active) return Promise.resolve()
    this._active = true
    clearTimeout(this._offTimeout)
    let facingMode = 'environment'
    return this._getCameraStream('environment', true)
      .catch(() => {
        facingMode = 'user'
        return this._getCameraStream()
      })
      .then(stream => {
        this.$video.srcObject = stream
        this._setVideoMirror(facingMode)
      })
      .catch(e => {
        this._active = false
        throw e
      })
  }
  stop() {
    if (!this._active) return
    this._active = false
    this.$video.pause()
    this._offTimeout = setTimeout(() => {
      this.$video.srcObject.getTracks()[0].stop()
      this.$video.srcObject = null
    }, 3e3)
  }
  _setVideoMirror(facingMode) {
    const scaleFactor = facingMode === 'user' ? -1 : 1
    this.$video.style.transform = 'scaleX(' + scaleFactor + ')'
  }
  setGrayscaleWeights(red, green, blue) {
    this._qrWorker.postMessage({ type: 'grayscaleWeights', data: { red, green, blue } })
  }
  static scanImage(
    imageOrFileOrUrl,
    sourceRect = null,
    worker = null,
    canvas = null,
    fixedCanvasSize = false,
    alsoTryWithoutSourceRect = false
  ) {
    const promise = new Promise((resolve, reject) => {
      worker = worker || new Worker(QrScanner.WORKER_PATH)
      let timeout, onMessage, onError
      onMessage = event => {
        if (event.data.type !== 'qrResult') return
        worker.removeEventListener('message', onMessage)
        worker.removeEventListener('error', onError)
        clearTimeout(timeout)
        if (event.data.data !== null) resolve(event.data.data)
        else reject('QR code not found.')
      }
      onError = () => {
        worker.removeEventListener('message', onMessage)
        worker.removeEventListener('error', onError)
        clearTimeout(timeout)
        reject('Worker error.')
      }
      worker.addEventListener('message', onMessage)
      worker.addEventListener('error', onError)
      timeout = setTimeout(onError, 3e3)
      QrScanner._loadImage(imageOrFileOrUrl)
        .then(image => {
          const imageData = QrScanner._getImageData(image, sourceRect, canvas, fixedCanvasSize)
          worker.postMessage({ type: 'decode', data: imageData }, [imageData.data.buffer])
        })
        .catch(reject)
    })
    if (sourceRect && alsoTryWithoutSourceRect)
      return promise.catch(() => QrScanner.scanImage(imageOrFileOrUrl, null, worker, canvas, fixedCanvasSize))
    else return promise
  }
  static _getImageData(image, sourceRect = null, canvas = null, fixedCanvasSize = false) {
    canvas = canvas || document.createElement('canvas')
    const sourceRectX = sourceRect && sourceRect.x ? sourceRect.x : 0
    const sourceRectY = sourceRect && sourceRect.y ? sourceRect.y : 0
    const sourceRectWidth = sourceRect && sourceRect.width ? sourceRect.width : image.width || image.videoWidth
    const sourceRectHeight = sourceRect && sourceRect.height ? sourceRect.height : image.height || image.videoHeight
    if (!fixedCanvasSize && (canvas.width !== sourceRectWidth || canvas.height !== sourceRectHeight)) {
      canvas.width = sourceRectWidth
      canvas.height = sourceRectHeight
    }
    const context = canvas.getContext('2d', { alpha: false })
    context.imageSmoothingEnabled = false
    context.drawImage(
      image,
      sourceRectX,
      sourceRectY,
      sourceRectWidth,
      sourceRectHeight,
      0,
      0,
      canvas.width,
      canvas.height
    )
    return context.getImageData(0, 0, canvas.width, canvas.height)
  }
  static _loadImage(imageOrFileOrUrl) {
    if (
      imageOrFileOrUrl instanceof HTMLCanvasElement ||
      imageOrFileOrUrl instanceof HTMLVideoElement ||
      (window.ImageBitmap && imageOrFileOrUrl instanceof window.ImageBitmap) ||
      (window.OffscreenCanvas && imageOrFileOrUrl instanceof window.OffscreenCanvas)
    )
      return Promise.resolve(imageOrFileOrUrl)
    else if (imageOrFileOrUrl instanceof Image)
      return QrScanner._awaitImageLoad(imageOrFileOrUrl).then(() => imageOrFileOrUrl)
    else if (
      imageOrFileOrUrl instanceof File ||
      imageOrFileOrUrl instanceof URL ||
      typeof imageOrFileOrUrl === 'string'
    ) {
      const image = new Image()
      if (imageOrFileOrUrl instanceof File) image.src = URL.createObjectURL(imageOrFileOrUrl)
      else image.src = imageOrFileOrUrl
      return QrScanner._awaitImageLoad(image).then(() => {
        if (imageOrFileOrUrl instanceof File) URL.revokeObjectURL(image.src)
        return image
      })
    } else return Promise.reject('Unsupported image type.')
  }
  static _awaitImageLoad(image) {
    return new Promise((resolve, reject) => {
      if (image.complete && image.naturalWidth !== 0) resolve()
      else {
        let onLoad, onError
        onLoad = () => {
          image.removeEventListener('load', onLoad)
          image.removeEventListener('error', onError)
          resolve()
        }
        onError = () => {
          image.removeEventListener('load', onLoad)
          image.removeEventListener('error', onError)
          reject('Image load error')
        }
        image.addEventListener('load', onLoad)
        image.addEventListener('error', onError)
      }
    })
  }
}
QrScanner.DEFAULT_CANVAS_SIZE = 400
QrScanner.WORKER_PATH = '/libraries/qr-scanner/qr-scanner-worker.min.js'

//# sourceMappingURL=qr-scanner.min.js.map
