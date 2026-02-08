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
        id: "bastille-walk",
        name: "Walking Tour: Place de la Bastille",
        nameNl: "Wandeltour: Place de la Bastille",
        description: "Walk the grounds where the fortress once stood and trace the revolution's first steps",
        descriptionNl: "Wandel over de plek waar het fort ooit stond en volg de eerste stappen van de revolutie",
      },
      {
        id: "marie-antoinette",
        name: "Marie Antoinette: The Last Queen",
        nameNl: "Marie Antoinette: De Laatste Koningin",
        description: "The tragic queen whose life became a symbol of royal excess",
        descriptionNl: "De tragische koningin wier leven een symbool werd van koninklijke buitensporigheid",
      },
      {
        id: "danton",
        name: "Danton: Voice of the People",
        nameNl: "Danton: Stem van het Volk",
        description: "The fiery orator who shaped the revolution and lost his head to it",
        descriptionNl: "De vurige redenaar die de revolutie vormde en er zijn hoofd bij verloor",
      },
      {
        id: "reign-of-terror",
        name: "The Reign of Terror",
        nameNl: "Het Schrikbewind",
        description: "The dark period of mass executions under Robespierre",
        descriptionNl: "De donkere periode van massaexecuties onder Robespierre",
      },
      {
        id: "conciergerie-walk",
        name: "Walking Tour: The Conciergerie",
        nameNl: "Wandeltour: De Conciergerie",
        description: "Visit the medieval prison where Marie Antoinette spent her final days",
        descriptionNl: "Bezoek de middeleeuwse gevangenis waar Marie Antoinette haar laatste dagen doorbracht",
      },
      {
        id: "napoleon",
        name: "Napoleon's Rise to Power",
        nameNl: "De Opkomst van Napoleon",
        description: "From revolutionary general to Emperor of France",
        descriptionNl: "Van revolutionair generaal tot keizer van Frankrijk",
      },
      {
        id: "charlotte-corday",
        name: "Charlotte Corday: The Assassin",
        nameNl: "Charlotte Corday: De Moordenares",
        description: "The young woman who murdered Marat in his bathtub and changed history",
        descriptionNl: "De jonge vrouw die Marat in zijn badkuip vermoordde en de geschiedenis veranderde",
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
        id: "orangerie",
        name: "Musée de l'Orangerie",
        nameNl: "Musée de l'Orangerie",
        description: "Monet's Water Lilies and the intimate world of impressionism",
        descriptionNl: "Monets Waterlelies en de intieme wereld van het impressionisme",
      },
      {
        id: "bourse-commerce",
        name: "Bourse de Commerce",
        nameNl: "Bourse de Commerce",
        description: "Pinault's contemporary art collection in a stunning 18th-century rotunda",
        descriptionNl: "Pinaults hedendaagse kunstcollectie in een prachtige 18e-eeuwse rotonde",
      },
      {
        id: "rodin",
        name: "Rodin Museum",
        nameNl: "Rodin Museum",
        description: "The sculptor's mansion and the story of The Thinker",
        descriptionNl: "Het herenhuis van de beeldhouwer en het verhaal van De Denker",
      },
      {
        id: "louvre-walk",
        name: "Walking Tour: Louvre to Tuileries",
        nameNl: "Wandeltour: Louvre naar Tuilerieën",
        description: "Stroll from the pyramid through the royal gardens following centuries of art history",
        descriptionNl: "Wandel van de piramide door de koninklijke tuinen langs eeuwen kunstgeschiedenis",
      },
      {
        id: "monet-paris",
        name: "Monet's Paris",
        nameNl: "Het Parijs van Monet",
        description: "Follow the painter's footsteps through the city that inspired his greatest works",
        descriptionNl: "Volg de voetsporen van de schilder door de stad die zijn grootste werken inspireerde",
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
        id: "liberation",
        name: "The Liberation of Paris",
        nameNl: "De Bevrijding van Parijs",
        description: "August 1944 and the dramatic fight to free the city",
        descriptionNl: "Augustus 1944 en de dramatische strijd om de stad te bevrijden",
      },
      {
        id: "resistance-walk",
        name: "Walking Tour: Resistance Paris",
        nameNl: "Wandeltour: Verzets-Parijs",
        description: "Walk past secret meeting points, hidden refuges, and memorials of the French Resistance",
        descriptionNl: "Loop langs geheime ontmoetingsplekken, schuilplaatsen en monumenten van het Franse Verzet",
      },
      {
        id: "jean-moulin",
        name: "Jean Moulin: Hero of the Resistance",
        nameNl: "Jean Moulin: Held van het Verzet",
        description: "The prefect who unified the French Resistance and paid the ultimate price",
        descriptionNl: "De prefect die het Franse Verzet verenigde en de ultieme prijs betaalde",
      },
      {
        id: "may-1968",
        name: "May 1968 Student Protests",
        nameNl: "De Studentenprotesten van Mei 1968",
        description: "When students and workers nearly toppled the government",
        descriptionNl: "Toen studenten en arbeiders bijna de regering ten val brachten",
      },
      {
        id: "belle-epoque",
        name: "Paris in the Belle Époque",
        nameNl: "Parijs in de Belle Époque",
        description: "The golden age of art, culture, and Parisian life",
        descriptionNl: "De gouden eeuw van kunst, cultuur en het Parijse leven",
      },
      {
        id: "eiffel-tower",
        name: "The Eiffel Tower Story",
        nameNl: "Het Verhaal van de Eiffeltoren",
        description: "From controversial construction to the world's most beloved landmark",
        descriptionNl: "Van controversieel bouwwerk tot het meest geliefde monument ter wereld",
      },
      {
        id: "haussmann",
        name: "Haussmann: The Man Who Rebuilt Paris",
        nameNl: "Haussmann: De Man Die Parijs Herbouwde",
        description: "How one prefect demolished medieval Paris and created the city of boulevards",
        descriptionNl: "Hoe één prefect middeleeuws Parijs sloopte en de stad van boulevards creëerde",
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
        id: "montmartre-walk",
        name: "Walking Tour: Secret Montmartre",
        nameNl: "Wandeltour: Geheim Montmartre",
        description: "Hidden vineyards, quiet passages, and the streets Renoir and Van Gogh once walked",
        descriptionNl: "Verborgen wijngaarden, stille doorgangen en de straten waar Renoir en Van Gogh ooit liepen",
      },
      {
        id: "le-marais",
        name: "Le Marais",
        nameNl: "Le Marais",
        description: "Medieval streets, Jewish heritage, and trendy boutiques",
        descriptionNl: "Middeleeuwse straten, Joods erfgoed en trendy boetieks",
      },
      {
        id: "pigalle",
        name: "Pigalle",
        nameNl: "Pigalle",
        description: "From the Moulin Rouge to SoPi: the neighborhood that never stops reinventing itself",
        descriptionNl: "Van de Moulin Rouge tot SoPi: de buurt die zichzelf nooit stopt met heruitvinden",
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
      {
        id: "belleville",
        name: "Belleville",
        nameNl: "Belleville",
        description: "The multicultural melting pot where Edith Piaf was born",
        descriptionNl: "De multiculturele smeltkroes waar Edith Piaf werd geboren",
      },
      {
        id: "ile-de-la-cite",
        name: "Île de la Cité",
        nameNl: "Île de la Cité",
        description: "The island birthplace of Paris with Notre-Dame and the Sainte-Chapelle",
        descriptionNl: "Het eiland waar Parijs geboren werd, met Notre-Dame en de Sainte-Chapelle",
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
