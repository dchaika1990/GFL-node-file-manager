const express = require('express');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const path = require('path');

// const UPLOAD_DIR = path.resolve('./uploads');
const UPLOAD_DIR = path.relative(__dirname, path.resolve(__dirname, 'uploads/'));
global.upload_dir = UPLOAD_DIR;
const app = express();

const {
	userRouter
} = require('./routes');

const { UserController } = require('./controllers');

app.set('view engine', 'hbs');
app.set('views', __dirname + '/public/views');
hbs.registerPartials(__dirname + '/public/views/partials');

const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(urlencodedParser);
app.use(cookieParser());

app.use('/scripts', express.static(__dirname + '/public/js'));
app.use('/styles', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/uploads', express.static(upload_dir));

app.use(UserController.isValidUser);
app.use('/user', userRouter);

app.use((req, res) => {
	res.render('pages/404.hbs')
});

app.listen(process.env.PORT || 3010, () => {
	console.log('Server started!');
});