document.addEventListener('DOMContentLoaded', () => {
	const table = document.querySelector('.table')
	const username = getCookie('username');
	let tableBody = document.querySelector('.table tbody');
	let memoryWrap = document.querySelector('.space');
	let infoUl = document.querySelector('.information-content ul');
	let infoImg = document.querySelector('.information-media');
	let infoDownload = document.querySelector('.information-download');
	let state = [];
	let stateInner = [];
	let idDir;
	let formUpload = document.getElementById('upload-form')
	let dirUrl = `uploads/${username}`;
	let dirName = '';

	function getCookie(name) {
		let matches = document.cookie.match(new RegExp(
			"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
		))
		return matches ? decodeURIComponent(matches[1]) : undefined
	}

	const makeRender = (selector) => {
		let template = document.querySelector(selector).innerHTML;
		return new Function('data', 'return `' + template + '`');
	}

	const renderFileSystemMemory = (memory) => {
		memoryWrap.innerHTML = '';
		let listRender = makeRender('.freeSpaceTemplate');
		memoryWrap.innerHTML = listRender(memory);
	}

	const renderTableBody = (userFiles, dir = '', up = false) => {
		tableBody.innerHTML = '';
		let listRender = makeRender('.tableBody');
		let template = userFiles.map((data) => listRender(data))
		if (up) {
			stateInner.slice(0, -1)
		}
		if (dir.length && dir !== `uploads/${username}` && dir !== `uploads/${username}/`) {
			let templateDirUp = `
				<tr data-up data-dir="${dir}">
					<td colspan="4">...</td>
				</tr>
			`;
			template = [templateDirUp, ...template]
		}
		tableBody.innerHTML = (template.join(''))
	}

	const renderInfo = (options, imgSrc = '', isImg = false) => {
		let templateRender = makeRender('.infoTemplate')
		let template = options.map((data) => templateRender(data))
		infoImg.innerHTML = '';
		infoDownload.innerHTML = '';
		if ('true' === isImg) {
			let imgTag = document.createElement('img');
			imgTag.src = imgSrc
			imgTag.alt = 'image'
			infoImg.append(imgTag)
		}
		if (imgSrc) {
			let downloadLink = document.createElement('a');
			downloadLink.href = imgSrc
			downloadLink.download = options[0].value
			downloadLink.textContent = 'Download'
			infoDownload.append(downloadLink)
		}
		infoUl.innerHTML = template.join('')
	}

	const getRequest = async (url) => {
		let res = await fetch(url)
		if (!res.ok) throw new Error('Error - ' + res.status);
		return await res.json();
	}

	function postRequest(url, data) {
		// const res = await fetch(`${url}`, {
		// 	method: 'post',
		// 	headers: {
		// 	    'Content-type': 'application/json; charset=utf-8'
		// 	},
		// 	body: JSON.stringify(data)
		// 	// body: data
		// });
		// console.log(data)
		// if (!res.ok) {
		// 	throw new Error(`Could not fetch ${url}, status: ${res.status}`)
		// }
		// return await res.json();
		// return await res.text();


	}

	if (table) {
		table.addEventListener('dblclick', e => {
			e.stopPropagation()
			let elem;
			if (e.target.closest('[data-type="dir"]')) {
				elem = e.target.closest('[data-type="dir"]');
				dirUrl = elem.getAttribute('data-dir');
				dirName = elem.querySelector('[data-name]').textContent;
				dirUrl = elem.getAttribute('data-dir') + '/' + elem.querySelector('[data-name]').textContent
				getRequest(`http://localhost:3010/user/${username}-file/?idDir=${dirUrl}`).
				then(({userFiles, memory, parentDir
				}) => {
					renderTableBody(userFiles, parentDir);
					renderFileSystemMemory(memory);
				})
			}
			if (e.target.closest('[data-up]')) {
				elem = e.target.closest('[data-up]');
				let parentUrl = elem.getAttribute('data-dir');
				dirUrl = parentUrl.slice(0, dirUrl.lastIndexOf('/'))
				getRequest(`http://localhost:3010/user/${username}-file/?idDir=${dirUrl}`)
					.then(({userFiles, memory, parentDir
				}) => {
					renderTableBody(userFiles, parentDir);
					renderFileSystemMemory(memory);
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
				if (elem.hasAttribute('data-src')) {
					path = elem.getAttribute('data-src');
				}
				let isImg;
				if (elem.hasAttribute('data-is-img')) {
					isImg = elem.getAttribute('data-is-img');
				}
				renderInfo(options, path, isImg)
			}
		})
	}

	if (formUpload) {
		formUpload.addEventListener('submit', (e) => {
			e.preventDefault();
			let input = formUpload.querySelector('[type="file"]')
			let file = input.files[0]
			const formData = new FormData()
			formData.append('myFile', file)
			fetch(`http://localhost:3010/user/${username}-file/?idDir=${dirUrl}`, {
				method: 'POST',
				body: formData
			})
				.then(response => response.json())
				.then(data => {
					input.value = ''
					getRequest(`http://localhost:3010/user/${username}-file/?idDir=${dirUrl}`).
					then(({userFiles, memory, parentDir}) => {
						renderTableBody(userFiles, parentDir);
						renderFileSystemMemory(memory);
					})
				})
				.catch(error => {
					console.error(error)
				})
		})
	}
})