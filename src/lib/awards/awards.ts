import nationalMeritLogo from '$lib/assets/awards/national_merit_logo.png';
import oracleJavaBadge from '$lib/assets/awards/oracle_java_badge.png';
import pointOfLightLogo from '$lib/assets/awards/point_of_light_logo.png';

export type AwardItem = {
	heading: string;
	dates: string;
	items: string[];
	logoSrc?: string;
	logoAlt?: string;
};

export const awards: AwardItem[] = [
	{
		heading: 'Oracle Java 8 SE Programmer',
		dates: 'May 2023',
		items: ['Certified Professional for Proficiency in Java'],
		logoSrc: oracleJavaBadge,
		logoAlt: 'Oracle Certified Associate Java SE 8 Programmer badge'
	},
	{
		heading: 'International Youth Leader of the Year',
		dates: 'March 2022',
		items: ['Honored by the IRC for founding Kid By Kid']
	},
	{
		heading: 'Daily Point of Light Honoree',
		dates: 'September 2022',
		items: ['National recognition for volunteer leadership'],
		logoSrc: pointOfLightLogo,
		logoAlt: 'Daily Point of Light Award logo'
	},
	{
		heading: 'National Merit Scholarship Finalist',
		dates: 'February 2023',
		items: ['Top 1% of 1.5M PSAT/NMSQT takers globally'],
		logoSrc: nationalMeritLogo,
		logoAlt: 'National Merit Scholarship Corporation logo'
	}
];
