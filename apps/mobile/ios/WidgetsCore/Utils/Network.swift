//
//  Network.swift
//  WidgetsCore
//
//  Created by Eric Huang on 7/6/23.
//

import Foundation
import Apollo

public class Network {
  public static let shared = Network()
  
  private let UNISWAP_API_URL = Env.UNISWAP_API_BASE_URL + "/v1/graphql"
  
  public lazy var apollo: ApolloClient = {
    let cache = InMemoryNormalizedCache()
    let store = ApolloStore(cache: cache)
    let client = URLSessionClient()
    
    let provider = NetworkInterceptorProvider(client: client, store: store)
    let url = URL(string: UNISWAP_API_URL)!
    let transport = RequestChainNetworkTransport(interceptorProvider: provider, endpointURL: url)
    return ApolloClient(networkTransport: transport, store: store)
  }()
}

class NetworkInterceptorProvider: DefaultInterceptorProvider {
  
  override func interceptors<Operation>(for operation: Operation) -> [ApolloInterceptor] where Operation : GraphQLOperation {
    var interceptors = super.interceptors(for: operation)
    interceptors.insert(AuthorizationInterceptor(), at: 0)
    return interceptors
  }
  
}

class AuthorizationInterceptor: ApolloInterceptor {

  
  func interceptAsync<Operation>(
    chain: RequestChain,
    request: HTTPRequest<Operation>,
    response: HTTPResponse<Operation>?,
    completion: @escaping (Result<GraphQLResult<Operation.Data>, Error>) -> Void
  ) where Operation : GraphQLOperation {
    request.addHeader(name: "X-API-KEY", value: Env.UNISWAP_API_KEY)
    request.addHeader(name: "Content-Type", value: "application/json")
    request.addHeader(name: "Origin", value: "https://app.uniswap.org")
    
    chain.proceedAsync(request: request,
                       response: response,
                       completion: completion)
  }
  
}
