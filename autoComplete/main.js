const { fromEvent } = rxjs;
const { map, mergeMap, debounceTime, filter, distinctUntilChanged } = rxjs.operators;
const { ajax } = rxjs.ajax;

const users$ = fromEvent(document.getElementById('search'), 'keyup').pipe(
	debounceTime(300),
	map(e => e.target.value),
	distinctUntilChanged(),
	filter(query => query.trim().length > 0),
	mergeMap(query => ajax.getJSON(`https://api.github.com/search/users?q=${query}`)),
);

const $layer = document.getElementById('suggestLayer');

const drawLayer = items => {
	$layer.innerHTML = items.map(user => `
		<li class="user">
			<img src="${user.avatar_url}"/>
			<p>
				<a href="${user.html_url}" target="_blank">${user.login}</a>
			</p>
		</li>
	`).join('');
};

users$.subscribe(user => drawLayer(user.items));