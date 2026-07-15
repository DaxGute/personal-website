import kbkAwards from '$lib/assets/project/kbk_awards.jpeg';
import kbkBanner from '$lib/assets/project/kbk_banner.jpeg';
import kbkHolidays from '$lib/assets/project/kbk_holidays.jpeg';
import kbkIrc from '$lib/assets/project/kbk_irc.jpeg';
import kbkTable from '$lib/assets/project/kbk_table.jpeg';
import kbkTutoring from '$lib/assets/project/kbk_tutoring.jpeg';
import raqiAlerts from '$lib/assets/project/raqi_alerts.png';
import raqiEducation from '$lib/assets/project/raqi_education.png';
import raqiForecast from '$lib/assets/project/raqi_forecast.png';
import raqiGraphs from '$lib/assets/project/raqi_graphs.png';
import raqiMap from '$lib/assets/project/raqi_map.png';
import raqiPoster from '$lib/assets/project/raqi_poster.png';

export type ProjectLink = { label: string; href: string };

export type ProjectBackSection = {
	heading: string;
	items: string[];
};

export type ProjectBackParagraph = {
	heading: string;
	body: string;
};

export type ProjectBackImage = {
	src: string;
	alt: string;
};

export type Project = {
	id: string;
	name: string;
	blurb: string;
	description: string;
	highlights?: string[];
	backSections?: ProjectBackSection[];
	backParagraphs?: ProjectBackParagraph[];
	backImages?: ProjectBackImage[];
	tech?: string[];
	links?: ProjectLink[];
};

export const projects: Project[] = [
	{
		id: 'project-2',
		name: 'RiseAQI',
		blurb: 'Built a Real-Time Community Air Quality Platform Serving South San Francisco Residents',
		description:
			'Designed and developed a bilingual web and mobile platform that integrates PurpleAir and Clarity sensor networks with spatial interpolation, wind forecasting, historical trends, and personalized alerts to deliver hyperlocal air quality information for South San Francisco in partnership with Rise South City.',
		highlights: [
		],
		backSections: [
			{
				heading: 'Overview',
				items: [
					'Developed Rise AQI with Rise South City to deliver neighborhood-level air quality data for South San Francisco residents.',
					'Combined real-time monitoring, predictive modeling, and education into one platform that makes environmental data actionable.'
				]
			},
			{
				heading: 'Technical Development',
				items: [
					'Built with React Native (Expo), Supabase, and automated cloud infrastructure.',
					'Integrated PurpleAir, Clarity, and Open-Meteo into Edge Functions that ingest, validate, and store hourly observations.'
				]
			},
			{
				heading: 'Air Quality Modeling',
				items: [
					'Designed spatial interpolation between stations and hourly forecasting using pollutant and wind data.',
					'Implemented validation, quality controls, and interactive heat maps for neighborhood-level pollution.'
				]
			},
			{
				heading: 'Community Impact',
				items: [
					'Created bilingual (EN/ES) resources on air quality, wildfire smoke, health impacts, and protective actions.',
					'Built customizable alerts and partnered with Rise South City on environmental justice initiatives.'
				]
			}
		],
		backImages: [
			{ src: raqiMap, alt: 'RiseAQI map view with air quality estimate popup' },
			{ src: raqiEducation, alt: 'RiseAQI education tab with AQI health guide' },
			{ src: raqiGraphs, alt: 'RiseAQI graph tab with AQI trends and calendar' },
			{ src: raqiAlerts, alt: 'RiseAQI customizable air quality alert settings' },
			{ src: raqiForecast, alt: 'RiseAQI PM2.5 scenario projection with wind overlay' },
			{ src: raqiPoster, alt: 'Rise South City research poster presentation' }
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
		id: 'project-1',
		name: 'Kid By Kid',
		blurb: 'Paired Hundreds of Tutors and Learners through 13,000+ Hours of 1-on-1 Tutoring',
		description:
			'Through free online one-on-one tutoring, Kid By Kid Middle and High School student Mentors work with under-served Elementary and Middle School-aged immigrant, refugee, and ESL Learners to provide life-changing academic opportunity, and support.',
		highlights: [
		],
		backSections: [
			{
				heading: 'Overview',
				items: [
					'Founded a student-led nonprofit providing free one-on-one online tutoring for immigrant, refugee, and ELL students.',
					'Facilitated 13,000+ tutoring hours while pairing hundreds of mentors and learners.'
				]
			},
			{
				heading: 'Organization & Leadership',
				items: [
					'Served as Executive Director, overseeing growth, operations, and organizational policy.',
					'Built tutor applications, matching systems, and onboarding materials.'
				]
			},
			{
				heading: 'Program Design',
				items: [
					'Designed personalized mentor matching by academic need, grade, subject, and availability.',
					'Coordinated scheduling, communication, and progress tracking for tutors and families.'
				]
			},
			{
				heading: 'Community Impact',
				items: [
					'Partnered with schools and community orgs to reach students needing academic support.',
					'Expanded affordable tutoring access while developing volunteer leadership skills.'
				]
			}
		],
		backImages: [
			{ src: kbkTutoring, alt: 'Tutoring session with Kid By Kid logo on screen' },
			{ src: kbkIrc, alt: 'Delivering Kid By Kid bags to the International Rescue Committee' },
			{ src: kbkAwards, alt: 'Kid By Kid awards ceremony group photo' },
			{ src: kbkHolidays, alt: 'Holiday gift delivery from The Bishop\'s School' },
			{ src: kbkBanner, alt: 'Kid By Kid banner with honor roll medals and trophies' },
			{ src: kbkTable, alt: 'Sitting behind the Kid By Kid banner at an outdoor event' }
		],
		tech: ['Nonprofit Leadership', 'Program Design'],
		links: [{ label: 'Website', href: 'https://kidbykid.org' }]
	},
	{
		id: 'project-3',
		name: 'ConfCap',
		blurb: 'Designed and Built a Conference Bounty App from Ground Up',
		description:
			'ConfCap is a media capturing software that distributes real bounties to conference attendees who submit papers and presentations.',
		backParagraphs: [
			{
				heading: '⚠️ WIP ⚠️',
				body: ''
			}
		]
	},
];
