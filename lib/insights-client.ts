export interface Insight {
  title: string;
  subtitle: string;
  content: string;
  order: number;
  slug: string;
}

// Client-side insights data
export const insights: Insight[] = [
  {
    slug: "naval-access",
    title: "Naval Access Story",
    subtitle: "Russia's Strategic Port Agreements in Africa",
    content: "Russia has been expanding its naval presence across Africa through strategic port access agreements. These agreements provide critical logistical support for Russian naval operations in the Atlantic and Indian Ocean regions, while strengthening bilateral military cooperation with African nations.",
    order: 1,
  },
  {
    slug: "human-trafficking",
    title: "Human Trafficking Story",
    subtitle: "Wagner Group's Exploitation Networks",
    content: "Reports indicate concerning patterns of labor exploitation and human trafficking linked to private military contractors operating in African regions. These networks have raised serious human rights concerns among international observers and local communities.",
    order: 2,
  },
  {
    slug: "disinfo-burkina-faso",
    title: "Disinfo in BFA Story",
    subtitle: "Information Operations in Burkina Faso",
    content: "Burkina Faso has become a focal point for Russian information operations in West Africa. State-backed media outlets and social media campaigns have proliferated, promoting pro-Russian narratives while undermining democratic institutions and Western partnerships.",
    order: 3,
  },
  {
    slug: "drone-trafficking",
    title: "Drone Factories/Human Trafficking",
    subtitle: "UAV Production and Labor Exploitation",
    content: "Emerging reports suggest connections between drone manufacturing facilities and exploitative labor practices. The rapid expansion of UAV production capabilities in certain regions has raised questions about supply chain ethics and worker conditions.",
    order: 4,
  },
  {
    slug: "report-available",
    title: "Special Report Available",
    subtitle: "Q4 2024 Russia-Africa Relations Analysis",
    content: "Our comprehensive quarterly report analyzing Russia-Africa relations is now available. The report covers military cooperation, economic ties, disinformation campaigns, and strategic implications for regional stability. Download the full report to access detailed data visualizations and expert analysis.",
    order: 5,
  },
  {
    slug: "placeholder-story",
    title: "Additional Insight Story",
    subtitle: "Emerging Trends and Developments",
    content: "This is a placeholder for additional insights and analysis. As new patterns and developments emerge in Russia-Africa relations, this space will be updated with relevant information and strategic assessments.\n\nThe geopolitical landscape across Africa continues to evolve as multiple international actors compete for influence. Russian engagement strategies have adapted to changing regional dynamics, focusing on security partnerships, resource extraction agreements, and diplomatic outreach to governments experiencing tensions with traditional Western partners.\n\nRecent months have seen increased activity in information operations, with state-backed media expanding their footprint across the continent. Social media campaigns have become more sophisticated, targeting local audiences with content tailored to regional grievances and political sensitivities. These efforts complement traditional diplomatic engagement and security cooperation.\n\nEconomic partnerships have centered on energy, mining, and agricultural sectors, with several major agreements signed in resource-rich nations. These arrangements often include technology transfers, infrastructure development, and training programs. The long-term implications of these partnerships continue to be debated among regional analysts and international observers.\n\nMilitary cooperation has expanded beyond traditional arms sales to include training missions, joint exercises, and the deployment of private military contractors. These security relationships have proven particularly attractive to governments facing internal instability or militant threats. However, concerns persist about transparency, accountability, and the broader impact on regional security dynamics.",
    order: 6,
  },
];
