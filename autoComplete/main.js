const { fromEvent, Subject } = rxjs;
const { finalize, retry, partition, map, mergeMap, debounceTime, filter, distinctUntilChanged, tap, switchMap, catchError } = rxjs.operators;
const { ajax } = rxjs.ajax;

const subject = new Subject();

const $loading = document.getElementById('loading');

const showLoading = () => {
	$loading.style.display = 'block';
};

const hideLoading = () => {
	$loading.style.display = 'none';
};

const keyup$ = fromEvent(document.getElementById('search'), 'keyup').pipe(
	debounceTime(300),
	map(e => e.target.value),
	distinctUntilChanged(),
);

let [user$, reset$] = subject.pipe(
	partition(q => q.trim().length > 0),
);

keyup$.subscribe(subject);

users$ = user$.pipe(
	tap(showLoading),
	switchMap(q => ajax.getJSON(`https://api.github.com/search/users?q=${q}`)),
	tap(hideLoading),
	retry(2),
	finalize(hideLoading),
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

users$.subscribe({
	next: user => drawLayer(user.items),
	error: e => {
		console.log('Something went wrong : ', e),
		alert(e.message);
	}
});

reset$.pipe(
	tap(v => $layer.innerHTML = ''),
).subscribe();