// Utility to match GraphQL mutation based on the query name
export const hasQuery = (req: any, queryName: string) => {
  const { body } = req
  return body.hasOwnProperty('query') && body.query.includes(queryName)
}

// Alias query if queryName  matches
export const aliasQuery = (req: any, queryName: string) => {
  if (hasQuery(req, queryName)) {
    req.alias = `${queryName}Query`
  }
}
