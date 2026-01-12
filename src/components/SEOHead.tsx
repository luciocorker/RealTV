import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
}

/**
 * SEO Head component for managing page-specific meta tags
 * Updates document title and meta tags dynamically
 */
export function SEOHead({ 
  title = "RealTV - Unlimited Live TV, Movies & Series Streaming", 
  description = "Stream 1000+ live TV channels, movies, and series in HD quality. Start your FREE 7-day trial today.",
  canonical,
  noIndex = false
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogTitle) ogTitle.setAttribute("content", title);
    if (ogDescription) ogDescription.setAttribute("content", description);

    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterTitle) twitterTitle.setAttribute("content", title);
    if (twitterDescription) twitterDescription.setAttribute("content", description);

    // Update canonical URL if provided
    if (canonical) {
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute("href", canonical);
      }
    }

    // Handle noindex for pages that shouldn't be indexed
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (noIndex) {
      if (robotsMeta) {
        robotsMeta.setAttribute("content", "noindex, nofollow");
      }
    } else {
      if (robotsMeta) {
        robotsMeta.setAttribute("content", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
      }
    }

    // Cleanup: restore defaults on unmount (optional)
    return () => {
      document.title = "RealTV - Unlimited Live TV, Movies & Series Streaming | 1000+ Channels";
    };
  }, [title, description, canonical, noIndex]);

  return null;
}
