import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

export const signToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      tokenVersion: user.tokenVersion || 0
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);
