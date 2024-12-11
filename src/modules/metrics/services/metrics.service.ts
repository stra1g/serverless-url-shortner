import {
  MetricsRepository,
  MetricsService,
} from '../interfaces/metric.interface';
import { MetricsRepositoryImpl } from '../repositories/metrics.repository';

export class MetricsServiceImpl implements MetricsService {
  private metricsRepository: MetricsRepository;

  constructor(
    metricsRepository: MetricsRepository = new MetricsRepositoryImpl(),
  ) {
    this.metricsRepository = metricsRepository;
  }

  async incrementAccessCount(identifier: string): Promise<void> {
    try {
      await this.metricsRepository.updateMetrics(identifier, 1);
    } catch (error) {
      console.error('Error incrementing access count:', error);
      throw new Error('Failed to update metrics');
    }
  }
}
