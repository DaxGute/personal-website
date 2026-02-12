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
