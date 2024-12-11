import { MetricsServiceImpl } from '@modules/metrics/services/metrics.service';
import {
  createShortUrlController,
  redirectShortUrlController,
} from '@modules/short-url/controllers/short-url.controller';
import { ShortUrlServiceImpl } from '@modules/short-url/services/short-url.service';
import express from 'express';

const router = express.Router();

const shortUrlService = new ShortUrlServiceImpl();
const metricsService = new MetricsServiceImpl();

const createHandler = createShortUrlController(shortUrlService);
const redirectHandler = redirectShortUrlController(
  shortUrlService,
  metricsService,
);

router.post('/short-url', createHandler);

router.get('/:identifier', redirectHandler);
router.post('/:identifier', redirectHandler);

export { router as shortUrlRoutes };
