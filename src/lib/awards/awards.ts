export type AwardItem = {
	heading: string;
	subheading: string;
	items: string[];
};

export const awards: AwardItem[] = [
	{
		heading: 'Oracle Java 8 SE Programmer',
		subheading: 'Certification',
		items: ['Certified Professional for Proficiency in Java']
	},
	{
		heading: 'International Youth Leader of the Year',
		subheading: 'Recognition',
		items: ['Honored by the IRC for founding Kid By Kid']
	},
	{
		heading: 'Daily Point of Light Honoree',
		subheading: 'National recognition',
		items: ['National recognition for volunteer leadership']
	},
	{
		heading: 'National Merit Scholarship Finalist',
		subheading: 'Academic honor',
		items: ['Top 1% of 1.5M PSAT/NMSQT takers globally']
	}
];
