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
			'13,000+ hours of 1-on-1 tutoring',
			'Hundreds of tutor/learner matches',
			'Free online tutoring for underserved students'
		],
		tech: ['Nonprofit leadership', 'Program design', 'Volunteer operations'],
		links: [{ label: 'Website', href: 'https://kidbykid.org' }]
	},
	{
		id: 'project-2',
		name: 'ConfCap',
		blurb: 'Designed and Built a Conference Bounty App from Ground Up',
		description:
			'ConfCap is a media capturing software that distributes real bounties to conference attendees who submit papers and presentations. ⚠️ WIP ⚠️'
	},
	{
		id: 'project-3',
		name: 'Rise South City',
		blurb: 'Redesigning the AQI Data Pipeline for SSF',
		description:
			'As part of an ongoing partnership with Rise South City, I have recently built a ground-up pipeline of gathering air quality information from the San Francisco PurpleAir sensors. ⚠️ WIP ⚠️'
	}
];
