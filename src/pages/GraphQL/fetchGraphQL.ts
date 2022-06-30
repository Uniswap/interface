async function fetchGraphQL(text: any, variables: any) {
  const response = await fetch(process.env.REACT_APP_GRAPHQL_SERVER as string, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: text,
      variables,
    }),
  })

  // Get the response as JSON
  return await response.json()
}

export default fetchGraphQL
