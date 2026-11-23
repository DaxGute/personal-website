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
	backLead?: string;
	backBullets?: string[];
	backParagraphs?: ProjectBackParagraph[];
	backImages?: ProjectBackImage[];
	tech?: string[];
	links?: ProjectLink[];
};

export const projects: Project[] = [
	{
		id: 'project-2',
		name: 'RiseAQI',
		blurb: 'Hyperlocal air quality for South San Francisco',
		description:
			'Designed, engineered, and deployed a bilingual iOS application delivering real-time air-quality monitoring and short-term forecasts for South San Francisco.',
		highlights: [],
		backLead:
			'Designed, engineered, and deployed a bilingual iOS application delivering real-time air-quality monitoring and short-term forecasts for South San Francisco.',
		backBullets: [
			'Built a React Native frontend with Mapbox heatmaps, interactive sensor visualizations, and bilingual educational resources.',
			'Developed a Supabase backend integrating PurpleAir, Clarity, EPA AQS, and NOAA data through automated ingestion and aggregation pipelines.',
			'Implemented spatial interpolation and wind-informed AQI forecasting to generate neighborhood-level pollution estimates and short-term predictions.'
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
		blurb: 'Free tutoring led by students',
		description:
			'Founded and led Kid By Kid, a 501(c)(3) nonprofit empowering young people to develop and lead community service initiatives.',
		highlights: [],
		backLead:
			'Founded and led Kid By Kid, a 501(c)(3) nonprofit empowering young people to develop and lead community service initiatives.',
		backBullets: [
			'Expanded the organization to 50+ schools, engaging students in youth-led service projects and community partnerships.',
			'Organized and supported initiatives generating over 13,000 hours of community service across participating schools.',
			"Directed organizational strategy, partnerships, and volunteer recruitment, while developing the organization's website and digital outreach infrastructure."
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
		blurb: 'Capture research from scientific conferences',
		description:
			'Independently designed and developed ConfCap, a mobile platform for capturing and sharing emerging scientific research through a $10,000 development contract.',
		backLead:
			'Independently designed and developed ConfCap, a mobile platform for capturing and sharing emerging scientific research through a $10,000 development contract.',
		backBullets: [
			'Built a React Native application enabling users to discover scientific conferences, capture research presentations, and share findings with interested researchers.',
			'Developed location-based event discovery, multimedia submissions, and research organization features using Expo and Supabase.',
			'Implemented a bounty-based contribution system connecting research requests with conference attendees, including submission verification and review workflows.'
		]
	},
];
