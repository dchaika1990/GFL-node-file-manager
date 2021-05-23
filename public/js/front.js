document.addEventListener('DOMContentLoaded', () => {
	const dirs = document.querySelectorAll('[data-type="dir"]')
	dirs.forEach(dir => {
		dir.addEventListener('click', (e)=> {
			console.log('dir')
		})
	})

	// fetch('http://localhost:3010/user/dchaika/userFiles')
	// 	.then(response => response.json())
	// 	.then(data => console.log(data));

	// fetch('http://localhost:3010/user/dchaika/')
	// 	.then(response => response.json())
	// 	.then(commits => alert(commits));


	const getGoods = async (url) => {
		let res = await fetch(url)
		if (!res.ok) throw new Error('Error - ' + res.status);
		const response = await res.json()
		return await response;
	}

	getGoods('http://localhost:3010/user/dchaika/files').then(data => console.log(data))
})