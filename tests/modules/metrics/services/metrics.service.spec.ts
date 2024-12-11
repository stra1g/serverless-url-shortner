import {
  MetricsRepository,
  MetricsService,
} from '@modules/metrics/interfaces/metric.interface';
import { MetricsServiceImpl } from '@modules/metrics/services/metrics.service';

describe('MetricsServiceImpl', () => {
  let mockRepository: jest.Mocked<MetricsRepository>;
  let metricsService: MetricsService;

  beforeEach(() => {
    mockRepository = {
      updateMetrics: jest.fn(),
    };

    metricsService = new MetricsServiceImpl(mockRepository);
  });

  it('should increment access count successfully', async () => {
    mockRepository.updateMetrics.mockResolvedValueOnce();

    const identifier = 'test-identifier';

    await metricsService.incrementAccessCount(identifier);

    expect(mockRepository.updateMetrics).toHaveBeenCalledTimes(1);
    expect(mockRepository.updateMetrics).toHaveBeenCalledWith(identifier, 1);
  });

  it('should throw an error if updateMetrics fails', async () => {
    mockRepository.updateMetrics.mockRejectedValueOnce(
      new Error('DynamoDB error'),
    );

    const identifier = 'test-identifier';

    const originalConsoleError = console.error;
    console.error = jest.fn();

    await expect(
      metricsService.incrementAccessCount(identifier),
    ).rejects.toThrow('Failed to update metrics');

    expect(console.error).toHaveBeenCalledWith(
      'Error incrementing access count:',
      expect.any(Error),
    );

    console.error = originalConsoleError;
  });
});
