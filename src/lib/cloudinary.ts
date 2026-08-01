export interface MovieItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  videoUrl: string;
  posterUrl: string;
  description: string;
}

export const SAMPLE_ROMANTIC_MOVIES: MovieItem[] = [
  {
    id: "la-la-land",
    title: "La La Land - Romantic Serenade",
    category: "Musical Romance",
    duration: "2m 15s",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    posterUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80",
    description: "A magical romantic journey under the city lights.",
  },
  {
    id: "sunset-romance",
    title: "Before Sunset - Seaside Stroll",
    category: "Intimate Drama",
    duration: "3m 45s",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    posterUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    description: "Heartwarming conversations while watching the sunset over calm ocean waves.",
  },
  {
    id: "tears-of-joy",
    title: "Tears of Steel - Sci-Fi Love Story",
    category: "Romantic Sci-Fi",
    duration: "12m 14s",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    posterUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80",
    description: "An epic sci-fi tale of lost love, memories, and second chances.",
  },
  {
    id: "big-buck-bunny",
    title: "Big Buck Bunny - Cozy Anime Feature",
    category: "Animation & Romance",
    duration: "9m 56s",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
    description: "A cute, wholesome animated story perfect for date night cuddling.",
  },
];

export const getCloudinaryTransformedUrl = (url: string): string => {
  if (!url) return "";
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", "/upload/q_auto,f_auto/");
  }
  return url;
};
