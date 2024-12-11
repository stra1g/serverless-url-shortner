import express from 'express';
import {
  createShortUrlController,
  redirectShortUrlController,
} from '../controllers/short-url.controller';
import { ShortUrlServiceImpl } from '../services/short-url.service';
import { MetricsServiceImpl } from '../../metrics/services/metrics.service';

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
