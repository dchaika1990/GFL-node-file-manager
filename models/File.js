const fs = require("fs");

class FileApp{
	createUserDir(username) {
		if (!fs.existsSync(upload_dir + '/' + username)){
			fs.mkdirSync(upload_dir + '/' + username);
		}
	}
}

module.exports = new FileApp();