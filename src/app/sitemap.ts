import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://billwise.in';
  const currentDate = new Date().toISOString().slice(0, 10);

  const publicRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/predict', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/scan', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/manual', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/what-if', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/usage', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/budget', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/appliances', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/history', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/tariff', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/privacy', priority: 0.6, changeFrequency: 'yearly' as const },
    // High-intent consumer landing pages
    { path: '/kseb-bill-calculator', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/kseb-bill-predictor', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/kseb-meter-reading', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/kseb-bill-explained', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/kseb-tariff', priority: 0.8, changeFrequency: 'monthly' as const },
  ];

  return publicRoutes.map(route => ({
    url: `${baseUrl}${route.path}`,
    lastModified: currentDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
