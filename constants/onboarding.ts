import { getCityConfigSync } from "./city";

export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  features?: { icon: string; text: string }[];
}

export interface OnboardingCategory {
  name: string;
  imageKey: string;
}

export interface OnboardingPodcastExample {
  category: string;
  title: string;
  voice: string;
  duration: string;
  lang: string;
  color: string;
}

export const onboardingCategories: OnboardingCategory[] = [
  { name: "History", imageKey: "category-history" },
  { name: "Revolution", imageKey: "category-french-revolution" },
  { name: "Museums", imageKey: "category-museums" },
  { name: "Buildings", imageKey: "category-epic-buildings" },
  { name: "Modern", imageKey: "category-modern-history" },
  { name: "Culinary", imageKey: "category-culinary" },
  { name: "Neighborhoods", imageKey: "category-neighborhoods" },
];

export const onboardingPodcastExamples: OnboardingPodcastExample[] = [
  { category: "MUSEUMS", title: "Musée d'Orsay", voice: "Male", duration: "2:09", lang: "EN", color: "#5B9BD5" },
  { category: "FRENCH REVOLUTION", title: "Danton: Stem van het Volk", voice: "Female", duration: "4:16", lang: "NL", color: "#E06060" },
  { category: "EPIC BUILDINGS", title: "The Panthéon", voice: "Male", duration: "3:09", lang: "EN", color: "#7A8B9A" },
  { category: "CULINARY", title: "Café Culture", voice: "Female", duration: "2:36", lang: "EN", color: "#E0A040" },
];

export const onboardingCategoryTopicCounts = [8, 6, 10, 8, 7];

export const onboardingCustomSubjectExample = `I am visiting Montmartre, tell me about Picasso's life here`;

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "welcome",
    title: `Discover the\nReal ${getCityConfigSync().name}`,
    subtitle: "Tailored history, culture, and local tales — brought to life through immersive audio stories.",
  },
  {
    id: "audio-tours",
    title: "Immersive\nAudio Tours",
    subtitle: "Expertly crafted podcasts for museums, landmarks, and neighborhoods — available in multiple languages.",
    features: [
      { icon: "headset", text: "Professional narration" },
      { icon: "language", text: "Multiple languages" },
      { icon: "timer", text: "Short & long formats" },
    ],
  },
  {
    id: "real-paris",
    title: "Stories That\nCome Alive",
    subtitle: "Explore the French Revolution, hidden neighborhoods, iconic buildings, and centuries of fascinating history.",
    features: [
      { icon: "time", text: "Rich historical depth" },
      { icon: "map", text: "Neighborhood guides" },
      { icon: "restaurant", text: "Culinary traditions" },
    ],
  },
  {
    id: "custom",
    title: "Create Your\nOwn Adventure",
    subtitle: `Tell the AI your interests and get a personalized story — your own private ${getCityConfigSync().name} guide.`,
    features: [
      { icon: "sparkles", text: "AI-powered stories" },
      { icon: "create", text: "Choose your angle" },
      { icon: "heart", text: "Save your favorites" },
    ],
  },
];
