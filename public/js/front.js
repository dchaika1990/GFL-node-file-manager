const getRequest = async (url) => {
	let res = await fetch(url)
	if (!res.ok) throw new Error('Error - ' + res.status);
	return await res.json();
}

const postRequest = async (url, key, data) => {
	const formData = new FormData()
	formData.append(key, data)
	return await fetch(url, {
		method: 'POST',
		body: formData
	});
}

const getCookie = (name) => {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	))
	return matches ? decodeURIComponent(matches[1]) : undefined
}

const displayRows = (input, rows) => {
	let searchValue = input.value.toLowerCase().trimLeft();
	rows.forEach(row => {
		[...row.querySelectorAll('[data-name]')]
			.some(value => value.textContent.toLowerCase().trimLeft().indexOf(searchValue) > -1)
			? row.style.display = 'table-row'
			: row.style.display = 'none'
	})
}

const showSearch = (searchInput) => {
	let rows = document.querySelectorAll('tbody tr');
	if (searchInput) {
		if (searchInput.value.toLowerCase().length > 0) displayRows(searchInput, rows);
		searchInput.addEventListener('keyup', () => {
			displayRows(searchInput, rows)
		})
	}
}

const makeRender = (selector) => {
	let template = document.querySelector(selector).innerHTML;
	return new Function('data', 'return `' + template + '`');
}

const renderFileSystemMemory = (memoryWrap, memory) => {
	memoryWrap.innerHTML = '';
	let listRender = makeRender('.freeSpaceTemplate');
	memoryWrap.innerHTML = listRender(memory);
}

const messageAlert = (wrap, message) => {
	wrap.textContent = message;
	wrap.classList.add('show');
	setTimeout(()=> {
		wrap.classList.remove('show');
	}, 3000)
}

document.addEventListener('DOMContentLoaded', () => {
	'use strict'

	const table = document.querySelector('.table')
	const username = getCookie('username');
	const memoryWrap = document.querySelector('.space');
	const formUpload = document.getElementById('upload-form')
	const addFolder = document.getElementById('add-folder')
	const searchInput = document.querySelector('.search')
	const messageWrap = document.querySelector('.message-alert');
	let dirUrl = `uploads/${username}`;
	let dirName = '';
	let separator = navigator.appVersion.indexOf("Win") !== -1 ? '\\' : '/';

	const renderTableBody = (userFiles, dir = '', up = false) => {
		const tableBody = table.querySelector('tbody');
		tableBody.innerHTML = '';
		let listRender = makeRender('.tableBody');
		let template = userFiles.map((data) => listRender(data))
		console.log(dir)
		if (dir.length
			&& dir !== `uploads${separator}${username}`
			// && dir !== `uploads${separator}${username}/`
			// && dir !== `uploads/${username}`
		) {
			let templateDirUp = `
				<tr data-up data-dir="${dir}">
					<td colspan="4">...</td>
				</tr>
			`;
			template = [templateDirUp, ...template]
		}
		tableBody.innerHTML = (template.join(''))
		showSearch(searchInput);
	}

	const renderInfo = (options, imgSrc = '', isImg = false) => {
		const infoUl = document.querySelector('.information-content ul');
		const infoImg = document.querySelector('.information-media img');
		const infoDownload = document.querySelector('.information-download');
		let templateRender = makeRender('.infoTemplate')
		let template = options.map((data) => templateRender(data))
		infoImg.innerHTML = '';
		infoDownload.innerHTML = '';
		if ('true' === isImg) {
			infoImg.src = imgSrc
		}
		if (imgSrc) {
			let downloadLink = document.createElement('a');
			downloadLink.href = imgSrc
			downloadLink.download = options[0].value
			downloadLink.classList.add('btn', 'btn-info')
			downloadLink.textContent = 'Download'
			infoDownload.append(downloadLink)
		}
		infoUl.innerHTML = template.join('')
	}

	if (table) {
		table.addEventListener('dblclick', e => {
			e.stopPropagation()
			let elem;
			if (e.target.closest('[data-type="dir"]')) {
				elem = e.target.closest('[data-type="dir"]');
				dirName = elem.querySelector('[data-name]').textContent;
				dirUrl = elem.getAttribute('data-dir') + separator + elem.querySelector('[data-name]').textContent
				getRequest(`http://localhost:3010/${username}-file/?idDir=${dirUrl}`)
					.then(({userFiles, memory, parentDir, message}) => {
					renderTableBody(userFiles, parentDir);
					renderFileSystemMemory(memoryWrap, memory);
					messageAlert(messageWrap, message)
				})
			}
			if (e.target.closest('[data-up]')) {
				elem = e.target.closest('[data-up]');
				let parentUrl = elem.getAttribute('data-dir');
				dirUrl = parentUrl.slice(0, dirUrl.lastIndexOf(separator))
				getRequest(`http://localhost:3010/${username}-file/?idDir=${dirUrl}`)
					.then(({userFiles, memory, parentDir}) => {
						renderTableBody(userFiles, parentDir);
						renderFileSystemMemory(memoryWrap, memory);
						messageAlert(messageWrap, 'Return back')
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
					isImg = 'true'
				}
				if (elem.getAttribute('data-type') === 'file') {
					path = '/img/html.svg'
					isImg = 'true'
				}
				if (elem.getAttribute('data-is-img') === 'true') {
					isImg = elem.getAttribute('data-is-img');
					path = elem.getAttribute('data-src');
				}
				renderInfo(options, path, isImg)
			}
		})
	}

	if (addFolder) {
		addFolder.addEventListener('submit', (e) => {
			e.preventDefault();
			let input = addFolder.querySelector('input')
			let nameDir = input.value;
			if (nameDir.trim().length) {
				postRequest(`http://localhost:3010/${username}-file/?idDir=${dirUrl}`, 'nameDir', nameDir)
					.then( data => data.json())
					.then( ({userFiles, memory, parentDir, message}) => {
							input.value = ''
							renderTableBody(userFiles, parentDir);
							renderFileSystemMemory(memoryWrap, memory);
							messageAlert(messageWrap, message)
					})
					.catch(error => {
						messageAlert(messageWrap, error)
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
				postRequest(`http://localhost:3010/${username}-file/?idDir=${dirUrl}`, 'myFile', file)
					.then(response => response.json())
					.then(({userFiles, memory, parentDir, message}) => {
						input.value = ''
						renderTableBody(userFiles, parentDir);
						renderFileSystemMemory(memoryWrap, memory);
						messageAlert(messageWrap, message)
					})
					.catch(error => {
						messageAlert(messageWrap, error)
					})
			}
		})
	}

	showSearch(searchInput);
})