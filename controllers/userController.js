const userModel = require('../models/userModel');
const fs = require('fs');

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
				let userDir = upload_dir + '/' + username;
				if (!fs.existsSync(userDir)){
					fs.mkdirSync(userDir);
				}
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
		});
	}

	login(req, res) {
		const {username, password} = req.body;
		const {method} = req;
		console.log(req.body)

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
}

exports.UserController = new UserController();
