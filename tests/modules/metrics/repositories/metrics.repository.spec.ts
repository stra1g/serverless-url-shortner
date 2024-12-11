import { docClient } from '@config/dynamo-db-client';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { MetricsRepositoryImpl } from '@modules/metrics/repositories/metrics.repository';

jest.mock('@config/dynamo-db-client', () => ({
  docClient: {
    send: jest.fn(),
  },
}));

const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('MetricsRepositoryImpl', () => {
  let metricsRepo: MetricsRepositoryImpl;

  beforeAll(() => {
    process.env.METRICS_TABLE = 'test-metrics-table';
  });

  beforeEach(() => {
    metricsRepo = new MetricsRepositoryImpl();
    (docClient.send as jest.Mock).mockClear();
  });

  it('should update metrics successfully', async () => {
    (docClient.send as jest.Mock).mockResolvedValue({
      Attributes: {
        access_count: 10,
        last_accessed: '2024-12-09T00:00:00.000Z',
      },
    });

    const identifier = 'test-identifier';
    const increment = 5;

    await metricsRepo.updateMetrics(identifier, increment);

    expect(docClient.send).toHaveBeenCalledTimes(1);
    const callArgs = (docClient.send as jest.Mock).mock.calls[0][0];
    expect(callArgs).toBeInstanceOf(UpdateCommand);

    const input = callArgs.input;
    expect(input.TableName).toBe('test-metrics-table');
    expect(input.Key).toEqual({ unique_identifier: identifier });
    expect(input.UpdateExpression).toContain(
      'access_count = if_not_exists(access_count, :zero) + :increment',
    );
    expect(input.ExpressionAttributeValues[':increment']).toBe(increment);
    expect(input.ExpressionAttributeValues[':zero']).toBe(0);
    expect(input.ExpressionAttributeValues[':lastAccessed']).toBeDefined();
  });

  it('should throw error if docClient.send fails', async () => {
    (docClient.send as jest.Mock).mockRejectedValue(
      new Error('DynamoDB error'),
    );

    const identifier = 'test-identifier';
    const increment = 5;

    await expect(
      metricsRepo.updateMetrics(identifier, increment),
    ).rejects.toThrow('Could not update metrics');
    expect(docClient.send).toHaveBeenCalledTimes(1);

    expect(console.error).toHaveBeenCalledWith(
      'Error updating metrics:',
      expect.any(Error),
    );
  });
});
