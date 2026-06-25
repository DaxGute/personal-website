export type ProjectLink = { label: string; href: string };

export type Project = {
	id: string;
	name: string;
	blurb: string;
	description: string;
	highlights?: string[];
	tech?: string[];
	links?: ProjectLink[];
};

export const projects: Project[] = [
	{
		id: 'project-1',
		name: 'Kid By Kid',
		blurb: 'Paired Hundreds of Tutors and Learners through 13,000+ Hours of 1-on-1 Tutoring',
		description:
			'Through free online one-on-one tutoring, Kid By Kid Middle and High School student Mentors work with under-served Elementary and Middle School-aged immigrant, refugee, and ESL Learners to provide life-changing academic opportunity, and support.',
		highlights: [
		],
		tech: ['Nonprofit Leadership', 'Program Design'],
		links: [{ label: 'Website', href: 'https://kidbykid.org' }]
	},

	{
		id: 'project-2',
		name: 'RiseAQI',
		blurb: 'Built a Real-Time Community Air Quality Platform Serving South San Francisco Residents',
		description:
			'Designed and developed a bilingual web and mobile platform that integrates PurpleAir and Clarity sensor networks with spatial interpolation, wind forecasting, historical trends, and personalized alerts to deliver hyperlocal air quality information for South San Francisco in partnership with Rise South City.',
		highlights: [
		],
		tech: [
			'Full-Stack Development',
			'Data Visualization',
		],
		links: [
			{ label: 'App Store', href: 'https://apps.apple.com/us/app/rise-aqi/id6776097049' }
		]
	},
	{
		id: 'project-3',
		name: 'ConfCap',
		blurb: 'Designed and Built a Conference Bounty App from Ground Up',
		description:
			'ConfCap is a media capturing software that distributes real bounties to conference attendees who submit papers and presentations. ⚠️ WIP ⚠️'
	},
];
