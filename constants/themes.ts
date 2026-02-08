export interface Topic {
  id: string;
  name: string;
  nameNl: string;
  description: string;
  descriptionNl: string;
}

export interface Theme {
  id: string;
  name: string;
  nameNl: string;
  icon: string;
  iconFamily: "Ionicons" | "MaterialIcons" | "MaterialCommunityIcons" | "Feather";
  color: string;
  topics: Topic[];
}

export const themes: Theme[] = [
  {
    id: "revolution",
    name: "French Revolution",
    nameNl: "Franse Revolutie",
    icon: "flag",
    iconFamily: "Ionicons",
    color: "#C0392B",
    topics: [
      {
        id: "bastille",
        name: "The Storming of the Bastille",
        nameNl: "De Bestorming van de Bastille",
        description: "The iconic event that sparked the revolution on July 14, 1789",
        descriptionNl: "De iconische gebeurtenis die de revolutie op 14 juli 1789 in gang zette",
      },
      {
        id: "marie-antoinette",
        name: "Marie Antoinette",
        nameNl: "Marie Antoinette",
        description: "The tragic queen whose life became a symbol of royal excess",
        descriptionNl: "De tragische koningin wier leven een symbool werd van koninklijke buitensporigheid",
      },
      {
        id: "reign-of-terror",
        name: "The Reign of Terror",
        nameNl: "Het Schrikbewind",
        description: "The dark period of mass executions under Robespierre",
        descriptionNl: "De donkere periode van massaexecuties onder Robespierre",
      },
      {
        id: "napoleon",
        name: "Napoleon's Rise to Power",
        nameNl: "De Opkomst van Napoleon",
        description: "From revolutionary general to Emperor of France",
        descriptionNl: "Van revolutionair generaal tot keizer van Frankrijk",
      },
    ],
  },
  {
    id: "museums",
    name: "Museums",
    nameNl: "Musea",
    icon: "museum",
    iconFamily: "MaterialIcons",
    color: "#2980B9",
    topics: [
      {
        id: "louvre",
        name: "The Louvre",
        nameNl: "Het Louvre",
        description: "The world's largest art museum and its hidden stories",
        descriptionNl: "Het grootste kunstmuseum ter wereld en zijn verborgen verhalen",
      },
      {
        id: "orsay",
        name: "Musée d'Orsay",
        nameNl: "Musée d'Orsay",
        description: "From train station to impressionist masterpiece collection",
        descriptionNl: "Van treinstation tot collectie impressionistische meesterwerken",
      },
      {
        id: "pompidou",
        name: "Centre Pompidou",
        nameNl: "Centre Pompidou",
        description: "The inside-out building that revolutionized modern art",
        descriptionNl: "Het binnenstebuiten gebouw dat moderne kunst revolutioneerde",
      },
      {
        id: "rodin",
        name: "Rodin Museum",
        nameNl: "Rodin Museum",
        description: "The sculptor's mansion and the story of The Thinker",
        descriptionNl: "Het herenhuis van de beeldhouwer en het verhaal van De Denker",
      },
    ],
  },
  {
    id: "modern-history",
    name: "Modern History",
    nameNl: "Moderne Geschiedenis",
    icon: "history",
    iconFamily: "MaterialIcons",
    color: "#8E44AD",
    topics: [
      {
        id: "wwii-paris",
        name: "Paris during World War II",
        nameNl: "Parijs tijdens de Tweede Wereldoorlog",
        description: "Occupation, resistance, and the fight for liberation",
        descriptionNl: "Bezetting, verzet en de strijd om bevrijding",
      },
      {
        id: "may-1968",
        name: "May 1968 Student Protests",
        nameNl: "De Studentenprotesten van Mei 1968",
        description: "When students and workers nearly toppled the government",
        descriptionNl: "Toen studenten en arbeiders bijna de regering ten val brachten",
      },
      {
        id: "liberation",
        name: "The Liberation of Paris",
        nameNl: "De Bevrijding van Parijs",
        description: "August 1944 and the dramatic fight to free the city",
        descriptionNl: "Augustus 1944 en de dramatische strijd om de stad te bevrijden",
      },
      {
        id: "belle-epoque",
        name: "Paris in the Belle Époque",
        nameNl: "Parijs in de Belle Époque",
        description: "The golden age of art, culture, and Parisian life",
        descriptionNl: "De gouden eeuw van kunst, cultuur en het Parijse leven",
      },
    ],
  },
  {
    id: "neighborhoods",
    name: "Neighborhoods",
    nameNl: "Wijken",
    icon: "map",
    iconFamily: "Feather",
    color: "#27AE60",
    topics: [
      {
        id: "montmartre",
        name: "Montmartre",
        nameNl: "Montmartre",
        description: "The hilltop village of artists, bohemians, and the Sacré-Cœur",
        descriptionNl: "Het bergdorp van kunstenaars, bohemiens en de Sacré-Cœur",
      },
      {
        id: "le-marais",
        name: "Le Marais",
        nameNl: "Le Marais",
        description: "Medieval streets, Jewish heritage, and trendy boutiques",
        descriptionNl: "Middeleeuwse straten, Joods erfgoed en trendy boetieks",
      },
      {
        id: "saint-germain",
        name: "Saint-Germain-des-Prés",
        nameNl: "Saint-Germain-des-Prés",
        description: "The intellectual heart of Paris and its legendary cafés",
        descriptionNl: "Het intellectuele hart van Parijs en zijn legendarische cafés",
      },
      {
        id: "latin-quarter",
        name: "Latin Quarter",
        nameNl: "Quartier Latin",
        description: "The student district with centuries of academic tradition",
        descriptionNl: "De studentenwijk met eeuwen academische traditie",
      },
    ],
  },
];

export const perspectives = [
  {
    id: "historical",
    name: "Historical",
    nameNl: "Historisch",
    description: "Facts, dates, and chronological storytelling",
    descriptionNl: "Feiten, data en chronologisch vertellen",
    icon: "book-open",
  },
  {
    id: "personal",
    name: "Personal Stories",
    nameNl: "Persoonlijke Verhalen",
    description: "Human stories, anecdotes, and personal experiences",
    descriptionNl: "Menselijke verhalen, anekdotes en persoonlijke ervaringen",
    icon: "heart",
  },
  {
    id: "cultural",
    name: "Cultural",
    nameNl: "Cultureel",
    description: "Art, food, lifestyle, and cultural impact",
    descriptionNl: "Kunst, eten, levensstijl en culturele impact",
    icon: "coffee",
  },
  {
    id: "walking-tour",
    name: "Walking Tour",
    nameNl: "Wandeltour",
    description: "As if guiding you through the streets of Paris",
    descriptionNl: "Alsof je door de straten van Parijs wordt geleid",
    icon: "navigation",
  },
];

export const podcastLengths = [
  { id: "short", name: "Short", nameNl: "Kort", duration: "~3 min", words: 400 },
  { id: "medium", name: "Medium", nameNl: "Gemiddeld", duration: "~7 min", words: 900 },
  { id: "long", name: "Long", nameNl: "Lang", duration: "~12 min", words: 1500 },
];
