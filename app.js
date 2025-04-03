const express = require('express');
const cors = require('cors');
const app = express();
const dbInstance = require('./src/config/mongoose');
const bodyParser = require('body-parser');
const error_handler = require('./src/utils/error-handler');
const { isJsonStr } = require('./src/utils/utils');
const { createUserApiLog } = require('./src/models/log_model');
const requestIp = require('request-ip');
const {
  expressLogger,
  expressErrorLogger,
} = require('./src/utils/winston-logger');
const endMw = require('express-end');
const { isCelebrateError } = require('celebrate');
const fs = require('fs');

// db connection
dbInstance.connect();

// Routes
const userRoutes = require('./src/routes/user_routes');
const productRoutes = require('./src/routes/product_routes');
const config = require('./src/config/config');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('express-compression');
const rateLimit = require('express-rate-limit');

// This will create folder in root dir with provided name and if exist already nothing happen
const uploadsFolder = './uploads';
if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder);
}

app.get('/' + config.server.route + '/pingServer', (req, res) => {
  res.status(200).send('OK');
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(endMw);

app.use(bodyParser.text({ type: 'text/plain', limit: '50mb' }));

app.use(requestIp.mw());

//----------------------------Middleware for printing logs on console
app.use(expressLogger);

app.use(cors());

app.use(helmet());

app.use(
  helmet.crossOriginResourcePolicy({
    policy: 'cross-origin',
  })
);

app.use(
  helmet.referrerPolicy({
    policy: 'no-referrer',
  })
);

const xssOptions = {
  whiteList: {
    '*': ['style'], // Allow all tags with "style" attribute
    script: [], // Disallow <script> tags
  },
};

app.use(xss(xssOptions));

app.use(mongoSanitize());

app.use((req, res, next) => {
  if (req.body && typeof req.body === 'string') {
    req.body = sanitizeHtml(req.body);
  }
  next();
});

app.use(compression());

app.use(function (req, res, next) {
  res.once('end', function () {
    createUserApiLog(req, res);
  });

  let oldSend = res.send;
  res.send = function (data) {
    res.locals.res_body = isJsonStr(data) ? JSON.parse(data) : data;
    oldSend.apply(res, arguments);
  };
  next();
});

app.use('/uploads', express.static('uploads'));
// Routes which should handle requests
app.use('/' + config.server.route + '/user', userRoutes);
app.use('/' + config.server.route + '/product', productRoutes);

app.use((req, res, next) => {
  const error = new Error(error_handler.ERROR_404);
  error.statusCode = 404;
  next(error);
});

process.on('unhandledRejection', (error) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    result: 'error',
    code: statusCode,
    desc: error.message || 'Internal Server Error',
  });
});

process.on('uncaughtException', (error) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    result: 'error',
    code: statusCode,
    desc: error.message || 'Internal Server Error',
  });
});

app.use((error, req, res, next) => {
  if (isCelebrateError(error)) {
    const errorBody = error.details.get('body');
    const {
      details: [errorDetails],
    } = errorBody;
    return res.status(422).json({
      result: 'Validation error',
      code: 422,
      desc: errorDetails.message,
    });
  }

  if (error.name === 'MongoError') {
    if (error.code === 11000) {
      return res.status(409).json({
        result: 'Conflict',
        code: 409,
        desc: 'Duplicate key',
      });
    }
  }

  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(400).json({
      result: 'Bad Request',
      code: 400,
      desc: 'Invalid ID',
    });
  }

  // Handle other server errors
  if (!res.headersSent) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      result: 'error',
      code: statusCode,
      desc: error.message || 'Internal Server Error',
    });
  }
});

app.use(expressErrorLogger);

module.exports = app;
