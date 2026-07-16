import nationalMeritLogo from '$lib/assets/awards/national_merit_logo.png';
import oracleJavaBadge from '$lib/assets/awards/oracle_java_badge.png';
import pointOfLightLogo from '$lib/assets/awards/point_of_light_logo.png';
import youthLeaderLogo from '$lib/assets/awards/youth_leader_logo.png';

export type AwardItem = {
	heading: string;
	dates: string;
	items: string[];
	logoSrc?: string;
	logoAlt?: string;
	logoHref?: string;
	logoLinkLabel?: string;
	/** Multiplier for award back typography (default 1). */
	backTextScale?: number;
};

export const awards: AwardItem[] = [
	{
		heading: 'Oracle Java 8 SE Programmer',
		dates: 'May 2023',
		items: [
			'Issued by Oracle',
			'An Oracle Certified Associate, Java SE 8 Programmer has demonstrated knowledge of object-oriented concepts, the Java programming language and general knowledge of Java platforms and technologies.'
		],
		logoSrc: oracleJavaBadge,
		logoAlt: 'Oracle Certified Associate Java SE 8 Programmer badge',
		logoHref: 'https://www.credly.com/badges/55584dd6-9e91-449f-b0a8-b50007181c8c',
		logoLinkLabel: 'Credly Badge'
	},
	{
		heading: 'International Youth Leader of the Year',
		dates: 'March 2022',
		items: [
			'Issued by The International Rescue Committee (IRC - San Diego)',
			"IRC's Youth Leader of the Year was presented to Daxton Gutekunst for his work in founding and operating his non-profit, Kid By Kid, and for his civic engagement championing support for Refugee Youth, as a City of San Diego Youth Commissioner (2021-2023). The award honors the incredible impact of a past volunteer with IRC Youth Programs, Richard L'Heureux."
		],
		logoSrc: youthLeaderLogo,
		logoAlt: 'International Youth Leader of the Year logo'
	},
	{
		heading: 'Daily Point of Light Honoree',
		dates: 'September 2022',
		items: [
			'Issued by Points Of Light',
			'The Daily Point of Light Award is presented by @PointsofLight, celebrating the power of individuals to spark change and improve the world. Daily Point of Light award was presented during #GlobalVolunteerMonth; honoring individuals across the nation who collectively create change.'
		],
		logoSrc: pointOfLightLogo,
		logoAlt: 'Daily Point of Light Award logo'
	},
	{
		heading: 'National Merit Scholarship Finalist',
		dates: 'February 2023',
		items: [
			'Issued by The National Merit® Scholarship Program',
			"The National Merit® Scholarship Program is an academic competition for recognition and scholarships that began in 1955. Approximately 1.5 million high school students enter the program each year. The strongest semifinalist applicants, approximately 15,000 students from across the nation, are named National Merit Scholarship Finalists and are notified during the second semester of their senior year. Advancing to Finalist standing, a Finalist represents the top 1% of their respective states' test-takers."
		],
		logoSrc: nationalMeritLogo,
		logoAlt: 'National Merit Scholarship Corporation logo',
		backTextScale: 0.8
	}
];
