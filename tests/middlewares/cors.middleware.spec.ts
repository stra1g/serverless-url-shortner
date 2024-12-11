import { Request, Response, NextFunction } from 'express';
import corsMiddleware from '../../src/middlewares/cors.middleware';

describe('corsMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock<NextFunction>;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };
    next = jest.fn();
  });

  it('should set correct CORS headers', () => {
    req.method = 'GET';

    corsMiddleware(req as Request, res as Response, next as NextFunction);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      '*',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    expect(next).toHaveBeenCalled();
  });

  it('should respond with 200 and end the request for OPTIONS method', () => {
    req.method = 'OPTIONS';

    corsMiddleware(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next for non-OPTIONS methods', () => {
    req.method = 'POST';
    corsMiddleware(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
