const { fromEvent, merge, defer, animationFrameScheduler, interval, concat, of } = rxjs;
const { switchMap, takeUntil, map, filter, take, first, tap, share, takeWhile, startWith, withLatestFrom, scan } = rxjs.operators;

const THRESHOLD = 500;
const DEFAULT_DURATION = 300;
const $view = document.getElementById('carousel');
const $container = $view.querySelector('.container');
const PANEL_COUNT = $container.querySelectorAll('.panel').length;

const SUPPORT_TOUCH = 'ontouchstart' in window;
const EVENTS = {
	START: SUPPORT_TOUCH ? 'touchstart' : 'mousedown',
	MOVE: SUPPORT_TOUCH ? 'touchmove' : 'mousemove',
	END: SUPPORT_TOUCH ? 'touchend' : 'mouseup',
};

const animation = (from, to, duration) => defer(() => {
	const scheduler = animationFrameScheduler;
	const start = scheduler.now();
	const interval$ = interval(0, scheduler).pipe(
		map(() => (scheduler.now() - start) / duration),
		takeWhile(rate => rate < 1)
	);
	return concat(interval$, of(1)).pipe(map(rate => from + (to - from) * rate));
});

const toPos = e$ => e$.pipe(
	map(e => SUPPORT_TOUCH ? e.changedTouches[0].pageX : e.pageX)
);

const translateX = posX => {
	$container.style.transform = `translate3d(${posX}px, 0, 0)`;
};

const start$ = fromEvent($view, EVENTS.START).pipe(toPos);
const move$ = fromEvent($view, EVENTS.MOVE).pipe(toPos);
const end$ = fromEvent($view, EVENTS.END).pipe(toPos);

const size$ = fromEvent(window, 'resize').pipe(
	startWith(0),
	map(e => $view.clientWidth),
);

const drag$ = start$.pipe(
	switchMap(start => move$.pipe(
		map(move => move - start),
		takeUntil(end$),
	)),
	share(),
	map(distance => ({ distance })),
);

const drop$ = drag$.pipe(
	switchMap(drag => end$.pipe(
		map(e => drag),
		first(),
	)),
	withLatestFrom(size$, (drag, size) => ({
		...drag, size
	})),
);

const carousel$ = merge(drag$, drop$).pipe(
	scan((store, {distance, size}) => {
		const updateStore = {
			from: -(store.index * store.size) + distance,
		};

		if (size === undefined) {
			updateStore.to = updateStore.from;
		} else {
			let toBeIndex = store.index;
			if (Math.abs(distance) >= THRESHOLD) {
				toBeIndex = distance < 0 ?
					Math.min(toBeIndex + 1, PANEL_COUNT - 1) :
					Math.max(toBeIndex - 1, 0);
			}
			updateStore.index = toBeIndex;
			updateStore.to = -(toBeIndex * size);
			updateStore.size = size;
		}
		return {...store, ...updateStore};
	}, {
		from: 0,
		to: 0,
		index: 0,
		size: 0,
	}),
	switchMap(({from, to}) => from === to ? of(to) : animation(from, to, DEFAULT_DURATION)),
);

carousel$.subscribe(pos => {
	console.log('carousel data : ', pos);
	translateX(pos);
});
