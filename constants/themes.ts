export interface Topic {
  id: string;
  name: string;
  nameNl: string;
  description: string;
  descriptionNl: string;
}

export interface Angle {
  id: string;
  name: string;
  nameNl: string;
  description: string;
  descriptionNl: string;
  icon: string;
}

export interface Theme {
  id: string;
  name: string;
  nameNl: string;
  icon: string;
  iconFamily: "Ionicons" | "MaterialIcons" | "MaterialCommunityIcons" | "Feather";
  iconImage?: any;
  color: string;
  topics: Topic[];
  angles?: Angle[];
}

export const themes: Theme[] = [
  {
    id: "history",
    name: "History",
    nameNl: "Geschiedenis",
    icon: "book",
    iconFamily: "Ionicons",
    iconImage: require("@/assets/images/category-history.png"),
    color: "#6B4226",
    topics: [
      {
        id: "founding-lutetia",
        name: "Lutetia: The Birth of Paris",
        nameNl: "Lutetia: De Geboorte van Parijs",
        description: "How a small Roman settlement on the Seine became one of the world's greatest cities",
        descriptionNl: "Hoe een kleine Romeinse nederzetting aan de Seine uitgroeide tot een van de grootste steden ter wereld",
      },
      {
        id: "medieval-paris",
        name: "Medieval Paris: Rise of a Capital",
        nameNl: "Middeleeuws Parijs: Opkomst van een Hoofdstad",
        description: "From Viking sieges to the building of Notre-Dame, how Paris became the heart of France",
        descriptionNl: "Van Vikingbelegeringen tot de bouw van Notre-Dame, hoe Parijs het hart van Frankrijk werd",
      },
      {
        id: "paris-kings",
        name: "City of Kings",
        nameNl: "Stad der Koningen",
        description: "The monarchs who shaped Paris from the Capetians to the Sun King's Versailles",
        descriptionNl: "De vorsten die Parijs vormden, van de Capetingen tot de Zonnekoning in Versailles",
      },
      {
        id: "haussmann-transformation",
        name: "The Great Transformation",
        nameNl: "De Grote Transformatie",
        description: "How Baron Haussmann demolished medieval Paris and created the city of grand boulevards",
        descriptionNl: "Hoe Baron Haussmann het middeleeuwse Parijs sloopte en de stad van grote boulevards creëerde",
      },
    ],
  },
  {
    id: "revolution",
    name: "French Revolution",
    nameNl: "Franse Revolutie",
    icon: "flag",
    iconFamily: "Ionicons",
    color: "#C0392B",
    angles: [
      {
        id: "historical",
        name: "Historical",
        nameNl: "Historisch",
        description: "Facts, dates, and chronological storytelling",
        descriptionNl: "Feiten, data en chronologisch vertellen",
        icon: "book-open",
      },
      {
        id: "iconic-figures",
        name: "Iconic Figures",
        nameNl: "Iconische Figuren",
        description: "The key personalities who shaped the revolution",
        descriptionNl: "De belangrijkste persoonlijkheden die de revolutie vormden",
        icon: "users",
      },
    ],
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
    angles: [
      {
        id: "origin",
        name: "Origin of the Museum",
        nameNl: "Ontstaan van het Museum",
        description: "The founding story and how the museum came to be",
        descriptionNl: "Het ontstaansverhaal en hoe het museum tot stand kwam",
        icon: "clock",
      },
      {
        id: "prominent-art",
        name: "Prominent Art Pieces",
        nameNl: "Prominente Kunstwerken",
        description: "The most famous and significant works in the collection",
        descriptionNl: "De beroemdste en belangrijkste werken in de collectie",
        icon: "image",
      },
      {
        id: "architecture",
        name: "Architecture & Building",
        nameNl: "Architectuur & Gebouw",
        description: "The architectural story and design of the building itself",
        descriptionNl: "Het architectuurverhaal en het ontwerp van het gebouw zelf",
        icon: "home",
      },
    ],
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
    id: "epic-buildings",
    name: "Epic Buildings",
    nameNl: "Iconische Gebouwen",
    icon: "business",
    iconFamily: "MaterialIcons",
    color: "#34495E",
    topics: [
      {
        id: "eiffel-tower",
        name: "The Eiffel Tower",
        nameNl: "De Eiffeltoren",
        description: "From controversial iron eyesore to the world's most beloved landmark",
        descriptionNl: "Van controversieel ijzeren gedrocht tot het meest geliefde monument ter wereld",
      },
      {
        id: "notre-dame",
        name: "Notre-Dame Cathedral",
        nameNl: "Kathedraal Notre-Dame",
        description: "Eight centuries of faith, fire, and resurrection on the Île de la Cité",
        descriptionNl: "Acht eeuwen geloof, vuur en wederopstanding op het Île de la Cité",
      },
      {
        id: "louvre-palace",
        name: "The Louvre Palace",
        nameNl: "Het Paleis van het Louvre",
        description: "From medieval fortress to royal palace to the world's greatest museum",
        descriptionNl: "Van middeleeuws fort tot koninklijk paleis tot het grootste museum ter wereld",
      },
      {
        id: "sacre-coeur",
        name: "Sacré-Cœur Basilica",
        nameNl: "Basiliek Sacré-Cœur",
        description: "The white dome on the hilltop and the turbulent history behind it",
        descriptionNl: "De witte koepel op de heuvel en de turbulente geschiedenis erachter",
      },
      {
        id: "arc-de-triomphe",
        name: "Arc de Triomphe",
        nameNl: "Arc de Triomphe",
        description: "Napoleon's monument to military glory at the heart of the Champs-Élysées",
        descriptionNl: "Napoleons monument voor militaire glorie in het hart van de Champs-Élysées",
      },
      {
        id: "pantheon",
        name: "The Panthéon",
        nameNl: "Het Panthéon",
        description: "Where France honors its greatest citizens, from Voltaire to Marie Curie",
        descriptionNl: "Waar Frankrijk zijn grootste burgers eert, van Voltaire tot Marie Curie",
      },
      {
        id: "opera-garnier",
        name: "Opéra Garnier",
        nameNl: "Opéra Garnier",
        description: "The lavish palace of opera and the legend of the Phantom",
        descriptionNl: "Het weelderige operapaleis en de legende van het Spook",
      },
      {
        id: "palace-versailles",
        name: "Palace of Versailles",
        nameNl: "Paleis van Versailles",
        description: "The Sun King's masterpiece of power, excess, and absolute beauty",
        descriptionNl: "Het meesterwerk van de Zonnekoning vol macht, overdaad en absolute schoonheid",
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
        id: "haussmann",
        name: "Haussmann: The Man Who Rebuilt Paris",
        nameNl: "Haussmann: De Man Die Parijs Herbouwde",
        description: "How one prefect demolished medieval Paris and created the city of boulevards",
        descriptionNl: "Hoe één prefect middeleeuws Parijs sloopte en de stad van boulevards creëerde",
      },
      {
        id: "paris-expo-1900",
        name: "The 1900 World's Fair",
        nameNl: "De Wereldtentoonstelling van 1900",
        description: "The grand exposition that showcased Paris as the capital of the modern world",
        descriptionNl: "De grote tentoonstelling die Parijs presenteerde als hoofdstad van de moderne wereld",
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
    angles: [
      {
        id: "historical",
        name: "Historical",
        nameNl: "Historisch",
        description: "The origins and historical evolution of this neighborhood",
        descriptionNl: "De oorsprong en historische ontwikkeling van deze buurt",
        icon: "book-open",
      },
      {
        id: "cultural",
        name: "Cultural",
        nameNl: "Cultureel",
        description: "Art, food, lifestyle, and cultural significance",
        descriptionNl: "Kunst, eten, levensstijl en culturele betekenis",
        icon: "coffee",
      },
      {
        id: "modern-times",
        name: "Modern Times",
        nameNl: "Moderne Tijd",
        description: "What the neighborhood looks like today and how it has evolved",
        descriptionNl: "Hoe de buurt er vandaag uitziet en hoe deze is geëvolueerd",
        icon: "trending-up",
      },
      {
        id: "walking-tour",
        name: "Walking Tour",
        nameNl: "Wandeltour",
        description: "A guided walk past the best and most famous places in the area",
        descriptionNl: "Een begeleide wandeling langs de beste en beroemdste plekken in het gebied",
        icon: "navigation",
      },
    ],
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
  {
    id: "food-drinks",
    name: "Food & Drinks",
    nameNl: "Eten & Drinken",
    icon: "restaurant",
    iconFamily: "MaterialIcons",
    color: "#E67E22",
    topics: [
      {
        id: "parisian-bistro",
        name: "The Parisian Bistro",
        nameNl: "Het Parijse Bistro",
        description: "The history and soul of the classic neighborhood bistro",
        descriptionNl: "De geschiedenis en ziel van het klassieke buurtbistro",
      },
      {
        id: "rue-montorgueil-walk",
        name: "Walking Tour: Rue Montorgueil",
        nameNl: "Wandeltour: Rue Montorgueil",
        description: "Past the best fromageries, bakeries, and market stalls of this iconic food street",
        descriptionNl: "Langs de beste kaasboeren, bakkers en marktkraampjes van deze iconische foodstraat",
      },
      {
        id: "patisserie",
        name: "French Pastry & Pâtisserie",
        nameNl: "Frans Gebak & Patisserie",
        description: "From croissants to macarons: the art and craft of French pastry",
        descriptionNl: "Van croissants tot macarons: de kunst en het vakmanschap van Frans gebak",
      },
      {
        id: "wine-bars",
        name: "Wine Bars of Paris",
        nameNl: "Wijnbars van Parijs",
        description: "The rise of the natural wine bar and Parisian wine culture",
        descriptionNl: "De opkomst van de natuurlijke wijnbar en de Parijse wijncultuur",
      },
      {
        id: "les-halles",
        name: "Les Halles: The Belly of Paris",
        nameNl: "Les Halles: De Buik van Parijs",
        description: "The legendary market hall that Zola called the belly of Paris",
        descriptionNl: "De legendarische markthal die Zola de buik van Parijs noemde",
      },
      {
        id: "cafe-culture",
        name: "Café Culture",
        nameNl: "Cafécultuur",
        description: "How the Parisian café shaped French philosophy, art, and revolution",
        descriptionNl: "Hoe het Parijse café de Franse filosofie, kunst en revolutie vormde",
      },
      {
        id: "julia-child",
        name: "Julia Child's Paris",
        nameNl: "Het Parijs van Julia Child",
        description: "The American chef who brought French cuisine to the world",
        descriptionNl: "De Amerikaanse kok die de Franse keuken naar de wereld bracht",
      },
      {
        id: "street-food-markets",
        name: "Street Food & Markets",
        nameNl: "Straateten & Markten",
        description: "From crêpes to falafel: the best street markets and their hidden gems",
        descriptionNl: "Van crêpes tot falafel: de beste straatmarkten en hun verborgen parels",
      },
    ],
  },
];

export const podcastLengths = [
  { id: "short", name: "Short", nameNl: "Kort", duration: "~3 min", words: 400 },
  { id: "long", name: "Long", nameNl: "Lang", duration: "~8 min", words: 1100 },
];
