import baiLogo from '$lib/assets/experience/bai_logo.jpeg';
import baiPhoto from '$lib/assets/experience/bai_photo.png';
import cestaLogo from '$lib/assets/experience/CESTA_logo.jpg';
import ccLogo from '$lib/assets/experience/cc_logo.jpeg';
import sdLogo from '$lib/assets/experience/sd_logo.jpeg';
import youthCommissionPhoto from '$lib/assets/experience/youth_commission.png';

export type ExperienceBackParagraph = {
	heading: string;
	body: string;
};

export type Experience = {
	company: string;
	location: string;
	title: string;
	dates: string;
	highlights: string[];
	logoSrc: string;
	logoAlt: string;
	backImageSrc?: string;
	backImageAlt?: string;
	backImageHref?: string;
	backLinkLabel?: string;
	backParagraphs?: ExperienceBackParagraph[];
	skills?: string[];
};

export const experiences: Experience[] = [
	{
		company: 'CESTA',
		location: 'Stanford, CA',
		title: 'Undergraduate Researcher',
		dates: 'June 2026 - Aug 2026',
		highlights: [
			'Researching AI-human coauthorship through computational discourse analysis while developing policy frameworks for hybrid text.'
		],
		logoSrc: cestaLogo,
		logoAlt: 'CESTA logo'
	},
	{
		company: 'Benevolent AI',
		location: 'London, England',
		title: 'Research Intern',
		dates: 'June 2025 - Aug 2025',
		highlights: [
			'Working on AI and biotech research, analyzing product-fit within the evolving biotech landscape and potential areas for innovation.'
		],
		logoSrc: baiLogo,
		logoAlt: 'Benevolent AI logo',
		backImageSrc: baiPhoto,
		backImageAlt: 'At BenevolentAI reception in London',
		backParagraphs: [
			{
				heading: 'Technical Research & AI:',
				body: 'Over three summers, I rotated through machine learning, computational biology, NLP, software engineering, and data visualization teams, exploring protein binding pocket representations, analyzing datasets with Python and Pandas, and contributing to AI-driven drug discovery research.'
			},
			{
				heading: 'Business Strategy & Commercialization:',
				body: 'Worked alongside finance, legal/IP, and business strategy teams to research biotechnology companies, shareholder structures, competitive landscapes, and product positioning while gaining insight into the commercialization of AI-powered therapeutics.'
			}
		]
	},
	{
		company: 'Castle Creek Capital',
		location: 'San Diego, CA',
		title: 'Investment Analytics',
		dates: 'June 2024 - September 2024',
		highlights: [
			'Assisted with financial modeling and analysis in small community banks across the U.S. for eventual presentation to management.'
		],
		logoSrc: ccLogo,
		logoAlt: 'Castle Creek Capital logo',
		backImageHref: 'https://www.castlecreek.com/internship',
		backLinkLabel: 'Internship Page'
	},
	{
		company: 'City of San Diego',
		location: 'San Diego, CA',
		title: 'Youth Commissioner',
		dates: 'October 2021 - June 2023',
		highlights: [
			'Represented District 3 on the city’s Youth Commission, advising on programs and policies affecting young people in San Diego.'
		],
		logoSrc: sdLogo,
		logoAlt: 'City of San Diego logo',
		backImageSrc: youthCommissionPhoto,
		backImageAlt: 'San Diego Youth Commission group photo'
	}
];
