export interface MetricsRepository {
  updateMetrics(identifier: string, increment: number): Promise<void>;
}

export interface MetricsService {
  incrementAccessCount(identifier: string): Promise<void>;
}
