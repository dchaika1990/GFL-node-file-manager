const userModel = require('../models/userModel');
const fileApp = require('../models/File');


class UserController {
	register(req, res) {
		const {
			method,
			body: {username, password},
		} = req;

		if (method === 'GET') return res.render('pages/create.hbs');

		userModel.register(username, password, result => {
			const {success, msg} = result;

			if (!success) {
				return res.render('pages/create.hbs', {
					erroMessage: msg,
				});
			} else {
				userModel.loginPromised(username, password, result => {
					const {success, msg} = result;
					if (!success) {
						return res.render('pages/login.hbs', {
							erroMessage: msg,
						});
					}
					res.cookie('token', msg, {
						httpOnly: true,
					});
					fileApp.createUserDir(username)
					res.redirect('/' + username);
				});
			}
		});
	}

	login(req, res) {
		const {username, password} = req.body;
		const {method} = req;

		if (method === 'GET') return res.render('pages/login.hbs');

		userModel.loginPromised(username, password, result => {
			const {success, msg} = result;
			if (!success) {
				return res.render('pages/login.hbs', {
					erroMessage: msg,
				});
			}
			res.cookie('token', msg, {
				httpOnly: true,
			});
			res.redirect('/' + username);
		});
	}

	logout(req, res) {
		res.clearCookie('token');
		res.redirect('/');
	}

	isValidUser(req, res, next) {
		userModel.isValidToken(req.cookies.token || '', isValid => {
			const {url} = req;

			if (isValid) next();
			else if (url !== '/user/login' && url !== '/user/create') {
				res.redirect('/user/login');
			} else {
				next();
			}
		});
	}

	getUserItems(req, res) {
		const {username} = req.params;
		let userFiles = fileApp.getFolderItems(upload_dir + '/' + username, username)
		let success = '';
		if (req.method === 'POST') {
			try {
				if (!req.files) {
					res.json({
						success: false,
						message: 'No file uploaded',
					});
				} else {
					const filesList = Object.values(req.files);
					const fileSize = filesList[0].size
					console.log((fileApp.UsedMemory + fileSize) < fileApp.AllMemory)
					if ((fileApp.UsedMemory + fileSize) < fileApp.AllMemory) {
						fileApp.addFiles(filesList, username)
						userFiles = fileApp.getFolderItems(upload_dir + '/' + username, username)
					} else {
						success = 'Not Enough Memory'
					}
				}
			} catch (err) {
				res.status(500).json({success: false, message: 'Server error'});
			}
		}
		res.render('pages/home.hbs', {
			success,
			username: username,
			userFilesCount: userFiles.length,
			userFiles: userFiles,
			memory: fileApp.getMemory(userFiles).usedMemory
		})
	}

	getUserItemsJson(req, res) {
		const {username} = req.params;
		const userFiles = fileApp.getFolderItems(upload_dir + '/' + username, username)
		res.json({userFiles, memory: fileApp.getMemory(userFiles)})
	}
}

exports.UserController = new UserController();
