const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Validation middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg
    }));

    throw new AppError('Validasyon hatası', HTTP_STATUS.BAD_REQUEST, errorMessages);
  }
  
  next();
};

module.exports = validate;

