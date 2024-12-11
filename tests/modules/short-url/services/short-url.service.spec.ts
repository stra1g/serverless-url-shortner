import {
  ShortUrlRepository,
  ShortUrlService,
} from '../../../../src/modules/short-url/interfaces/short-url.interface';
import { ShortUrlServiceImpl } from '../../../../src/modules/short-url/services/short-url.service';
import { ShortUrl } from '../../../../src/modules/short-url/models/short-url.model';

jest.mock('crypto', () => ({
  randomBytes: jest
    .fn()
    .mockReturnValue(Buffer.from('deadbeefcafebabe', 'hex')),
}));

describe('ShortUrlServiceImpl', () => {
  let mockRepository: jest.Mocked<ShortUrlRepository>;
  let service: ShortUrlService;

  beforeEach(() => {
    mockRepository = {
      createShortUrl: jest.fn(),
      getShortUrlByIdentifier: jest.fn(),
    };

    service = new ShortUrlServiceImpl(mockRepository);
  });

  describe('createShortUrl', () => {
    it('should create a short URL successfully with a given ttl', async () => {
      const originalUrl = 'https://example.com';
      const ttl = 3600; // 1 hour
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const expectedExpiresAt = nowInSeconds + ttl;

      const expectedShortUrl: ShortUrl = {
        original_url: originalUrl,
        unique_identifier: 'deadbeefcafebabe',
        http_method: 'get',
        created_at: nowInSeconds,
        expires_at: expectedExpiresAt,
      };

      mockRepository.createShortUrl.mockResolvedValueOnce(expectedShortUrl);

      const result = await service.createShortUrl(originalUrl, ttl);

      expect(mockRepository.createShortUrl).toHaveBeenCalledTimes(1);
      const callArg = mockRepository.createShortUrl.mock.calls[0][0];

      expect(callArg.original_url).toBe(originalUrl);
      expect(callArg.unique_identifier).toBe('deadbeefcafebabe');
      expect(callArg.created_at).toBeCloseTo(nowInSeconds, -1);
      expect(callArg.expires_at).toBe(expectedExpiresAt);
      expect(callArg.http_method).toBe('get');

      expect(result).toEqual(expectedShortUrl);
    });

    it('should create a short URL with the default ttl if none is provided', async () => {
      const originalUrl = 'https://example-default-ttl.com';
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const defaultTTL = 60 * 60 * 24 * 7; // 7 days
      const expectedExpiresAt = nowInSeconds + defaultTTL;

      const expectedShortUrl: ShortUrl = {
        original_url: originalUrl,
        unique_identifier: 'deadbeefcafebabe',
        http_method: 'get',
        created_at: nowInSeconds,
        expires_at: expectedExpiresAt,
      };

      mockRepository.createShortUrl.mockResolvedValueOnce(expectedShortUrl);

      const result = await service.createShortUrl(originalUrl);

      expect(mockRepository.createShortUrl).toHaveBeenCalledTimes(1);
      const callArg = mockRepository.createShortUrl.mock.calls[0][0];
      expect(callArg.expires_at).toBe(expectedExpiresAt);
      expect(result).toEqual(expectedShortUrl);
    });

    it('should throw an error if repository creation fails', async () => {
      const originalUrl = 'https://error.com';
      mockRepository.createShortUrl.mockRejectedValueOnce(
        new Error('Repository error'),
      );

      const originalConsoleError = console.error;
      console.error = jest.fn();

      await expect(service.createShortUrl(originalUrl)).rejects.toThrow(
        'Failed to create short URL',
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error creating short URL:',
        expect.any(Error),
      );
      console.error = originalConsoleError;
    });
  });

  describe('getShortUrl', () => {
    it('should return a short URL if found', async () => {
      const identifier = 'deadbeefcafebabe';
      const mockShortUrl: ShortUrl = {
        unique_identifier: identifier,
        original_url: 'https://found.com',
        created_at: Math.floor(Date.now() / 1000),
        http_method: 'get',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRepository.getShortUrlByIdentifier.mockResolvedValueOnce(
        mockShortUrl,
      );

      const result = await service.getShortUrl(identifier);
      expect(mockRepository.getShortUrlByIdentifier).toHaveBeenCalledWith(
        identifier,
      );
      expect(result).toEqual(mockShortUrl);
    });

    it('should return null if no short URL is found', async () => {
      const identifier = 'notfound123';
      mockRepository.getShortUrlByIdentifier.mockResolvedValueOnce(null);

      const result = await service.getShortUrl(identifier);
      expect(mockRepository.getShortUrlByIdentifier).toHaveBeenCalledWith(
        identifier,
      );
      expect(result).toBeNull();
    });

    it('should throw an error if retrieval fails', async () => {
      const identifier = 'error123';
      mockRepository.getShortUrlByIdentifier.mockRejectedValueOnce(
        new Error('Repository error'),
      );

      const originalConsoleError = console.error;
      console.error = jest.fn();

      await expect(service.getShortUrl(identifier)).rejects.toThrow(
        'Failed to retrieve short URL',
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error retrieving short URL:',
        expect.any(Error),
      );
      console.error = originalConsoleError;
    });
  });
});
