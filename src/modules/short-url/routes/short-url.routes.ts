import express from 'express';
import { createShortUrlController, redirectShortUrlController } from '../controllers/short-url.controller';

const router = express.Router();

router.post('/short-url', createShortUrlController);

router.get('/:identifier', redirectShortUrlController);
router.post('/:identifier', redirectShortUrlController);

export { router as shortUrlRoutes };
