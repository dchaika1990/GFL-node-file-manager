document.addEventListener('DOMContentLoaded', () => {
	'use strict'

	const table = document.querySelector('.table')
	const username = getCookie('username');
	const memoryWrap = document.querySelector('.space');
	const formUpload = document.getElementById('upload-form')
	const addFolder = document.getElementById('add-folder')
	const searchInput = document.querySelector('.search')
	const messageWrap = document.querySelector('.message-alert');
	let separator = navigator.appVersion.indexOf("Win") !== -1 ? '\\' : '/';
	let dirUrl = `uploads${separator}${username}`;
	let dirName = '';

	function getCookie(name) {
		let matches = document.cookie.match(new RegExp(
			"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
		))
		return matches ? decodeURIComponent(matches[1]) : undefined
	}

	const fileManager = {
		getRequest: async (url) => {
			let res = await fetch(url)
			if (!res.ok) throw new Error('Error - ' + res.status);
			return await res.json();
		},
		postRequest: async (url, key, data) => {
			const formData = new FormData()
			formData.append(key, data)
			return await fetch(url, {
				method: 'POST',
				body: formData
			});
		},
		displayRows: (input, rows) => {
			let searchValue = input.value.toLowerCase().trimLeft();
			rows.forEach(row => {
				[...row.querySelectorAll('[data-name]')]
					.some(value => value.textContent.toLowerCase().trimLeft().indexOf(searchValue) > -1)
					? row.style.display = 'table-row'
					: row.style.display = 'none'
			})
		},
		showSearch: (searchInput) => {
			let rows = document.querySelectorAll('tbody tr');
			if (searchInput) {
				if (searchInput.value.toLowerCase().length > 0) fileManager.displayRows(searchInput, rows);
				searchInput.addEventListener('keyup', () => {
					fileManager.displayRows(searchInput, rows)
				})
			}
		},
		makeRender: (selector) => {
			let template = document.querySelector(selector).innerHTML;
			return new Function('data', 'return `' + template + '`');
		},
		renderFileSystemMemory: (memoryWrap, memory) => {
			memoryWrap.innerHTML = '';
			let listRender = fileManager.makeRender('.freeSpaceTemplate');
			memoryWrap.innerHTML = listRender(memory);
		},
		messageAlert: (wrap, message) => {
			wrap.textContent = message;
			wrap.classList.add('show');
			setTimeout(()=> {
				wrap.classList.remove('show');
			}, 3500)
		},
		renderTableBody: (userFiles, dir = '', up = false) => {
			const tableBody = table.querySelector('tbody');
			tableBody.innerHTML = '';
			let listRender = fileManager.makeRender('.tableBody');
			let template = userFiles.map((data) => listRender(data))
			console.log(dir)
			if (dir.length
				&& dir !== `uploads${separator}${username}`
			) {
				let templateDirUp = `
				<tr data-up data-dir="${dir}">
					<td colspan="4">...</td>
				</tr>
			`;
				template = [templateDirUp, ...template]
			}
			tableBody.innerHTML = (template.join(''))
			fileManager.showSearch(searchInput);
		},
		renderInfo: (options, imgSrc = '', isImg = false) => {
			const infoUl = document.querySelector('.information-content ul');
			const infoImg = document.querySelector('.information-media img');
			const infoDownload = document.querySelector('.information-download');
			let templateRender = fileManager.makeRender('.infoTemplate')
			let template = options.map((data) => templateRender(data))
			infoImg.innerHTML = '';
			infoDownload.innerHTML = '';
			infoImg.src = imgSrc
			if ('true' === isImg) {
				let downloadLink = document.createElement('a');
				downloadLink.href = imgSrc
				downloadLink.download = options[0].value
				downloadLink.classList.add('btn', 'btn-info')
				downloadLink.textContent = 'Download'
				infoDownload.append(downloadLink)
			}
			infoUl.innerHTML = template.join('')
		}
	}

	if (table) {
		table.addEventListener('dblclick', e => {
			e.stopPropagation()
			let elem;
			if (e.target.closest('[data-type="dir"]')) {
				elem = e.target.closest('[data-type="dir"]');
				dirName = elem.querySelector('[data-name]').textContent;
				dirUrl = elem.getAttribute('data-dir') + separator + elem.querySelector('[data-name]').textContent
				fileManager.getRequest(`http://localhost:3010/${username}-files/?folderUrl=${dirUrl}`)
					.then(({userFiles, memory, parentDir, message}) => {
						fileManager.renderTableBody(userFiles, parentDir);
						fileManager.renderFileSystemMemory(memoryWrap, memory);
						fileManager.messageAlert(messageWrap, message)
					})
			}
			if (e.target.closest('[data-up]')) {
				elem = e.target.closest('[data-up]');
				let parentUrl = elem.getAttribute('data-dir');
				dirUrl = parentUrl.slice(0, dirUrl.lastIndexOf(separator))
				fileManager.getRequest(`http://localhost:3010/${username}-files/?folderUrl=${dirUrl}`)
					.then(({userFiles, memory, parentDir}) => {
						fileManager.renderTableBody(userFiles, parentDir);
						fileManager.renderFileSystemMemory(memoryWrap, memory);
						fileManager.messageAlert(messageWrap, 'Return back')
					})
			}
		})

		table.addEventListener('click', e => {
			e.stopPropagation();
			let elem;
			if (e.target.closest('[data-type]')) {
				elem = e.target.closest('[data-type]');
				let options = [
					{name: 'Name', value: elem.querySelector('[data-name]').textContent},
					{name: 'Size', value: elem.querySelector('[data-size]').textContent},
					{name: 'Created', value: elem.querySelector('[data-created]').textContent},
				]
				if (elem.hasAttribute('data-items-length')) {
					options.push({
						name: 'Files count',
						value: elem.getAttribute('data-items-length')
					})
				}
				let path;
				let isImg;
				if (elem.getAttribute('data-type') === 'dir') {
					path = '/img/folder.svg'
				}
				if (elem.getAttribute('data-type') === 'file') {
					path = '/img/html.svg'
					isImg = 'true'
				}
				if (elem.getAttribute('data-is-img') === 'true') {
					path = elem.getAttribute('data-src');
					isImg = 'true';
				}
				fileManager.renderInfo(options, path, isImg)
			}
		})
	}

	if (addFolder) {
		addFolder.addEventListener('submit', (e) => {
			e.preventDefault();
			let input = addFolder.querySelector('input')
			let nameDir = input.value;
			if (nameDir.trim().length) {
				fileManager.postRequest(`http://localhost:3010/${username}-files/?folderUrl=${dirUrl}`, 'nameDir', nameDir)
					.then( data => data.json())
					.then( ({userFiles, memory, parentDir, message}) => {
							input.value = ''
							fileManager.renderTableBody(userFiles, parentDir);
							fileManager.renderFileSystemMemory(memoryWrap, memory);
							fileManager.messageAlert(messageWrap, message)
					})
					.catch(error => {
						fileManager.messageAlert(messageWrap, error)
					})
			}
		})
	}

	if (formUpload) {
		formUpload.addEventListener('submit', (e) => {
			e.preventDefault();
			let input = formUpload.querySelector('[type="file"]')
			let file = input.files[0]
			if (file) {
				fileManager.postRequest(`http://localhost:3010/${username}-files/?folderUrl=${dirUrl}`, 'myFile', file)
					.then(response => response.json())
					.then(({userFiles, memory, parentDir, message}) => {
						input.value = ''
						fileManager.renderTableBody(userFiles, parentDir);
						fileManager.renderFileSystemMemory(memoryWrap, memory);
						fileManager.messageAlert(messageWrap, message)
					})
					.catch(error => {
						fileManager.messageAlert(messageWrap, error)
					})
			}
		})
	}

	fileManager.showSearch(searchInput);
})
