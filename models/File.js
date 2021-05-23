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
						console.log(stats)
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
}

module.exports = new FileApp();