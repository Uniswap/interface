export async function getOutput() {
  const { InferenceSession, Tensor } = await import('onnxruntime-web')

  const arrayBuffer = await fetch(`${process.env.PUBLIC_URL}/slippage.onnx`).then((response) => response.arrayBuffer())
  const session = await InferenceSession.create(arrayBuffer, {
    executionProviders: ['wasm'],
  })

  const dataA = Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  const dataB = Float32Array.from([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120])
  const tensorA = new Tensor('float32', dataA, [3, 4])
  const tensorB = new Tensor('float32', dataB, [4, 3])

  // prepare feeds. use model input names as keys.
  const feeds = { a: tensorA, b: tensorB }

  // feed inputs and run
  const results = await session.run(feeds)

  // read from results
  const dataC = results.c.data
  console.log(dataC)
}
