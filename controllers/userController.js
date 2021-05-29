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
					res.redirect('/');
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
			res.redirect('/');
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
			else if (url !== '/login' && url !== '/create') {
				res.redirect('/login');
			} else {
				next();
			}
		});
	}

	getUserItems(req, res) {
		const {username} = req.cookies;
		let userFiles = fileApp.getFolderItems(upload_dir + '/' + username)
		let success = '';

		res.render('pages/home.hbs', {
			success,
			username: username,
			userFilesCount: userFiles.length,
			userFiles: userFiles,
			memory: fileApp.getMemory(userFiles).freeMemory,
			allMemory: fileApp.getMemory(userFiles).allMemory,
			usedMemory: fileApp.getMemory(userFiles).usedMemory
		})
	}

	getUserDirItemsJson(req, res) {
		const {username} = req.cookies;
		const {nameDir} = req.body;
		const {idDir = `uploads/${username}`} = req.query;
		let allUserFiles = fileApp.getFolderItems(upload_dir + '/' + username)
		let message = '';
		let userFiles
		if (req.method === 'GET') {
			if (idDir) {
				userFiles = fileApp.getFolderItems(idDir)
				res.json({userFiles, parentDir: idDir, memory: fileApp.getMemory(allUserFiles), message: ''})
			}
		}
		if (req.method === 'POST') {
			try {
				if (nameDir) {
					if (!fs.existsSync(idDir + '/' + nameDir)) {
						fs.mkdirSync(idDir + '/' + nameDir)
						message = "Added folder"
					} else {
						message = "Directory already exists."
					}

				}
				if (req.files) {
					const filesList = Object.values(req.files);
					const fileSize = filesList[0].size
					if ((fileApp.UsedMemory + fileSize) < fileApp.AllMemory) {
						fileApp.addFiles(filesList, username, idDir)
						message = "Added file"
					} else {
						message = "Not enough memory"
					}
				}
				userFiles = fileApp.getFolderItems(idDir)
				res.json({userFiles, parentDir: idDir, memory: fileApp.getMemory(allUserFiles), message})
			} catch (err) {
				console.log('Server error ', err)
			}
		}
	}
}

exports.UserController = new UserController();
