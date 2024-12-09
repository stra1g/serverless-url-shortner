import { Request, Response } from 'express';
import { ShortUrlServiceImpl } from '../services/short-url.service';
import { ShortUrlService } from '../interfaces/short-url.interface';
import { MetricsService } from '../../metrics/interfaces/metric.interface';
import { MetricsServiceImpl } from '../../metrics/services/metrics.service';
import { verifyExpiration } from '../../../helpers/verify-expiration';

const shortUrlService: ShortUrlService = new ShortUrlServiceImpl();
const metricsService: MetricsService = new MetricsServiceImpl();

export const createShortUrlController = async (req: Request, res: Response): Promise<void> => {
  const { original_url, ttl } = req.body;

  if (!original_url || typeof original_url !== 'string') {
    res.status(400).json({ error: '"original_url" must be a string' });
    return;
  }

  try {
    const shortUrl = await shortUrlService.createShortUrl(original_url, ttl);
    res.status(201).json(shortUrl);
  } catch (error) {
    console.error('Error creating short URL:', error);
    res.status(500).json({ error: 'Failed to create short URL' });
  }
};

export const redirectShortUrlController = async (req: Request, res: Response): Promise<void> => {
  const identifier = req.params.identifier;

  try {
    const shortUrl = await shortUrlService.getShortUrl(identifier);

    if (!shortUrl) {
      res.status(404).json({ error: 'Short URL not found' });
      return;
    }

    const { original_url, expires_at, http_method } = shortUrl;

    if (verifyExpiration(expires_at)) {
      res.status(410).json({ error: 'Short URL has expired' });
      return;
    }

    if (http_method.toLowerCase() !== req.method.toLowerCase()) {
      res.status(405).json({ error: `This URL only accepts ${http_method.toUpperCase()} requests` });
      return;
    }

    await metricsService.incrementAccessCount(identifier);

    if (req.method.toLowerCase() === 'get') {
      res.redirect(302, original_url);
    } else {
      const response = await fetch(original_url, {
        method: 'POST',
        body: JSON.stringify(req.body),
      });
      res.status(response.status).json(await response.json());
    }
  } catch (error) {
    console.error('Error processing short URL redirect:', error);
    res.status(500).json({ error: 'Failed to redirect to short URL' });
  }
};
