import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface Insight {
  title: string;
  subtitle: string;
  content: string;
  order: number;
  slug: string;
}

export function getInsights(): Insight[] {
  const insightsDirectory = path.join(process.cwd(), 'content/insights');

  // Check if directory exists
  if (!fs.existsSync(insightsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(insightsDirectory);

  const insights = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(insightsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || 'Untitled',
        subtitle: data.subtitle || '',
        content: content.trim(),
        order: data.order || 999,
      };
    });

  // Sort by order field
  return insights.sort((a, b) => a.order - b.order);
}
