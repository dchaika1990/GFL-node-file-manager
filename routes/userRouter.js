const userRouter = require('express').Router();
const { UserController } = require('../controllers/userController');

userRouter.use('/create', UserController.register);
userRouter.use('/login', UserController.login);
userRouter.use('/logout', UserController.logout);

userRouter.use((req, res) => {
  res.status(404).render('pages/404.hbs');
});

module.exports = userRouter;
