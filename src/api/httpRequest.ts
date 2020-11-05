const httpRequest = async (path: string, data?: any) => {
  const method = data ? 'post' : 'get'

  const result = await fetch(path, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  })

  if (!result.ok) throw new Error(`${await result.text()}`)

  return await result.json()
}

export default httpRequest
