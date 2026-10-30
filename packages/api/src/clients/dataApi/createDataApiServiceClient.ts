import { type PartialMessage } from '@bufbuild/protobuf'
import { type PromiseClient } from '@connectrpc/connect'
import { type DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import type {
  GetPortfolioRequest,
  GetPortfolioResponse,
  GetWalletBalancesRequest,
  GetWalletBalancesResponse,
  GetWalletProfitLossRequest,
  GetWalletProfitLossResponse,
  GetWalletsBalancesRequest,
  GetWalletsBalancesResponse,
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
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
export interface DataApiServiceClientContext {
  rpcClient: PromiseClient<typeof DataApiService>
}

export interface DataApiServiceClient {
  getPortfolio: (params: PartialMessage<GetPortfolioRequest>) => Promise<GetPortfolioResponse>
  getPortfolioChart: (params: PartialMessage<GetPortfolioChartRequest>) => Promise<GetPortfolioChartResponse>
  listTransactions: (params: PartialMessage<ListTransactionsRequest>) => Promise<ListTransactionsResponse>
  getWalletBalances: (params: PartialMessage<GetWalletBalancesRequest>) => Promise<GetWalletBalancesResponse>
  getWalletsBalances: (params: PartialMessage<GetWalletsBalancesRequest>) => Promise<GetWalletsBalancesResponse>
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
    getWalletBalances: (params): Promise<GetWalletBalancesResponse> => rpcClient.getWalletBalances(params),
    getWalletsBalances: (params): Promise<GetWalletsBalancesResponse> => rpcClient.getWalletsBalances(params),
    getWalletProfitLoss: (params): Promise<GetWalletProfitLossResponse> => rpcClient.getWalletProfitLoss(params),
    getWalletTokenProfitLoss: (params): Promise<GetWalletTokenProfitLossResponse> =>
      rpcClient.getWalletTokenProfitLoss(params),
    getWalletTokensProfitLoss: (params): Promise<GetWalletTokensProfitLossResponse> =>
      rpcClient.getWalletTokensProfitLoss(params),
    submitReport: (params): Promise<SubmitReportResponse> => rpcClient.submitReport(params),
    submitDataReport: (params): Promise<SubmitDataReportResponse> => rpcClient.submitDataReport(params),
  }
}
