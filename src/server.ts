import express from 'express';
import { shortUrlRoutes } from './modules/short-url/routes/short-url.routes'
import corsMiddleware from './middlewares/cors.middleware';

const app = express();

app.use(express.json());

app.use(corsMiddleware);

app.use('/', shortUrlRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

export { app };
