type Sync = (scrollLeft: number, introShiftPx: number) => void;

const syncs = new Set<Sync>();

export function bindSectionShutter(sync: Sync) {
	syncs.add(sync);
	return () => {
		syncs.delete(sync);
	};
}

export function syncSectionShutters(scrollLeft: number, introShiftPx: number) {
	for (const sync of syncs) sync(scrollLeft, introShiftPx);
}
