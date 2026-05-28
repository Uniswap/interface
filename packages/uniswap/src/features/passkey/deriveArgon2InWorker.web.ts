export function deriveArgon2InWorker(pin: string, salt1: Uint8Array): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./argon2Worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent): void => {
      worker.terminate()
      if (e.data.type === 'result') {
        resolve(e.data.pinKey)
      } else {
        reject(new Error(String(e.data.message || 'Argon2 worker failed')))
      }
    }
    worker.onerror = (e): void => {
      worker.terminate()
      reject(new Error(String(e.message || 'Argon2 worker crashed — device may not have enough memory')))
    }
    worker.postMessage({ type: 'derive', pin, salt1 })
  })
}
