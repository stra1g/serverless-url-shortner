import { ShortUrl } from '../models/short-url.model';

export interface ShortUrlRepository {
  createShortUrl(payload: ShortUrl): Promise<ShortUrl>;
  getShortUrlByIdentifier(identifier: string): Promise<ShortUrl | null>;
}

export interface ShortUrlService {
  createShortUrl(originalUrl: string, ttl?: number): Promise<ShortUrl>;
  getShortUrl(identifier: string): Promise<ShortUrl | null>;
}
