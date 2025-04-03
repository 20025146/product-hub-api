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
const shopRoutes = require('./src/routes/clearning_services_routes');
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
//----------------------------------Middleware Ended-------------------------------

//Order of this route matters need to place this above store log middleware as it's returning empty result and we don't need to store record of this
app.get('/' + config.server.route + '/pingServer', (req, res) => {
  //Route to Ping & check if Server is online
  res.status(200).send('OK');
});

// Apply the rate limiting middleware to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

//----------------------------Middleware for accepting encoded & json request params
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//----------------------------------Middleware Ended-------------------------------

//----------------------------Middleware for capturing request is actually ended even though listener is timed out
app.use(endMw);
//----------------------------------Middleware Ended-------------------------------

//----------------------------Middleware for reading raw Body as text use req.body
app.use(bodyParser.text({ type: 'text/plain', limit: '50mb' }));
//----------------------------------Middleware Ended-------------------------------

//----------------------------Middleware for Getting a user's IP
app.use(requestIp.mw());
//----------------------------------Middleware Ended-------------------------------

//----------------------------Middleware for printing logs on console
app.use(expressLogger);
//----------------------------------Middleware Ended-------------------------------------

//----------------------------Middleware to Fix CORS Errors This Will Update The Incoming Request before sending to routes
// Allow requests from all origins
app.use(cors());

// Configure Helmet
app.use(helmet());

// Add Helmet configurations
app.use(
  helmet.crossOriginResourcePolicy({
    policy: 'cross-origin',
  }),
);

app.use(
  helmet.referrerPolicy({
    policy: 'no-referrer',
  }),
);

// sanitize request data
// Configure xssClean middleware to whitelist all tags except <script> and allow "style" attribute
const xssOptions = {
  whiteList: {
    '*': ['style'], // Allow all tags with "style" attribute
    script: [], // Disallow <script> tags
  },
};

app.use(xss(xssOptions));

app.use(mongoSanitize());

// Additional middleware to sanitize HTML content
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'string') {
    req.body = sanitizeHtml(req.body);
  }
  next();
});

// gzip compression
app.use(compression());

//--------------------------------------------------------Middleware Ended----------------------------------------------

//-----------------------------Middleware for storing API logs into DB
app.use(function (req, res, next) {
  // Do whatever you want this will execute when response is finished
  res.once('end', function () {
    createUserApiLog(req, res);
  });

  // Save Response body
  let oldSend = res.send;
  res.send = function (data) {
    res.locals.res_body = isJsonStr(data) ? JSON.parse(data) : data;
    oldSend.apply(res, arguments);
  };
  next();
});
//--------------------------------------------------------Middleware Ended----------------------------------------------

app.use('/uploads', express.static('uploads'));

// Routes which should handle requests
app.use('/' + config.server.route + '/user', userRoutes);
app.use('/' + config.server.route + '/service', shopRoutes);

//----------------------------Middleware for catching 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error(error_handler.ERROR_404);
  error.statusCode = 404;
  next(error);
});

// Attach event listeners for unhandled rejections and uncaught exceptions
process.on('unhandledRejection', error => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    result: 'error',
    code: statusCode,
    desc: error.message || 'Internal Server Error',
  });
});

process.on('uncaughtException', error => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    result: 'error',
    code: statusCode,
    desc: error.message || 'Internal Server Error',
  });
});

//Error handler
app.use((error, req, res, next) => {
  // Because we hooking post-response processing into the global error handler, we
  // get to leverage unified logging and error handling; but, it means the response
  // may have already been committed, since we don't know if the error was thrown
  // PRE or POST response. As such, we have to check to see if the response has
  // been committed before we attempt to send anything to the user.
  // Handling Celebrate validation errors
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

  // Handling MongoDB errors
  if (error.name === 'MongoError') {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({
        result: 'Conflict',
        code: 409,
        desc: 'Duplicate key',
      });
    }
    // Handle other MongoDB-specific errors as needed
  }

  // Handling ObjectID errors
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

//Best Tested place that store only uncaught errors
app.use(expressErrorLogger);

module.exports = app;
