const express = require('express');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const path = require('path');

const UPLOAD_DIR = path.resolve('./uploads');
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
// app.use(fileUpload({ createParentPath: true }));

app.use('/scripts', express.static(__dirname + '/public/js'));
app.use('/styles', express.static(__dirname + '/public/css'));

app.use(UserController.isValidUser);
app.use('/user', userRouter);
// app.get('/:username', (req, res) => {
// 	res.render('pages/home.hbs')
// });

// app.use('/upload', (req, res) => {
// 	if (req.method === 'GET') return res.render('pages/upload.hbs');
//
// 	try {
// 		if (!req.files) {
// 			res.json({
// 				success: false,
// 				message: 'No file uploaded',
// 			});
// 		} else {
// 			let data = [];
//
// 			const filesList = Object.values(req.files);
//
// 			filesList.forEach((file, i) => {
// 				file.mv(
// 					__dirname + `/uploads/${i % 2 ? 'sub/' : ''}` + file.name,
// 					err => {
// 						const result = {
// 							name: file.name,
// 							mimetype: file.mimetype,
// 							size: file.size,
// 							status: true,
// 						};
//
// 						if (err) {
// 							result.status = false;
// 						}
//
// 						data.push(result);
//
// 						if (data.length === filesList.length) {
// 							res.json({
// 								success: true,
// 								message: 'File(s) are uploaded',
// 								data: data,
// 							});
// 						}
// 					}
// 				);
// 			});
// 		}
// 	} catch (err) {
// 		res.status(500).json({ success: false, message: 'Server error' });
// 	}
// });

app.use((req, res) => {
	res.render('pages/404.hbs')
});

app.listen(process.env.PORT || 3010, () => {
	console.log('Server started!');
});