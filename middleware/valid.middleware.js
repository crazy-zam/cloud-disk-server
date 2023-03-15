const { check, validationResult } = require('express-validator');
const validMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: `Uncorrect request: ${errors.errors
        .map((err) => err.msg)
        .join(', ')}`,
    });
  }
  next();
};
const validRules = () => {
  return [
    check('email', 'Uncorrect email').isEmail(),
    check(
      'password',
      'Password must be longer than 3 and shorter than 12',
    ).isLength({ min: 3, max: 12 }),
  ];
};

module.exports = { validMiddleware, validRules };
