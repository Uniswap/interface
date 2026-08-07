import { type PartialMessage } from '@bufbuild/protobuf'
import { type PromiseClient } from '@connectrpc/connect'
import { type DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import type {
  GetPortfolioRequest,
  GetPortfolioResponse,
  GetProtocolFeesRequest,
  GetProtocolFeesResponse,
  GetWalletBalancesRequest,
  GetWalletBalancesResponse,
  GetWalletProfitLossRequest,
  GetWalletProfitLossResponse,
  GetWalletsBalancesRequest,
  GetWalletsBalancesResponse,
  ListTokensRequest,
  ListTokensResponse,
  ListTopPoolsRequest,
  ListTopPoolsResponse,
  SubmitReportRequest,
  SubmitDataReportRequest,
  SubmitDataReportResponse,
  SubmitReportResponse,
  GetWalletTokenProfitLossRequest,
  GetWalletTokenProfitLossResponse,
  GetWalletTokensProfitLossRequest,
  GetWalletTokensProfitLossResponse,
  ListTransactionsRequest,
  ListTransactionsResponse,
  GetPortfolioChartResponse,
  GetPortfolioChartRequest,
  ListPositionsRequest,
  ListPositionsResponse,
  GetPositionResponse,
  GetPositionRequest,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
export interface DataApiServiceClientContext {
  rpcClient: PromiseClient<typeof DataApiService>
}

export interface DataApiServiceClient {
  getPortfolio: (params: PartialMessage<GetPortfolioRequest>) => Promise<GetPortfolioResponse>
  getPortfolioChart: (params: PartialMessage<GetPortfolioChartRequest>) => Promise<GetPortfolioChartResponse>
  listTransactions: (params: PartialMessage<ListTransactionsRequest>) => Promise<ListTransactionsResponse>
  getProtocolFees: (params: PartialMessage<GetProtocolFeesRequest>) => Promise<GetProtocolFeesResponse>
  getWalletBalances: (params: PartialMessage<GetWalletBalancesRequest>) => Promise<GetWalletBalancesResponse>
  getWalletsBalances: (params: PartialMessage<GetWalletsBalancesRequest>) => Promise<GetWalletsBalancesResponse>
  listTokens: (params: PartialMessage<ListTokensRequest>) => Promise<ListTokensResponse>
  listTopPools: (params: PartialMessage<ListTopPoolsRequest>) => Promise<ListTopPoolsResponse>
  listPositions: (params: PartialMessage<ListPositionsRequest>) => Promise<ListPositionsResponse>
  getPosition: (params: PartialMessage<GetPositionRequest>) => Promise<GetPositionResponse>
  getWalletProfitLoss: (params: PartialMessage<GetWalletProfitLossRequest>) => Promise<GetWalletProfitLossResponse>
  getWalletTokenProfitLoss: (
    params: PartialMessage<GetWalletTokenProfitLossRequest>,
  ) => Promise<GetWalletTokenProfitLossResponse>
  getWalletTokensProfitLoss: (
    params: PartialMessage<GetWalletTokensProfitLossRequest>,
  ) => Promise<GetWalletTokensProfitLossResponse>
  submitReport: (params: PartialMessage<SubmitReportRequest>) => Promise<SubmitReportResponse>
  submitDataReport: (params: PartialMessage<SubmitDataReportRequest>) => Promise<SubmitDataReportResponse>
}

export function createDataApiServiceClient({ rpcClient }: DataApiServiceClientContext): DataApiServiceClient {
  return {
    getPortfolio: (params): Promise<GetPortfolioResponse> => rpcClient.getPortfolio(params),
    getPortfolioChart: (params): Promise<GetPortfolioChartResponse> => rpcClient.getPortfolioChart(params),
    listTransactions: (params): Promise<ListTransactionsResponse> => rpcClient.listTransactions(params),
    getProtocolFees: (params): Promise<GetProtocolFeesResponse> => rpcClient.getProtocolFees(params),
    getWalletBalances: (params): Promise<GetWalletBalancesResponse> => rpcClient.getWalletBalances(params),
    getWalletsBalances: (params): Promise<GetWalletsBalancesResponse> => rpcClient.getWalletsBalances(params),
    listTokens: (params): Promise<ListTokensResponse> => rpcClient.listTokens(params),
    listTopPools: (params): Promise<ListTopPoolsResponse> => rpcClient.listTopPools(params),
    listPositions: (params): Promise<ListPositionsResponse> => rpcClient.listPositions(params),
    getPosition: (params): Promise<GetPositionResponse> => rpcClient.getPosition(params),
    getWalletProfitLoss: (params): Promise<GetWalletProfitLossResponse> => rpcClient.getWalletProfitLoss(params),
    getWalletTokenProfitLoss: (params): Promise<GetWalletTokenProfitLossResponse> =>
      rpcClient.getWalletTokenProfitLoss(params),
    getWalletTokensProfitLoss: (params): Promise<GetWalletTokensProfitLossResponse> =>
      rpcClient.getWalletTokensProfitLoss(params),
    submitReport: (params): Promise<SubmitReportResponse> => rpcClient.submitReport(params),
    submitDataReport: (params): Promise<SubmitDataReportResponse> => rpcClient.submitDataReport(params),
  }
}
