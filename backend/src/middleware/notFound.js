const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../config/constants');

/**
 * 404 Not Found middleware
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `Route bulunamadı: ${req.originalUrl}`,
    HTTP_STATUS.NOT_FOUND
  );
  next(error);
};

module.exports = notFound;

