document.addEventListener('DOMContentLoaded', () => {
	const table = document.querySelector('.table')
	const username = getCookie('username');
	let tableBody = table.querySelector('tbody');
	let memoryWrap = document.querySelector('.space');
	let infoUl = document.querySelector('.information-content ul');
	let infoImg = document.querySelector('.information-media');
	let infoDownload = document.querySelector('.information-download');
	let formUpload = document.getElementById('upload-form')
	let addFolder = document.getElementById('add-folder')
	let dirUrl = `uploads/${username}`;
	let dirName = '';
	let searchInput =  document.querySelector('.search')
	let separator = navigator.appVersion.indexOf("Win")!==-1 ? '\\' : '/';

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
		if (dir.length
			&& dir !== `uploads${separator}${username}`
			&& dir !== `uploads${separator}${username}/`
			&& dir !== `uploads/${username}`
		) {
			let templateDirUp = `
				<tr data-up data-dir="${dir}">
					<td colspan="4">...</td>
				</tr>
			`;
			template = [templateDirUp, ...template]
		}
		tableBody.innerHTML = (template.join(''))
		showSearch();
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

	if (table) {
		table.addEventListener('dblclick', e => {
			e.stopPropagation()
			let elem;
			if (e.target.closest('[data-type="dir"]')) {
				elem = e.target.closest('[data-type="dir"]');
				dirName = elem.querySelector('[data-name]').textContent;
				dirUrl = elem.getAttribute('data-dir') + separator + elem.querySelector('[data-name]').textContent
				getRequest(`http://localhost:3010/${username}-file/?idDir=${dirUrl}`).
				then(({userFiles, memory, parentDir
				}) => {
					renderTableBody(userFiles, parentDir);
					renderFileSystemMemory(memory);
				})
			}
			if (e.target.closest('[data-up]')) {
				elem = e.target.closest('[data-up]');
				let parentUrl = elem.getAttribute('data-dir');
				dirUrl = parentUrl.slice(0, dirUrl.lastIndexOf(separator))
				getRequest(`http://localhost:3010/${username}-file/?idDir=${dirUrl}`)
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

	if (addFolder) {
		addFolder.addEventListener('submit', (e) => {
			e.preventDefault();
			let input = addFolder.querySelector('input')
			let nameDir = input.value;
			postRequest(`http://localhost:3010/${username}-file/?idDir=${dirUrl}`, 'nameDir', nameDir).then(data => {
				input.value = ''
				getRequest(`http://localhost:3010/${username}-file/?idDir=${dirUrl}`).
				then(({userFiles, memory, parentDir}) => {
					renderTableBody(userFiles, parentDir);
					renderFileSystemMemory(memory);
				})
			})
		})
	}

	function displayRows (input, rows) {
		let searchValue = input.value.toLowerCase().trimLeft();
		console.log(searchValue)
		rows.forEach( row => {
			[...row.querySelectorAll('[data-name]')]
				.some( value => value.textContent.toLowerCase().trimLeft().indexOf(searchValue) > -1 )
				? row.style.display = 'table-row'
				: row.style.display = 'none'
		} )
	}

	const showSearch = () => {
		let rows = document.querySelectorAll('tbody tr');
		if (searchInput) {
			if (searchInput.value.toLowerCase().length > 0) displayRows(searchInput, rows);
			searchInput.addEventListener('keyup', () => {
				displayRows(searchInput, rows)
			})
		}
	}

	async function postRequest(url, key, data) {
		const formData = new FormData()
		formData.append(key, data)
		return await fetch(`http://localhost:3010/${username}-file/?idDir=${dirUrl}`, {
			method: 'POST',
			body: formData
		});
	}

	if (formUpload) {
		formUpload.addEventListener('submit', (e) => {
			e.preventDefault();
			let input = formUpload.querySelector('[type="file"]')
			let file = input.files[0]
			postRequest(`http://localhost:3010/${username}-file/?idDir=${dirUrl}`, 'myFile', file)
				.then(response => response.json())
				.then(data => {
					input.value = ''
					getRequest(`http://localhost:3010/${username}-file/?idDir=${dirUrl}`).
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

	showSearch();
})