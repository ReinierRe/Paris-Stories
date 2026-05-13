import { CITY_REGISTRY } from "./cityRegistry";

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

/**
 * Multi-city onboarding content. Shown on the login/welcome screen.
 * Mixes examples from all bundled cities so new users see the breadth
 * of the app, not just one city.
 */

const mixedCategories: OnboardingCategory[] = [
  { name: "History", imageKey: "theme-history" },
  { name: "Museums", imageKey: "theme-museums" },
  { name: "Neighborhoods", imageKey: "theme-neighborhoods" },
  { name: "Epic Buildings", imageKey: "theme-buildings" },
  { name: "Culture", imageKey: "theme-modern" },
  { name: "Culinary", imageKey: "theme-culinary" },
];

const mixedPodcastExamples: OnboardingPodcastExample[] = [
  { category: "AMSTERDAM · GOLDEN AGE", title: "Rembrandt: Meester van het Licht", voice: "Female", duration: "4:16", lang: "NL", color: "#DAA520" },
  { category: "PARIS · FRENCH REVOLUTION", title: "Danton: Voice of the People", voice: "Male", duration: "4:02", lang: "EN", color: "#E06060" },
  { category: "BARCELONA · GAUDÍ", title: "La Sagrada Família", voice: "Male", duration: "3:24", lang: "ES", color: "#E07A1F" },
  { category: "AMSTERDAM · NEIGHBORHOODS", title: "De Jordaan", voice: "Female", duration: "3:09", lang: "EN", color: "#27AE60" },
];

const mixedCategoryTopicCounts = [8, 8, 8, 8, 8, 8, 7];

const customSubjectExample = `I am visiting the Jordaan, tell me about the history of the canals`;

export function getOnboardingCategories(): OnboardingCategory[] {
  return mixedCategories;
}

export function getOnboardingPodcastExamples(): OnboardingPodcastExample[] {
  return mixedPodcastExamples;
}

export function getOnboardingCategoryTopicCounts(): number[] {
  return mixedCategoryTopicCounts;
}

export function getOnboardingCustomSubjectExample(): string {
  return customSubjectExample;
}

// Backwards-compat exports (unchanged shape, multi-city content)
export const onboardingCategories = mixedCategories;
export const onboardingPodcastExamples = mixedPodcastExamples;
export const onboardingCategoryTopicCounts = mixedCategoryTopicCounts;
export const onboardingCustomSubjectExample = customSubjectExample;

export function getOnboardingSlides(): OnboardingSlide[] {
  const cityCount = CITY_REGISTRY.length;
  return [
    {
      id: "welcome",
      title: "Discover Cities\nThrough Stories",
      subtitle: `Discover Europe's cities beyond the guidebook. Whether it's hidden urban legends or the heights of architectural ambition, listen to curated podcast stories tailored to your interests. Your personal audio guide to the heart of the city.`,
    },
    {
      id: "audio-tours",
      title: "Immersive\nAudio Tours",
      subtitle: "Expertly crafted podcasts for museums, landmarks, and neighborhoods — available in 5 languages.",
      features: [
        { icon: "headset", text: "Professional narration" },
        { icon: "language", text: "5 languages" },
        { icon: "timer", text: "Short & long formats" },
      ],
    },
    {
      id: "stories",
      title: "Unique city\nstories",
      subtitle: "Amsterdam's Golden Age. Paris and the French Revolution. Gaudí's Barcelona. Each city has its own library — explore them all from one app.",
      features: [
        { icon: "time", text: "Rich historical depth" },
        { icon: "map", text: "Neighborhood guides" },
        { icon: "restaurant", text: "Culinary traditions" },
      ],
    },
    {
      id: "custom",
      title: "Create Your\nOwn Adventure",
      subtitle: "Tell the AI your interests and get a personalized story — your own private city guide, for any city you've added.",
      features: [
        { icon: "sparkles", text: "AI-powered stories" },
        { icon: "create", text: "Choose your angle" },
        { icon: "heart", text: "Save your favorites" },
      ],
    },
  ];
}

export const onboardingSlides = getOnboardingSlides();
