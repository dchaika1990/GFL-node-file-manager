document.addEventListener('DOMContentLoaded', () => {
	const username = window.location.pathname;
	const table = document.querySelector('.table')
	let tableBody = document.querySelector('.table tbody');
	let memoryWrap = document.querySelector('.space');
	let infoUl = document.querySelector('.information-content ul');
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

	const renderTableBody = (userFiles, dir = false, up = false) => {
		tableBody.innerHTML = '';
		let listRender = makeRender('.tableBody');
		let template = userFiles.map((data) => listRender(data))
		if (up) {
			stateInner.slice(0, -1)
		}
		if (dir) {
			let templateDirUp = `
				<tr data-up>
					<td colspan="4">...</td>
				</tr>
			`;
			template = [templateDirUp, ...template]
		}
		tableBody.innerHTML = (template.join(''))
	}

	const renderInfo = (options) => {
		let templateRender = makeRender('.infoTemplate')
		let template = options.map((data) => templateRender(data))
		infoUl.innerHTML = template.join('')
	}

	const getRequest = async (url) => {
		let res = await fetch(url)
		if (!res.ok) throw new Error('Error - ' + res.status);
		const response = await res.json()
		return await response;
	}

	const renderDirItems = (idDir) => {
		let dirItems = stateInner[stateInner.length - 1].filter(obj =>{
			return  obj.id === +idDir
		})
		stateInner.push(dirItems[0].items)
		renderTableBody(dirItems[0].items, true)
	}

	getRequest(`http://localhost:3010${username}-file/`).then(({userFiles, memory}) => {
		renderTableBody(userFiles);
		state = userFiles;
		stateInner.push(state);
		renderFileSystemMemory(memory);
	})

	table.addEventListener('dblclick',e => {
		e.stopPropagation()
		let elem;
		if (e.target.closest('[data-type="dir"]')) {
			elem = e.target.closest('[data-type="dir"]');
			idDir = elem.getAttribute('data-id');
			renderDirItems(idDir)
		}
		if (e.target.closest('[data-up]')) {
			stateInner = stateInner.slice(0, -1)
			let dir = true;
			if (stateInner.length === 1) {
				dir = false
			}
			renderTableBody(stateInner[stateInner.length - 1], dir, true)
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
			// if (elem.hasAttribute('data-src')) {
			// 	options.push({
			// 		name: 'src',
			// 		value: elem.getAttribute('data-src')
			// 	})
			// }
			renderInfo(options)
		}
	})
})