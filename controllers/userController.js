const userModel = require('../models/userModel');
const fileApp = require('../models/File');
const fs = require('fs')

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
				userModel.loginPromised(username, password,result => {
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

		userModel.loginPromised(username, password,result => {
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

	getUserItems(req, res){
		const { username } = req.params;
		const userFiles = fileApp.getFolderItems(upload_dir + '/' + username)

		if (req.method === 'POST') {
			try {
				if (!req.files) {
					res.json({
						success: false,
						message: 'No file uploaded',
					});
				} else {
					const filesList = Object.values(req.files);
					filesList.forEach((file, i) => {
						file.mv(
							upload_dir + `/${username}/` + file.name,
							err => {
								const result = {
									name: file.name,
									mimetype: file.mimetype,
									size: file.size,
									status: true,
								};
							}
						);
					});
				}
			} catch (err) {
				res.status(500).json({ success: false, message: 'Server error' });
			}
		}

		res.render('pages/home.hbs', {
			username: username,
			userFilesCount: userFiles.length,
			userFiles: userFiles
		})
	}

	getUserItemsJson(req, res){
		const { username } = req.params;
		const userFiles = fileApp.getFolderItems(upload_dir + '/' + username)
		res.status(200).json(userFiles)
	}
}

exports.UserController = new UserController();
