export default function promisify(web3, methodName, ...args) {
  return new Promise((resolve, reject) => {
    if (!web3) {
      reject(new Error('No Web3 object'))
      return
    }

    const method = web3.eth[methodName]

    if (!method) {
      reject(new Error(`Cannot find web3.eth.${methodName}`))
      return
    }

    method(...args, (error, data) => {
      if (error) {
        reject(error)
        return
      }

      resolve(data)
    })
  })
}
