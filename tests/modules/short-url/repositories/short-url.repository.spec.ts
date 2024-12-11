import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '@config/dynamo-db-client';
import { ShortUrl } from '@modules/short-url/models/short-url.model';
import { ShortUrlRepositoryImpl } from '@modules/short-url/repositories/short-url.repository';

jest.mock('@config/dynamo-db-client', () => ({
  docClient: {
    send: jest.fn(),
  },
}));

describe('ShortUrlRepositoryImpl', () => {
  let repository: ShortUrlRepositoryImpl;

  beforeAll(() => {
    process.env.SHORT_URLS_TABLE = 'test-short-urls-table';
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    repository = new ShortUrlRepositoryImpl();
    (docClient.send as jest.Mock).mockClear();
  });

  describe('createShortUrl', () => {
    it('should create a short URL successfully', async () => {
      const mockShortUrl: ShortUrl = {
        unique_identifier: 'test123',
        original_url: 'https://example.com',
        created_at: Date.now(),
        http_method: 'get',
        expires_at: Date.now() + 1000,
      };

      (docClient.send as jest.Mock).mockResolvedValueOnce({});

      const result = await repository.createShortUrl(mockShortUrl);

      expect(docClient.send).toHaveBeenCalledTimes(1);
      const callArgs = (docClient.send as jest.Mock).mock.calls[0][0];
      expect(callArgs).toBeInstanceOf(PutCommand);
      expect(callArgs.input.TableName).toBe('test-short-urls-table');
      expect(callArgs.input.Item).toEqual(mockShortUrl);
      expect(result).toEqual(mockShortUrl);
    });

    it('should throw an error if creation fails', async () => {
      (docClient.send as jest.Mock).mockRejectedValueOnce(
        new Error('DynamoDB error'),
      );

      const mockShortUrl: ShortUrl = {
        unique_identifier: 'failTest',
        original_url: 'https://fail.com',
        created_at: Date.now(),
        http_method: 'get',
        expires_at: Date.now() + 1000,
      };

      await expect(repository.createShortUrl(mockShortUrl)).rejects.toThrow(
        'Could not create short URL',
      );
      expect(docClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getShortUrlByIdentifier', () => {
    it('should return a short URL if found', async () => {
      const identifier = 'test123';
      const mockShortUrl: ShortUrl = {
        unique_identifier: identifier,
        original_url: 'https://example.com',
        created_at: Date.now(),
        http_method: 'get',
        expires_at: Date.now() + 1000,
      };

      (docClient.send as jest.Mock).mockResolvedValueOnce({
        Item: mockShortUrl,
      });

      const result = await repository.getShortUrlByIdentifier(identifier);

      expect(docClient.send).toHaveBeenCalledTimes(1);
      const callArgs = (docClient.send as jest.Mock).mock.calls[0][0];
      expect(callArgs).toBeInstanceOf(GetCommand);
      expect(callArgs.input.TableName).toBe('test-short-urls-table');
      expect(callArgs.input.Key).toEqual({ unique_identifier: identifier });
      expect(result).toEqual(mockShortUrl);
    });

    it('should return null if no item is found', async () => {
      const identifier = 'notFound123';
      (docClient.send as jest.Mock).mockResolvedValueOnce({ Item: undefined });

      const result = await repository.getShortUrlByIdentifier(identifier);

      expect(docClient.send).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should return null if an error occurs', async () => {
      const identifier = 'error123';
      (docClient.send as jest.Mock).mockRejectedValueOnce(
        new Error('DynamoDB error'),
      );

      const result = await repository.getShortUrlByIdentifier(identifier);

      expect(docClient.send).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();

      expect(console.error).toHaveBeenCalledWith(
        'Error retrieving short URL:',
        expect.any(Error),
      );
    });
  });
});
