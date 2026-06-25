const MONTH_ABBREV: Record<string, string> = {
	January: 'Jan',
	February: 'Feb',
	March: 'Mar',
	April: 'Apr',
	May: 'May',
	June: 'Jun',
	July: 'Jul',
	August: 'Aug',
	September: 'Sep',
	October: 'Oct',
	November: 'Nov',
	December: 'Dec'
};

export function abbreviateMonths(input: string) {
	return input.replace(
		/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/g,
		(m) => MONTH_ABBREV[m] ?? m
	);
}
