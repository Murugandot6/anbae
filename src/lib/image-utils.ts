"use client";

/**
 * Extracts the highest quality image URL from the API response array.
 * Structure: [{ quality: "500x500", url: "..." }]
 */
export const getHighResImage = (image: any, customFallback?: string) => {
  const fallback = customFallback || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500';
  
  if (!image) return fallback;

  if (typeof image === 'string') {
    return image.replace('http://', 'https://');
  }

  if (Array.isArray(image) && image.length > 0) {
    // API provides 50x50, 150x150, 500x500
    const highRes = image.find(i => i.quality === '500x500') || image[image.length - 1];
    const imageUrl = highRes.url || highRes.link;
    
    if (imageUrl && typeof imageUrl === 'string') {
      return imageUrl.replace('http://', 'https://');
    }
  }

  return fallback;
};