export async function getOutput() {
  const { InferenceSession, Tensor } = await import('onnxruntime-web')

  const model = await fetch(`${process.env.PUBLIC_URL}/slippage.onnx`).then((response) => response.arrayBuffer())
  const session = await InferenceSession.create(model)

  // dummy data
  const data = Float32Array.from([1, 10, 100, 1000, 10000, 100000, 1000000, 10000000])
  const tensor = new Tensor('float32', data, [8, 1])
  const inputName = session.inputNames[0]
  const feeds = { [inputName]: tensor }

  const outputName = session.outputNames[0]
  const results = await session.run(feeds, [outputName])

  console.log(results[outputName])
}
