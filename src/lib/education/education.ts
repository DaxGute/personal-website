import bishopsGraduation from '$lib/assets/education/bishops_graduation.png';
import bishopsLogo from '$lib/assets/education/bishops_logo.png';
import bishopsWithDog from '$lib/assets/education/bishops_with_dog.png';
import stanfordLogo from '$lib/assets/education/stanford_logo.png';

export type EducationBackImage = {
	src: string;
	alt: string;
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
};

export const educations: Education[] = [
	{
		school: 'Stanford University',
		location: 'Stanford CA',
		degree: 'Data Science [BS]',
		dates: 'September 2023 - Present',
		details: [
			'Coursework in probability, statistics, computer science, and data-driven decision making. Focused on applied machine learning and data analysis.'
		],
		logoSrc: stanfordLogo,
		logoAlt: 'Stanford logo'
	},
	{
		school: 'The Bishops School',
		location: 'San Diego CA',
		degree: 'HS Diploma',
		dates: 'August 2017 - June 2023',
		details: [
			'Graduated Cum Laude; Coursework in advanced mathematics, computer science, and economics. [GPA: 4.82]'
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
		]
	}
];
