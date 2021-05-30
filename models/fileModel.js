const Database = require('./DB');
const fileApp = require('./File');

class FileModel {
	isExists(username, callback) {
		Database.query(
			'SELECT COUNT(id) as `exists` FROM users WHERE name=? LIMIT 1',
			[username],
			result => {
				callback(result.msg[0].exists === 1);
			}
		);
	}

	register(username, password, callback) {
		if (!username)
			return callback({
				success: false,
				msg: 'User is required',
			});

		if (!password)
			return callback({
				success: false,
				msg: 'Password is required',
			});

		this.isExists(username, isExists => {
			if (isExists)
				return callback({
					success: false,
					msg: 'User already exists',
				});

			Database.query(
				"INSERT INTO users VALUES (NULL, ? , SHA1(?), '')",
				[username, password],
				result => {
					const {success, msg} = result;

					if (!success) return callback(msg);

					callback(result);
				}
			);
		});
	}

	async loginPromised(username, password, callback) {
		if (!username)
			return callback({
				success: false,
				msg: 'Username is required',
			});

		if (!password)
			return callback({
				success: false,
				msg: 'Password is required',
			});

		try {
			const [userInfo] = await Database.promise().execute(
				'SELECT id, name, password FROM users WHERE name=? AND password=SHA1(?) LIMIT 1',
				[username, password]
			);

			if (userInfo.length === 0)
				return callback({success: false, msg: 'User not exists'});

			const {password: securedPass, id} = userInfo[0];

			const [{affectedRows}] = await Database.promise().execute(
				'UPDATE users SET token=SHA1(?) WHERE id=? LIMIT 1',
				[`${username}${securedPass}${new Date().getTime()}`, id]
			);

			if (affectedRows === 0)
				return callback({
					success: false,
					msg: 'Smth went wrong. Please try later.',
				});

			const [userToken] = await Database.promise().execute(
				'SELECT token FROM users WHERE id=? LIMIT 1',
				[id]
			);

			if (userToken.length === 0)
				return callback({
					success: false,
					msg: 'Smth went wrong. Please try later.',
				});


			const allFiles = fileApp.getFolderItems(upload_dir + '/' + username);
			callback({success: true, msg: userToken[0].token, allFiles: allFiles});
		} catch (error) {
			callback({success: false, msg: JSON.stringify(error)});
		}
	}

	async isValidToken(token, callback) {
		try {
			const [userToken] = await Database.promise().execute(
				'SELECT name, token FROM users WHERE token=? LIMIT 1',
				[token]
			);

			callback(userToken.length !== 0);
		} catch (error) {
			callback(false);
		}
	}
}

module.exports = new FileModel();
