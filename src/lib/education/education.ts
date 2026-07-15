import bishopsGraduation from '$lib/assets/education/bishops_graduation.png';
import bishopsLogo from '$lib/assets/education/bishops_logo.png';
import bishopsWithDog from '$lib/assets/education/bishops_with_dog.jpeg';
import stanfordCampus from '$lib/assets/education/stanford_campus.png';
import stanfordLogo from '$lib/assets/education/stanford_logo.png';
import stanfordPortrait from '$lib/assets/education/stanford_portrait.png';

export type EducationBackImage = {
	src: string;
	alt: string;
};

export type EducationBackSection = {
	heading: string;
	items?: string[];
	/** Compact activity/club names shown after the prose items. */
	activities?: string[];
	/** Optional download/external link rendered after the section items. */
	link?: { label: string; href: string; download?: boolean };
};

export type Education = {
	school: string;
	location: string;
	degree: string;
	dates: string;
	details: string[];
	logoSrc: string;
	logoAlt: string;
	backImages?: EducationBackImage[];
	backSections?: EducationBackSection[];
};

export const educations: Education[] = [
	{
		school: 'Stanford University',
		location: 'Stanford CA',
		degree: 'Data Science [BS]',
		dates: 'September 2023 - Present',
		details: [
			'Pursuing a Bachelor of Science in Data Science while complementing my studies with Computational Neuroscience and Symbolic Systems. My coursework focuses on machine learning, statistics, artificial intelligence, and computational methods for solving real-world problems.'
		],
		logoSrc: stanfordLogo,
		logoAlt: 'Stanford logo',
		backImages: [
			{
				src: stanfordCampus,
				alt: 'Stanford campus building under a cloudy sky'
			},
			{
				src: stanfordPortrait,
				alt: 'Standing in the Stanford Main Quad colonnade'
			}
		],
		backSections: [
			{
				heading: 'Academics',
				items: [
					'B.S. in Data Science with a 3.85 GPA.',
					'Computational Neuroscience Concentration.',
					'Symbolic Systems Minor.',
					'Coursework in Machine Learning, Artificial Intelligence, Statistics, Optimization, Economics, and Neuroscience.'
				],
				link: {
					label: '[Download Unofficial Transcript]',
					href: '/stanford-unofficial-transcript.pdf',
					download: true
				}
			},
			{
				heading: 'Leadership & Service',
				items: [
					'CESTA Research Intern.',
					'Stanford School of Medicine (Shah Lab).',
					'Rise South City Air Quality Initiative.'
				]
			},
			{
				heading: 'Beyond the Classroom',
				items: [
					'Independent research in artificial intelligence and computational neuroscience.',
					'Interdisciplinary collaboration with faculty, graduate researchers, and nonprofit partners.'
				]
			},
			{
				heading: 'Highlights',
				items: [
					'Developed the Rise AQI platform in partnership with Rise South City.',
					'Conducted AI and digital humanities research through Stanford CESTA.',
					'Combined Data Science with Computational Neuroscience and Symbolic Systems in an interdisciplinary academic path.'
				]
			}
		]
	},
	{
		school: 'The Bishops School',
		location: 'San Diego CA',
		degree: 'HS Diploma',
		dates: 'August 2017 - June 2023',
		details: [
			'Graduated Cum Laude with a 4.82 GPA while pursuing advanced coursework in mathematics, computer science, economics, and Chinese. Beyond academics, I was deeply involved in leadership, service, and technology initiatives across the school community.'
		],
		logoSrc: bishopsLogo,
		logoAlt: "The Bishop's School logo",
		backImages: [
			{
				src: bishopsWithDog,
				alt: 'In Bishop’s School uniform with a dog on campus'
			},
			{
				src: bishopsGraduation,
				alt: 'Bishop’s School graduation display with diploma and community service award'
			}
		],
		backSections: [
			{
				heading: 'Academics',
				items: [
					'Graduated Cum Laude with a 4.82 GPA.',
					'Advanced coursework in Mathematics, Computer Science, Economics, and Chinese.',
					'AP Scholar with Distinction: Calculus BC • Computer Science A • Biology • Physics C • Statistics • Macroeconomics • Microeconomics • U.S. History • English Language • Chinese Language & Culture'
				]
			},
			{
				heading: 'Leadership & Service',
				items: [
					'Founded Kid By Kid nonprofit.',
					'Values Committee member (3 years).',
					'Community Service Initiative.',
					'UCSD Youth Advisory Council.',
					'City of San Diego Youth Commissioner.'
				]
			},
			{
				heading: 'Beyond the Classroom',
				activities: [
					'Oracle Certified Associate Java SE 8',
					'BARC',
					'Science Bowl',
					'Math Club',
					'Computer Science Club',
					'Yale Young Global Scholars (YYGS)'
				]
			},
			{
				heading: 'Highlights',
				items: [
					'Skipped Honors Precalculus through independent study.',
					'Elected to Values Committee for three consecutive years.',
					'Founded Kid By Kid while in high school.',
					'Earned Oracle Java certification.',
					'Found a Brother through the AFS Exchange Program.'
				]
			}
		]
	}
];
