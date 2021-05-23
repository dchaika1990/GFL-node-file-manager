const userRouter = require('express').Router();
const { UserController } = require('../controllers/userController');
const fileUpload = require('express-fileupload');

userRouter.use(fileUpload({ createParentPath: true }));
userRouter.use('/create', UserController.register);
userRouter.use('/login', UserController.login);
userRouter.use('/logout', UserController.logout);
userRouter.use('/:username', UserController.getUserItems);
userRouter.get('/:username/files', UserController.getUserItemsJson);
// userRouter.post('/:username', UserController.addUserItem);

userRouter.use((req, res) => {
  res.status(404).render('pages/404.hbs');
});

module.exports = userRouter;
