import { badRequest } from '../utils/httpError.js';

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const msg = result.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
      return next(badRequest(msg));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const msg = result.error.issues.map((i) => `${i.path.join('.') || 'query'}: ${i.message}`).join('; ');
      return next(badRequest(msg));
    }
    req.query = result.data;
    next();
  };
}
