type DeferredPromise<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

export function createDeferredPromise<T = void>() {
  const deferedPromise = {} as DeferredPromise<T>

  const promise = new Promise<T>((resolve, reject) => {
    deferedPromise.reject = reject
    deferedPromise.resolve = resolve
  })
  deferedPromise.promise = promise

  return deferedPromise
}
