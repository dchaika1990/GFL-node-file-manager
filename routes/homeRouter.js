const homeRouter = require('express').Router();
const { UserController } = require('../controllers/userController');

homeRouter.get('/:username', UserController.getUserItems);

module.exports = homeRouter;
