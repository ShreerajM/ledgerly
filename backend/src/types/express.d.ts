import type { AuthUser } from '../middleware/authenticate.ts'

// Lets TypeScript know that `authenticate` attaches the signed-in user to the request.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}
