import city from "./city";

export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  features?: { icon: string; text: string }[];
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "welcome",
    title: `Discover the\nReal ${city.name}`,
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
    subtitle: `Tell the AI your interests and get a personalized story — your own private ${city.name} guide.`,
    features: [
      { icon: "sparkles", text: "AI-powered stories" },
      { icon: "create", text: "Choose your angle" },
      { icon: "heart", text: "Save your favorites" },
    ],
  },
];
