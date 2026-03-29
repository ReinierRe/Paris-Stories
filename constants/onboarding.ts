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

const parisOnboardingCategories: OnboardingCategory[] = [
  { name: "History", imageKey: "category-history" },
  { name: "Revolution", imageKey: "category-french-revolution" },
  { name: "Museums", imageKey: "category-museums" },
  { name: "Buildings", imageKey: "category-epic-buildings" },
  { name: "Modern", imageKey: "category-modern-history" },
  { name: "Culinary", imageKey: "category-culinary" },
  { name: "Neighborhoods", imageKey: "category-neighborhoods" },
];

const amsterdamOnboardingCategories: OnboardingCategory[] = [
  { name: "History", imageKey: "category-history" },
  { name: "Golden Age", imageKey: "category-golden-age" },
  { name: "Museums", imageKey: "category-museums" },
  { name: "Buildings", imageKey: "category-epic-buildings" },
  { name: "Modern", imageKey: "category-modern-history" },
  { name: "Culinary", imageKey: "category-culinary" },
  { name: "Neighborhoods", imageKey: "category-neighborhoods" },
];

const parisPodcastExamples: OnboardingPodcastExample[] = [
  { category: "MUSEUMS", title: "Musée d'Orsay", voice: "Male", duration: "2:09", lang: "EN", color: "#5B9BD5" },
  { category: "FRENCH REVOLUTION", title: "Danton: Stem van het Volk", voice: "Female", duration: "4:16", lang: "NL", color: "#E06060" },
  { category: "EPIC BUILDINGS", title: "The Panthéon", voice: "Male", duration: "3:09", lang: "EN", color: "#7A8B9A" },
  { category: "CULINARY", title: "Café Culture", voice: "Female", duration: "2:36", lang: "EN", color: "#E0A040" },
];

const amsterdamPodcastExamples: OnboardingPodcastExample[] = [
  { category: "MUSEUMS", title: "Het Rijksmuseum", voice: "Male", duration: "2:09", lang: "NL", color: "#5B9BD5" },
  { category: "GOLDEN AGE", title: "Rembrandt: Meester van het Licht", voice: "Female", duration: "4:16", lang: "NL", color: "#DAA520" },
  { category: "NEIGHBORHOODS", title: "De Jordaan", voice: "Male", duration: "3:09", lang: "EN", color: "#27AE60" },
  { category: "CULINARY", title: "Borrelcultuur & Bitterballen", voice: "Female", duration: "2:36", lang: "NL", color: "#E0A040" },
];

const parisCategoryTopicCounts = [8, 6, 10, 8, 7];
const amsterdamCategoryTopicCounts = [8, 8, 8, 8, 8];

const parisCustomSubjectExample = `I am visiting Montmartre, tell me about Picasso's life here`;
const amsterdamCustomSubjectExample = `I am visiting the Jordaan, tell me about the history of the canals`;

interface CityOnboardingContent {
  categories: OnboardingCategory[];
  podcastExamples: OnboardingPodcastExample[];
  categoryTopicCounts: number[];
  customSubjectExample: string;
  slidesSubtitle: string;
}

const cityOnboardingMap: Record<string, CityOnboardingContent> = {
  paris: {
    categories: parisOnboardingCategories,
    podcastExamples: parisPodcastExamples,
    categoryTopicCounts: parisCategoryTopicCounts,
    customSubjectExample: parisCustomSubjectExample,
    slidesSubtitle: "Explore the French Revolution, hidden neighborhoods, iconic buildings, and centuries of fascinating history.",
  },
  amsterdam: {
    categories: amsterdamOnboardingCategories,
    podcastExamples: amsterdamPodcastExamples,
    categoryTopicCounts: amsterdamCategoryTopicCounts,
    customSubjectExample: amsterdamCustomSubjectExample,
    slidesSubtitle: "Explore the Golden Age, hidden neighborhoods, iconic canals, and centuries of fascinating history.",
  },
};

function getCityOnboarding(): CityOnboardingContent {
  const cityId = getCityConfigSync().id;
  return cityOnboardingMap[cityId] || cityOnboardingMap.paris;
}

export function getOnboardingCategories(): OnboardingCategory[] {
  return getCityOnboarding().categories;
}

export function getOnboardingPodcastExamples(): OnboardingPodcastExample[] {
  return getCityOnboarding().podcastExamples;
}

export function getOnboardingCategoryTopicCounts(): number[] {
  return getCityOnboarding().categoryTopicCounts;
}

export function getOnboardingCustomSubjectExample(): string {
  return getCityOnboarding().customSubjectExample;
}

export const onboardingCategories = parisOnboardingCategories;
export const onboardingPodcastExamples = parisPodcastExamples;
export const onboardingCategoryTopicCounts = parisCategoryTopicCounts;
export const onboardingCustomSubjectExample = parisCustomSubjectExample;

export function getOnboardingSlides(): OnboardingSlide[] {
  const cityName = getCityConfigSync().name;
  const content = getCityOnboarding();
  return [
    {
      id: "welcome",
      title: `Discover the\nReal ${cityName}`,
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
      id: "stories",
      title: "Stories That\nCome Alive",
      subtitle: content.slidesSubtitle,
      features: [
        { icon: "time", text: "Rich historical depth" },
        { icon: "map", text: "Neighborhood guides" },
        { icon: "restaurant", text: "Culinary traditions" },
      ],
    },
    {
      id: "custom",
      title: "Create Your\nOwn Adventure",
      subtitle: `Tell the AI your interests and get a personalized story — your own private ${cityName} guide.`,
      features: [
        { icon: "sparkles", text: "AI-powered stories" },
        { icon: "create", text: "Choose your angle" },
        { icon: "heart", text: "Save your favorites" },
      ],
    },
  ];
}

export const onboardingSlides = getOnboardingSlides();
