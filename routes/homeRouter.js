const homeRouter = require('express').Router();
const { FileController } = require('../controllers/fileController');
const fileUpload = require('express-fileupload');

homeRouter.use(fileUpload({ createParentPath: true }));
homeRouter.use('/create', FileController.register);
homeRouter.use('/login', FileController.login);
homeRouter.use('/logout', FileController.logout);
homeRouter.use('/:username-files', FileController.getUserDirItemsJson);
homeRouter.use('/', FileController.getUserItems);

homeRouter.use((req, res) => {
  res.status(404).render('pages/404.hbs');
});

module.exports = homeRouter;
