const fs = require("fs");
const path = require("path");

class FileApp{
	createUserDir(username) {
		if (!fs.existsSync(upload_dir + '/' + username)){
			fs.mkdirSync(upload_dir + '/' + username);
		}
	}
	static getFolderSize(dirTree) {
		const dirItems = Object.keys(dirTree);
		let size = 0;

		dirItems.forEach(item => {
			const itemObj = dirTree[item];

			size += itemObj.isFile ? itemObj.size : getFolderSize(itemObj.items);
			itemObj.isDir && (itemObj.size = size);
		});

		return size;
	};
	getFolderItems(pathName) {
		const res = [];
		try {
			const dirItems = fs.readdirSync(pathName);
			dirItems.forEach(item => {
				try {
					const { basename: base, dir } = path.parse(path.join(pathName, item));
					const stats = fs.statSync(path.join(pathName, item));
					if (stats.isFile()) {
						res.push({
							name: item,
							basename: base,
							dir,
							size: stats.size,
							birthtime: stats.birthtime,
							isFile: stats.isFile(),
							isDir: stats.isDirectory(),
						});
					} else {
						res.push({
							name: item,
							basename: base,
							dir,
							size: stats.size,
							birthtime: stats.birthtime,
							isFile: stats.isFile(),
							isDir: stats.isDirectory(),
							items: this.getFolderItems(path.join(pathName, item)),
						});
					}
				} catch (err) {
					console.log(err);
				}
			});
			return res;
		} catch (err) {
			console.log('ERROR', err);
			return res;
		}
	};

	addFiles(req, username){
		console.log(req.files.file)
		const file = req.files.file
		console.log(__dirname + `/uploads/${username}/` + file.name)
		file.mv(
			__dirname + `/uploads/${username}/` + file.name,
			err => {
				const result = {
					name: file.name,
					mimetype: file.mimetype,
					size: file.size,
					status: true,
				};

				if (err) {
					console.log('error')
				}
			}
		);
	}
}

module.exports = new FileApp();