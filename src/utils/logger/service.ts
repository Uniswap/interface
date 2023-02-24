import { Log } from './measure'

interface LogsService {
  send(measures: Log[]): Promise<void>
}

class MockLogsService implements LogsService {
  async send(measures: Log[]) {
    void measures
  }
}

let timingsService: LogsService = new MockLogsService()

export function setLogsService(service: LogsService) {
  timingsService = service
}

export function send(logs: Log[]) {
  timingsService.send(logs)
}
