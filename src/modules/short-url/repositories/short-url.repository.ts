import { docClient } from '../../../config/dynamo-db-client';
import { ShortUrlRepository } from '../interfaces/short-url.interface';
import { ShortUrl } from '../models/short-url.model';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

export class ShortUrlRepositoryImpl implements ShortUrlRepository {
  async createShortUrl(payload: ShortUrl): Promise<ShortUrl> {
    const params = {
      TableName: process.env.SHORT_URLS_TABLE as string,
      Item: payload,
    };

    try {
      const command = new PutCommand(params);
      await docClient.send(command);
      return payload;
    } catch (error) {
      console.error('Error creating short URL:', error);
      throw new Error('Could not create short URL');
    }
  }

  async getShortUrlByIdentifier(identifier: string): Promise<ShortUrl | null> {
    const params = {
      TableName: process.env.SHORT_URLS_TABLE as string,
      Key: { unique_identifier: identifier },
    };

    try {
      const command = new GetCommand(params);
      const { Item } = await docClient.send(command);
      return Item ? (Item as ShortUrl) : null;
    } catch (error) {
      console.error('Error retrieving short URL:', error);
      return null;
    }
  }
}
