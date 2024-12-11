import { Request, Response } from 'express';
import {
  createShortUrlController,
  redirectShortUrlController,
} from '../../../../src/modules/short-url/controllers/short-url.controller';
import { ShortUrlServiceImpl } from '../../../../src/modules/short-url/services/short-url.service';
import { MetricsServiceImpl } from '../../../../src/modules/metrics/services/metrics.service';
import { ShortUrl } from '../../../../src/modules/short-url/models/short-url.model';

jest.mock('../../../../src/modules/short-url/services/short-url.service');
jest.mock('../../../../src/modules/metrics/services/metrics.service');
jest.mock('../../../../src/helpers/verify-expiration', () => ({
  verifyExpiration: jest.fn(),
}));

describe('ShortUrl Controllers', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  const mockShortUrlService =
    new ShortUrlServiceImpl() as jest.Mocked<ShortUrlServiceImpl>;
  const mockMetricsService =
    new MetricsServiceImpl() as jest.Mocked<MetricsServiceImpl>;
  const {
    verifyExpiration,
  } = require('../../../../src/helpers/verify-expiration');

  const createController = createShortUrlController(mockShortUrlService);
  const redirectController = redirectShortUrlController(
    mockShortUrlService,
    mockMetricsService,
  );

  beforeAll(() => {
    // Mock global fetch for POST redirect scenarios
    global.fetch = jest.fn();
    // Mock console.error to keep the terminal output clean
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('createShortUrlController', () => {
    it('should return 400 if original_url is not provided or not a string', async () => {
      mockReq.body = { original_url: 123 };
      await createController(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '"original_url" must be a string',
      });
    });

    it('should create a short URL and return 201', async () => {
      const mockShortUrl: ShortUrl = {
        unique_identifier: 'abc123',
        original_url: 'https://example.com',
        created_at: Math.floor(Date.now() / 1000),
        http_method: 'get',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      mockShortUrlService.createShortUrl.mockResolvedValue(mockShortUrl);
      mockReq.body = { original_url: 'https://example.com', ttl: 3600 };

      await createController(mockReq as Request, mockRes as Response);

      expect(mockShortUrlService.createShortUrl).toHaveBeenCalledWith(
        'https://example.com',
        3600,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockShortUrl);
    });

    it('should return 500 if service fails', async () => {
      mockShortUrlService.createShortUrl.mockRejectedValue(
        new Error('Service error'),
      );
      mockReq.body = { original_url: 'https://error.com' };

      await createController(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to create short URL',
      });
    });
  });

  describe('redirectShortUrlController', () => {
    it('should return 404 if short URL not found', async () => {
      mockShortUrlService.getShortUrl.mockResolvedValue(null);
      mockReq.params = { identifier: 'notfound' };

      await redirectController(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Short URL not found',
      });
    });

    it('should return 410 if short URL is expired', async () => {
      const mockShortUrl: ShortUrl = {
        unique_identifier: 'abc123',
        original_url: 'https://expired.com',
        created_at: 1000,
        expires_at: 900,
        http_method: 'get',
      };

      mockShortUrlService.getShortUrl.mockResolvedValue(mockShortUrl);
      verifyExpiration.mockReturnValue(true);

      mockReq.params = { identifier: 'abc123' };

      await redirectController(mockReq as Request, mockRes as Response);

      expect(verifyExpiration).toHaveBeenCalledWith(mockShortUrl.expires_at);
      expect(mockRes.status).toHaveBeenCalledWith(410);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Short URL has expired',
      });
    });

    it('should return 405 if request method does not match short URL method', async () => {
      const mockShortUrl: ShortUrl = {
        unique_identifier: 'abc123',
        original_url: 'https://methodcheck.com',
        created_at: 1000,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        http_method: 'post',
      };

      mockShortUrlService.getShortUrl.mockResolvedValue(mockShortUrl);
      verifyExpiration.mockReturnValue(false);

      mockReq.params = { identifier: 'abc123' };
      mockReq.method = 'GET';

      await redirectController(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'This URL only accepts POST requests',
      });
    });

    it('should increment access count and redirect for GET requests', async () => {
      const mockShortUrl: ShortUrl = {
        unique_identifier: 'abc123',
        original_url: 'https://redirect.com',
        created_at: 1000,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        http_method: 'get',
      };

      mockShortUrlService.getShortUrl.mockResolvedValue(mockShortUrl);
      mockMetricsService.incrementAccessCount.mockResolvedValue();
      verifyExpiration.mockReturnValue(false);

      mockReq.params = { identifier: 'abc123' };
      mockReq.method = 'GET';

      await redirectController(mockReq as Request, mockRes as Response);

      expect(mockMetricsService.incrementAccessCount).toHaveBeenCalledWith(
        'abc123',
      );
      expect(mockRes.redirect).toHaveBeenCalledWith(
        302,
        'https://redirect.com',
      );
    });

    it('should increment access count and fetch for POST requests', async () => {
      const mockShortUrl: ShortUrl = {
        unique_identifier: 'abc123',
        original_url: 'https://postendpoint.com',
        created_at: 1000,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        http_method: 'post',
      };

      mockShortUrlService.getShortUrl.mockResolvedValue(mockShortUrl);
      mockMetricsService.incrementAccessCount.mockResolvedValue();
      verifyExpiration.mockReturnValue(false);

      const mockFetchResponse = {
        status: 201,
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

      mockReq.params = { identifier: 'abc123' };
      mockReq.method = 'POST';
      mockReq.body = { data: 'test' };

      await redirectController(mockReq as Request, mockRes as Response);

      expect(mockMetricsService.incrementAccessCount).toHaveBeenCalledWith(
        'abc123',
      );
      expect(global.fetch).toHaveBeenCalledWith('https://postendpoint.com', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return 500 if an error occurs', async () => {
      mockShortUrlService.getShortUrl.mockRejectedValue(
        new Error('Some error'),
      );
      mockReq.params = { identifier: 'abc123' };

      await redirectController(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to redirect to short URL',
      });
    });
  });
});
