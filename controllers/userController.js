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
					res.cookie('username', username);
					fileApp.createUserDir(username)
					res.redirect('/user/' + username);
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
			res.cookie('username', username);
			res.redirect('/user/' + username);
		});
	}

	logout(req, res) {
		res.clearCookie('token');
		res.clearCookie('username');
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
		let userFiles = fileApp.getFolderItems(upload_dir + '/' + username)
		let success = '';

		res.render('pages/home.hbs', {
			success,
			username: username,
			userFilesCount: userFiles.length,
			userFiles: userFiles,
			memory: fileApp.getMemory(userFiles).freeMemory,
			allMemory: fileApp.getMemory(userFiles).allMemory
		})
	}

	getUserDirItemsJson(req, res) {
		const {username} = req.params;
		const {idDir = `uploads/${username}`} = req.query;
		let userFiles
		if (idDir) {
			userFiles = fileApp.getFolderItems(idDir)
			res.json({userFiles, parentDir: idDir, memory: fileApp.getMemory(userFiles)})
		}
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
					if ((fileApp.UsedMemory + fileSize) < fileApp.AllMemory) {
						fileApp.addFiles(filesList, username, idDir)
					} else {
						// res.json({success: false, message: 'Not Enough Memory'});
					}
				}
			} catch (err) {
				res.status(500).json({success: false, message: 'Server error'});
			}
		}
	}
}

exports.UserController = new UserController();
