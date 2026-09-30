//
//  Network.swift
//  WidgetsCore
//
//  Created by Eric Huang on 7/6/23.
//

import Foundation

enum UniswapGateway {
  static let dataApiUrl = "https://entry-gateway.backend-prod.api.uniswap.org"
  static let authHeaders = [
    "X-API-KEY": Env.UNISWAP_API_KEY,
    "Content-Type": "application/json",
    "Origin": "https://app.uniswap.org",
  ]
}

/// Connect-protocol JSON client for the Uniswap data API. Proto enums are sent as their proto value
/// names (e.g. `HISTORY_DURATION_DAY`) and int64 fields come back as strings, per proto3 JSON.
enum DataApi {
  static let v1Service = "data.v1.DataApiService"
  static let v2Service = "data.v2.DataApiService"

  static func post<Response: Decodable>(
    service: String = v2Service,
    method: String,
    body: [String: Any]
  ) async throws -> Response {
    var request = URLRequest(url: URL(string: "\(UniswapGateway.dataApiUrl)/\(service)/\(method)")!)
    request.httpMethod = "POST"
    for (name, value) in UniswapGateway.authHeaders {
      request.setValue(value, forHTTPHeaderField: name)
    }
    request.setValue("1", forHTTPHeaderField: "Connect-Protocol-Version")
    request.setValue("uniswap-ios", forHTTPHeaderField: "x-request-source")
    request.httpBody = try JSONSerialization.data(withJSONObject: body)

    let (data, response) = try await URLSession.shared.data(for: request)
    guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
      throw URLError(.badServerResponse)
    }
    return try JSONDecoder().decode(Response.self, from: data)
  }
}
