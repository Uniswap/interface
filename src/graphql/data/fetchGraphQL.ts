import { aws4Interceptor } from 'aws4-axios'
import axiosStatic from 'axios'
import { Variables } from 'react-relay'
import { GraphQLResponse, RequestParameters } from 'relay-runtime'

const AWS_API_REGION = process.env.REACT_APP_AWS_API_REGION
const AWS_API_ACCESS_KEY = process.env.REACT_APP_AWS_API_ACCESS_KEY
const AWS_API_ACCESS_SECRET = process.env.REACT_APP_AWS_API_ACCESS_SECRET
const AWS_X_API_KEY = process.env.REACT_APP_AWS_X_API_KEY
const URL = process.env.REACT_APP_AWS_API_ENDPOINT

if (!AWS_API_REGION || !AWS_API_ACCESS_KEY || !AWS_API_ACCESS_SECRET || !AWS_X_API_KEY || !URL) {
  throw new Error('AWS KEYS MISSING FROM ENVIRONMENT')
}

const axios = axiosStatic.create()
const fetchQuery = (params: RequestParameters, variables: Variables): Promise<GraphQLResponse> => {
  const body = JSON.stringify({
    query: params.text, // GraphQL text from input
    variables,
  })

  const interceptor = aws4Interceptor(
    {
      region: AWS_API_REGION,
      service: 'execute-api',
    },
    {
      accessKeyId: AWS_API_ACCESS_KEY,
      secretAccessKey: AWS_API_ACCESS_SECRET,
    }
  )
  axios.interceptors.request.use(interceptor)

  const option: any = {
    method: 'POST',
    url: URL,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': AWS_X_API_KEY,
    },
    data: body,
  }
  return axios(option).then((x) => x.data)
}

export default fetchQuery
