import { ShortUrlService, ShortUrlRepository } from '../interfaces/short-url.interface';
import { ShortUrl } from '../models/short-url.model';
import { ShortUrlRepositoryImpl } from '../repositories/short-url.repository';
import { randomBytes } from 'crypto';

export class ShortUrlServiceImpl implements ShortUrlService {
  private shortUrlRepository: ShortUrlRepository;

  constructor(shortUrlRepository: ShortUrlRepository = new ShortUrlRepositoryImpl()) {
    this.shortUrlRepository = shortUrlRepository;
  }

  async createShortUrl(originalUrl: string, ttl?: number): Promise<ShortUrl> {
    const createdAt = Math.floor(Date.now() / 1000);
    const expiresAt = ttl ? createdAt + ttl : createdAt + 60 * 60 * 24 * 7; // Default TTL is 7 days

    const shortUrl: ShortUrl = {
      original_url: originalUrl,
      unique_identifier: randomBytes(6).toString('hex'),
      http_method: 'get',
      created_at: createdAt,
      expires_at: expiresAt,
    };

    try {
      return await this.shortUrlRepository.createShortUrl(shortUrl);
    } catch (error) {
      console.error('Error creating short URL:', error);
      throw new Error('Failed to create short URL');
    }
  }

  async getShortUrl(identifier: string): Promise<ShortUrl | null> {
    try {
      return await this.shortUrlRepository.getShortUrlByIdentifier(identifier);
    } catch (error) {
      console.error('Error retrieving short URL:', error);
      throw new Error('Failed to retrieve short URL');
    }
  }
}
