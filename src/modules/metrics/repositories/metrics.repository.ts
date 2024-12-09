import { docClient } from '../../../config/dynamo-db-client';
import { MetricsRepository } from '../interfaces/metric.interface';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

export class MetricsRepositoryImpl implements MetricsRepository {
  async updateMetrics(identifier: string, increment: number): Promise<void> {
    const params = {
      TableName: process.env.METRICS_TABLE as string,
      Key: { unique_identifier: identifier },
      UpdateExpression: 'SET access_count = if_not_exists(access_count, :zero) + :increment, last_accessed = :lastAccessed',
      ExpressionAttributeValues: {
        ':increment': increment,
        ':zero': 0,
        ':lastAccessed': new Date().toISOString(),
      },
      ReturnValues: 'UPDATED_NEW' as const,
    };

    try {
      await docClient.send(new UpdateCommand(params));
    } catch (error) {
      console.error('Error updating metrics:', error);
      throw new Error('Could not update metrics');
    }
  }
}
