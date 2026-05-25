import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { User } from './models/User.js';
import apiRoutes from './routes/index.js';
import { ROLES } from './utils/constants.js';

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(helmet());
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString();
    }
  })
);
app.use(morgan('dev'));

app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

const seedAdmin = async () => {
  if (!env.adminEmail || !env.adminPassword) {
    return;
  }

  const existingAdmin = await User.findOne({ email: env.adminEmail.toLowerCase() });

  if (!existingAdmin) {
    await User.create({
      name: 'System Admin',
      email: env.adminEmail.toLowerCase(),
      password: env.adminPassword,
      role: ROLES.ADMIN
    });
  }
};

const startServer = async () => {
  try {
    await connectDatabase();
    await seedAdmin();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
