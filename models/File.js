const fs = require("fs");
const path = require("path");
const os = require('os')

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
	__formatSizeUnits(bytes){
		if      (bytes >= 1073741824) { bytes = (bytes / 1073741824).toFixed(2) + " GB"; }
		else if (bytes >= 1048576)    { bytes = (bytes / 1048576).toFixed(2) + " MB"; }
		else if (bytes >= 1024)       { bytes = (bytes / 1024).toFixed(2) + " KB"; }
		else if (bytes > 1)           { bytes = bytes + " bytes"; }
		else if (bytes == 1)          { bytes = bytes + " byte"; }
		else                          { bytes = "0 bytes"; }
		return bytes;
	}
	getFolderItems(pathName) {
		const res = [];
		try {
			const dirItems = fs.readdirSync(pathName);
			dirItems.forEach(item => {
				try {
					const { basename: base, dir } = path.parse(path.join(pathName, item));
					const stats = fs.statSync(path.join(pathName, item));

					if (stats.isFile()) {
						// console.log(item, stats.size)
						res.push({
							name: item,
							basename: base,
							dir,
							size: this.__formatSizeUnits(stats.size),
							birthtime: new Date(stats.ctime).toLocaleDateString(),
							isFile: stats.isFile(),
							isDir: stats.isDirectory(),
						});
						// console.log('----------------------')
					} else {
						res.push({
							name: item,
							basename: base,
							dir,
							size: this.__formatSizeUnits(stats.size),
							birthtime: new Date(stats.ctime).toLocaleDateString(),
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

	addFiles(filesList, username){
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
	getMemory(){
		const allMemory = os.totalmem();
		const freeMemory = os.freemem();
		return {
			allMemory: this.__formatSizeUnits(allMemory),
			freeMemory: this.__formatSizeUnits(freeMemory),
		};
	}
}

module.exports = new FileApp();