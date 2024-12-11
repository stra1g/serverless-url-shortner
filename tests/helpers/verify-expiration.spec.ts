import { verifyExpiration } from '../../src/helpers/verify-expiration';

describe('verifyExpiration', () => {
  const fixedTimestampInSeconds = 1672531200; // Example: 2023-01-01T00:00:00Z

  beforeAll(() => {
    jest
      .spyOn(Date, 'now')
      .mockImplementation(() => fixedTimestampInSeconds * 1000);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return true if expires_at is in the past', () => {
    const expiredTimestamp = fixedTimestampInSeconds - 100; // 100 seconds before current
    expect(verifyExpiration(expiredTimestamp)).toBe(true);
  });

  it('should return false if expires_at is in the future', () => {
    const futureTimestamp = fixedTimestampInSeconds + 100; // 100 seconds after current
    expect(verifyExpiration(futureTimestamp)).toBe(false);
  });

  it('should return false if expires_at equals the current time', () => {
    expect(verifyExpiration(fixedTimestampInSeconds)).toBe(false);
  });
});
