const Router = require('express');
const router = new Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
  validMiddleware,
  validRules,
} = require('../middleware/valid.middleware');
const authController = require('../controllers/authController');

router.post(
  '/registration',
  validRules(),
  validMiddleware,
  authController.registerUser,
);
router.post('/login', authController.loginUser);
router.get('/auth', authMiddleware, authController.authUser);
router.delete('/delete', authMiddleware, authController.deleteUser);

module.exports = router;
