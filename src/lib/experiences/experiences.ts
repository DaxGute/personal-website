import baiLogo from '$lib/assets/experience/bai_logo.jpeg';
import baiPhoto from '$lib/assets/experience/bai_photo.jpeg';
import cestaLogo from '$lib/assets/experience/CESTA_logo.jpg';
import cestaPhoto from '$lib/assets/experience/cesta_photo.jpg';
import ccLogo from '$lib/assets/experience/cc_logo.jpeg';
import ccPhoto from '$lib/assets/experience/cc_photo.png';
import sdLogo from '$lib/assets/experience/sd_logo.jpeg';
import youthCommissionPhoto from '$lib/assets/experience/youth_commission.png';
import stanfordCampus from '$lib/assets/education/stanford_campus.png';
import stanfordLogo from '$lib/assets/education/stanford_logo.png';
import stanfordPortrait from '$lib/assets/education/stanford_portrait.png';
import riseSouthCityLogo from '$lib/assets/experience/rise_south_city_logo.png';
import riseSouthCityMeeting from '$lib/assets/experience/rise_south_city_meeting.jpg';

export type Experience = {
	company: string;
	location: string;
	title: string;
	dates: string;
	logoSrc: string;
	logoAlt: string;
	backImageSrc?: string;
	backImageAlt?: string;
	backImageHref?: string;
	backLinkLabel?: string;
	backImageGrayscale?: boolean;
	backLead: string;
	backBullets: string[];
	skills?: string[];
};

export const experiences: Experience[] = [
	{
		company: 'CESTA',
		location: 'Stanford, CA',
		title: 'Digital Humanities Researcher',
		dates: 'June 2026 - Aug 2026',
		logoSrc: cestaLogo,
		logoAlt: 'CESTA logo',
		backImageSrc: cestaPhoto,
		backImageAlt: 'Presenting CESTA research on the subtle effects of trust',
		backLead:
			'Designed and built a multi-agent AI research platform to investigate how communication policies and information distribution affect collaborative problem-solving.',
		backBullets: [
			'Developed a React-based interface for configuring experiments, inspecting agent conversations, and visualizing reasoning trajectories.',
			'Built a configurable LLM testbench integrating OpenAI models and local Qwen models, with automated experiment execution, token tracking, and performance evaluation.',
			'Implemented collaborative reasoning benchmarks, including crosswords and hidden-profile tasks, to evaluate information sharing, misinformation, and agent deference.'
		]
	},
	{
		company: 'BenevolentAI',
		location: 'London, England',
		title: 'Data Science Intern',
		dates: 'June 2025 - Aug 2025',
		logoSrc: baiLogo,
		logoAlt: 'BenevolentAI logo',
		backImageSrc: baiPhoto,
		backImageAlt: 'At BenevolentAI reception in London',
		backLead:
			'Explored applications of AI in drug discovery, product development, and commercial strategy.',
		backBullets: [
			"Evaluated product-market fit and commercialization opportunities for BenevolentAI's evolving drug-target intelligence platform.",
			'Developed ConfCap, a conference research-capture platform, through a subsequent $10,000 independent contract.',
			'Collaborated across research, technical, and commercial teams, gaining exposure to NLP-based target identification and drug discovery.'
		]
	},
	{
		company: 'Shah Lab',
		location: 'Stanford, CA',
		title: 'Neuroscience Research Assistant',
		dates: 'August 2026 - Present',
		logoSrc: stanfordLogo,
		logoAlt: 'Stanford logo',
		backImageSrc: stanfordPortrait,
		backImageAlt: 'Standing in the Stanford Main Quad colonnade',
		backLead:
			'Developing computer-vision and machine-learning methods to identify social behaviors in mice for computational neuroscience research.',
		backBullets: [
			'Built a two-stage behavioral detection pipeline combining object detection and tracking with a temporal MLP classifier.',
			'Engineered 16-frame temporal windows and pair-centered spatial features to classify behavioral interactions.',
			'Achieved 93.5% behavioral bout recall while flagging only 22.4% of video frames for review, potentially saving hours of manual classification.'
		]
	},
	{
		company: 'Rise South City',
		location: 'Palo Alto, CA',
		title: 'Data Science Researcher & Product Developer',
		dates: 'January 2026 - Present',
		logoSrc: riseSouthCityLogo,
		logoAlt: 'Rise South City logo',
		backImageSrc: riseSouthCityMeeting,
		backImageAlt: 'Rise South City community meeting on a video call',
		backLead:
			"Partnered with Rise South City through Stanford's Data Science capstone to develop community-focused air-quality monitoring tools for South San Francisco.",
		backBullets: [
			'Collaborated with Stanford researchers and community stakeholders to translate environmental data and user needs into technical requirements.',
			'Led the development and deployment of a bilingual iOS app, integrating real-time sensor APIs, spatial modeling, and interactive AQI visualizations.',
			'Presented the app at a community workshop, achieving 9.5/10 average participant satisfaction and securing funding for Android development.'
		]
	}
];

/** Revealed by the experiences "Show more" control. */
export const moreExperiences: Experience[] = [
	{
		company: 'Stanford University',
		location: 'Stanford, CA',
		title: 'Undergraduate Outreach Coordinator',
		dates: 'November 2026 - Present',
		logoSrc: stanfordLogo,
		logoAlt: 'Stanford logo',
		backImageSrc: stanfordCampus,
		backImageAlt: 'Stanford campus building under a cloudy sky',
		backLead:
			"Supporting the development and outreach of Stanford's new Data Science for Artistic and Cultural Analysis program.",
		backBullets: [
			"Collaborating with faculty and staff to design coursework and develop the program's curriculum.",
			'Promoting the new academic pathway to students, faculty, and staff through outreach and informational initiatives.'
		]
	},
	{
		company: 'Castle Creek Capital',
		location: 'San Diego, CA',
		title: 'Investment Analytics',
		dates: 'June 2024 - September 2024',
		logoSrc: ccLogo,
		logoAlt: 'Castle Creek Capital logo',
		backImageSrc: ccPhoto,
		backImageAlt: 'At Castle Creek Capital',
		backImageHref: 'https://www.castlecreek.com/internship',
		backLinkLabel: 'Internship Page',
		backImageGrayscale: true,
		backLead:
			'Applied financial modeling and quantitative analysis to evaluate investment opportunities in U.S. community and regional banks.',
		backBullets: [
			'Evaluated 20+ community banks using S&P Capital IQ and Excel, analyzing financial performance, valuations, and investment potential.',
			'Developed DCF models, earnings projections, and financial visualizations to support investment research and quarterly fund reporting.',
			'Conducted due diligence on a prospective Fund VII investment, synthesizing financial analysis into an investment presentation for senior management.'
		]
	},
	{
		company: 'City of San Diego',
		location: 'San Diego, CA',
		title: 'Youth Commissioner',
		dates: 'October 2021 - June 2023',
		logoSrc: sdLogo,
		logoAlt: 'City of San Diego logo',
		backImageSrc: youthCommissionPhoto,
		backImageAlt: 'San Diego Youth Commission group photo',
		backLead:
			'Appointed by the Mayor of San Diego to represent District 3 on the Youth Commission, advising city leadership on policies and programs affecting young people.',
		backBullets: [
			'Advocated for educational equity in underserved communities, focusing on expanding access to peer tutoring, mentorship, and academic resources.',
			'Promoted initiatives supporting refugee and immigrant youth, emphasizing cultural integration, educational opportunities, and community inclusion.'
		]
	}
];
