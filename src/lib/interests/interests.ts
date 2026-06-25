import chessPhoto from '$lib/assets/chess.jpg';
import billiardsPhoto from '$lib/assets/billiards.png';
import skiingPhoto from '$lib/assets/skiing.jpg';
import scubaPhoto from '$lib/assets/scuba.jpg';
import tableTennisPhoto from '$lib/assets/table_tennis.jpg';

export type Interest = {
	caption: string;
	subtitle?: string;
	src?: string | null;
	alt?: string;
	revealRootMargin?: string;
	revealThreshold?: number;
	layout?: 'ski' | 'chess' | 'padi' | 'tt' | 'billiards';
};

export const interests: Interest[] = [
	{
		caption: 'PADI Certified Diver',
		src: scubaPhoto,
		alt: 'PADI Certified Diver',
		revealRootMargin: '0px -15% 0px -15%',
		revealThreshold: 0,
		layout: 'padi'
	},
	{
		caption: 'Skiing',
		src: skiingPhoto,
		alt: 'Skiing',
		layout: 'ski'
	},
	{ caption: 'Chess', src: chessPhoto, alt: 'Chess', layout: 'chess' },
	{
		caption: 'Table Tennis',
		src: tableTennisPhoto,
		alt: 'Table Tennis',
		layout: 'tt'
	},
	{
		caption: 'Billiards',
		src: billiardsPhoto,
		alt: 'Billiards',
		layout: 'billiards'
	}
];
