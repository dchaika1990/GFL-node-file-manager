document.addEventListener('DOMContentLoaded', () => {
	const username = window.location.pathname;
	const table = document.querySelector('.table')
	let tableBody = document.querySelector('.table tbody');
	let memoryWrap = document.querySelector('.space');
	let infoUl = document.querySelector('.information-content ul');
	let infoImg = document.querySelector('.information-media');
	let infoDownload = document.querySelector('.information-download');
	let state = [];
	let stateInner = [];
	let idDir;

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
		if (dir.length) {
			console.log(111)
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
		if (imgSrc){
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

	const renderDirItems = (idDir) => {
		let dirItems = stateInner[stateInner.length - 1].filter(obj =>{
			return  obj.id === +idDir
		})
		stateInner.push(dirItems[0].items)
		// renderTableBody(dirItems[0].items, true)
	}

	getRequest(`http://localhost:3010${username}-file/`).then(({userFiles, memory}) => {
		// renderTableBody(userFiles);
		state = userFiles;
		stateInner.push(state);
		// renderFileSystemMemory(memory);
	})

	table.addEventListener('dblclick',e => {
		e.stopPropagation()
		let elem;
		if (e.target.closest('[data-type="dir"]')) {
			elem = e.target.closest('[data-type="dir"]');
			let dirUrl = elem.getAttribute('data-dir');
			let dirName = elem.querySelector('[data-name]').textContent;
			getRequest(`http://localhost:3010/user/dchaika-file/?idDir=${dirUrl}/${dirName}`).then(({userFiles, memory, parentDir})=>{
				renderTableBody(userFiles, parentDir);
				renderFileSystemMemory(memory);
			})
		}
		if (e.target.closest('[data-up]')) {
			elem = e.target.closest('[data-up]');
			let dirUrl = elem.getAttribute('data-dir');
			let parentUrl = dirUrl.slice(0, dirUrl.lastIndexOf('/'))
			getRequest(`http://localhost:3010/user/dchaika-file/?idDir=${parentUrl}`).then(({userFiles, memory, parentDir})=>{
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
})