import chessPhoto from '$lib/assets/chess.jpg';
import billiardsPhoto from '$lib/assets/billiards.png';
import billiardsBack1 from '$lib/assets/billiards/home.jpeg';
import billiardsBack2 from '$lib/assets/billiards/pub.png';
import billiardsBack3 from '$lib/assets/billiards/blue_table.png';
import billiardsBack4 from '$lib/assets/billiards/game-room.jpeg';
import skiingPhoto from '$lib/assets/skiing.jpg';
import skiingBack1 from '$lib/assets/skiing/treewell.png';
import skiingBack2 from '$lib/assets/skiing/jump.png';
import skiingBack3 from '$lib/assets/skiing/goggles.png';
import skiingBack4 from '$lib/assets/skiing/cloud_nine.png';
import scubaPhoto from '$lib/assets/scuba.jpg';
import tableTennisPhoto from '$lib/assets/table_tennis.jpg';

export type Interest = {
	caption: string;
	subtitle?: string;
	src?: string | null;
	alt?: string;
	backImages?: string[];
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
		backImages: [skiingBack1, skiingBack2, skiingBack3, skiingBack4],
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
		backImages: [billiardsBack1, billiardsBack2, billiardsBack3, billiardsBack4],
		layout: 'billiards'
	}
];
