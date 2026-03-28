export interface Topic {
  id: string;
  name: string;
  nameNl: string;
  nameFr: string;
  nameDe: string;
  nameEs: string;
  description: string;
  descriptionNl: string;
  descriptionFr: string;
  descriptionDe: string;
  descriptionEs: string;
}

export interface Angle {
  id: string;
  name: string;
  nameNl: string;
  nameFr: string;
  nameDe: string;
  nameEs: string;
  description: string;
  descriptionNl: string;
  descriptionFr: string;
  descriptionDe: string;
  descriptionEs: string;
  icon: string;
}

export interface Theme {
  id: string;
  name: string;
  nameNl: string;
  nameFr: string;
  nameDe: string;
  nameEs: string;
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
    nameFr: "Histoire",
    nameDe: "Geschichte",
    nameEs: "Historia",
    icon: "book",
    iconFamily: "Ionicons",
    iconImage: require("@/assets/images/category-history.png"),
    color: "#6B4226",
    topics: [
      {
        id: "founding-lutetia",
        name: "Lutetia: The Birth of Paris",
        nameNl: "Lutetia: De Geboorte van Parijs",
        nameFr: "Lutèce : La Naissance de Paris",
        nameDe: "Lutetia: Die Geburt von Paris",
        nameEs: "Lutecia: El Nacimiento de París",
        description: "How a small Roman settlement on the Seine became one of the world's greatest cities",
        descriptionNl: "Hoe een kleine Romeinse nederzetting aan de Seine uitgroeide tot een van de grootste steden ter wereld",
        descriptionFr: "Comment une petite colonie romaine sur la Seine est devenue l'une des plus grandes villes du monde",
        descriptionDe: "Wie eine kleine römische Siedlung an der Seine zu einer der größten Städte der Welt wurde",
        descriptionEs: "Cómo un pequeño asentamiento romano en el Sena se convirtió en una de las ciudades más grandes del mundo",
      },
      {
        id: "medieval-paris",
        name: "Medieval Paris: Rise of a Capital",
        nameNl: "Middeleeuws Parijs: Opkomst van een Hoofdstad",
        nameFr: "Paris médiéval : L'essor d'une capitale",
        nameDe: "Mittelalterliches Paris: Aufstieg einer Hauptstadt",
        nameEs: "París medieval: El ascenso de una capital",
        description: "From Viking sieges to the building of Notre-Dame, how Paris became the heart of France",
        descriptionNl: "Van Vikingbelegeringen tot de bouw van Notre-Dame, hoe Parijs het hart van Frankrijk werd",
        descriptionFr: "Des sièges vikings à la construction de Notre-Dame, comment Paris est devenu le cœur de la France",
        descriptionDe: "Von Wikingerbelagerungen bis zum Bau von Notre-Dame, wie Paris das Herz Frankreichs wurde",
        descriptionEs: "De los asedios vikingos a la construcción de Notre-Dame, cómo París se convirtió en el corazón de Francia",
      },
      {
        id: "paris-kings",
        name: "City of Kings",
        nameNl: "Stad der Koningen",
        nameFr: "La Cité des Rois",
        nameDe: "Stadt der Könige",
        nameEs: "Ciudad de Reyes",
        description: "The monarchs who shaped Paris from the Capetians to the Sun King's Versailles",
        descriptionNl: "De vorsten die Parijs vormden, van de Capetingen tot de Zonnekoning in Versailles",
        descriptionFr: "Les monarques qui ont façonné Paris, des Capétiens au Versailles du Roi-Soleil",
        descriptionDe: "Die Monarchen, die Paris prägten, von den Kapetingern bis zum Versailles des Sonnenkönigs",
        descriptionEs: "Los monarcas que moldearon París, desde los Capetos hasta el Versalles del Rey Sol",
      },
      {
        id: "haussmann-transformation",
        name: "The Great Transformation",
        nameNl: "De Grote Transformatie",
        nameFr: "La Grande Transformation",
        nameDe: "Die Große Transformation",
        nameEs: "La Gran Transformación",
        description: "How Baron Haussmann demolished medieval Paris and created the city of grand boulevards",
        descriptionNl: "Hoe Baron Haussmann het middeleeuwse Parijs sloopte en de stad van grote boulevards creëerde",
        descriptionFr: "Comment le baron Haussmann a démoli le Paris médiéval et créé la ville des grands boulevards",
        descriptionDe: "Wie Baron Haussmann das mittelalterliche Paris abriss und die Stadt der großen Boulevards schuf",
        descriptionEs: "Cómo el barón Haussmann demolió el París medieval y creó la ciudad de los grandes bulevares",
      },
      {
        id: "paris-catacombs",
        name: "The Paris Catacombs",
        nameNl: "De Catacomben van Parijs",
        nameFr: "Les Catacombes de Paris",
        nameDe: "Die Katakomben von Paris",
        nameEs: "Las Catacumbas de París",
        description: "The underground realm of the dead beneath the streets of Paris",
        descriptionNl: "Het ondergrondse dodenrijk onder de straten van Parijs",
        descriptionFr: "Le royaume souterrain des morts sous les rues de Paris",
        descriptionDe: "Das unterirdische Totenreich unter den Straßen von Paris",
        descriptionEs: "El reino subterráneo de los muertos bajo las calles de París",
      },
      {
        id: "knights-templar",
        name: "The Knights Templar in Paris",
        nameNl: "De Tempeliers in Parijs",
        nameFr: "Les Templiers à Paris",
        nameDe: "Die Tempelritter in Paris",
        nameEs: "Los Templarios en París",
        description: "The mysterious order and their powerful Parisian stronghold in the Marais",
        descriptionNl: "De mysterieuze orde en hun machtige Parijse burcht in de Marais",
        descriptionFr: "L'ordre mystérieux et leur puissante forteresse parisienne dans le Marais",
        descriptionDe: "Der geheimnisvolle Orden und ihre mächtige Pariser Festung im Marais",
        descriptionEs: "La misteriosa orden y su poderosa fortaleza parisina en el Marais",
      },
      {
        id: "plague-years",
        name: "The Plague Years",
        nameNl: "De Pestjaren",
        nameFr: "Les Années de Peste",
        nameDe: "Die Pestjahre",
        nameEs: "Los Años de la Peste",
        description: "How the Black Death ravaged medieval Paris and changed the city forever",
        descriptionNl: "Hoe de Zwarte Dood het middeleeuwse Parijs teisterde en de stad voorgoed veranderde",
        descriptionFr: "Comment la Peste Noire a ravagé le Paris médiéval et changé la ville à jamais",
        descriptionDe: "Wie der Schwarze Tod das mittelalterliche Paris verwüstete und die Stadt für immer veränderte",
        descriptionEs: "Cómo la Peste Negra devastó el París medieval y cambió la ciudad para siempre",
      },
      {
        id: "joan-of-arc",
        name: "Joan of Arc and Paris",
        nameNl: "Jeanne d'Arc en Parijs",
        nameFr: "Jeanne d'Arc et Paris",
        nameDe: "Johanna von Orléans und Paris",
        nameEs: "Juana de Arco y París",
        description: "The warrior saint's failed siege of Paris and the battle for the city",
        descriptionNl: "De mislukte belegering van Parijs door de heilige strijdster en de strijd om de stad",
        descriptionFr: "Le siège raté de Paris par la sainte guerrière et la bataille pour la ville",
        descriptionDe: "Die gescheiterte Belagerung von Paris durch die Heilige Kriegerin und der Kampf um die Stadt",
        descriptionEs: "El fallido asedio de París por la santa guerrera y la batalla por la ciudad",
      },
    ],
  },
  {
    id: "revolution",
    name: "French Revolution",
    nameNl: "Franse Revolutie",
    nameFr: "Révolution française",
    nameDe: "Französische Revolution",
    nameEs: "Revolución Francesa",
    icon: "flag",
    iconFamily: "Ionicons",
    iconImage: require("@/assets/images/category-french-revolution.png"),
    color: "#C0392B",
    angles: [
      {
        id: "historical",
        name: "Historical",
        nameNl: "Historisch",
        nameFr: "Historique",
        nameDe: "Historisch",
        nameEs: "Histórico",
        description: "Facts, dates, and chronological storytelling",
        descriptionNl: "Feiten, data en chronologisch vertellen",
        descriptionFr: "Faits, dates et récit chronologique",
        descriptionDe: "Fakten, Daten und chronologisches Erzählen",
        descriptionEs: "Hechos, fechas y narración cronológica",
        icon: "book-open",
      },
      {
        id: "personal-stories",
        name: "Personal Stories",
        nameNl: "Persoonlijke Verhalen",
        nameFr: "Histoires personnelles",
        nameDe: "Persönliche Geschichten",
        nameEs: "Historias personales",
        description: "The story told from the iconic figures involved",
        descriptionNl: "Het verhaal verteld vanuit de iconische figuren die erbij betrokken waren",
        descriptionFr: "L'histoire racontée du point de vue des personnages emblématiques",
        descriptionDe: "Die Geschichte aus der Perspektive der beteiligten ikonischen Figuren",
        descriptionEs: "La historia contada desde las figuras icónicas involucradas",
        icon: "users",
      },
    ],
    topics: [
      {
        id: "bastille",
        name: "The Storming of the Bastille",
        nameNl: "De Bestorming van de Bastille",
        nameFr: "La Prise de la Bastille",
        nameDe: "Der Sturm auf die Bastille",
        nameEs: "La Toma de la Bastilla",
        description: "The iconic event that sparked the revolution on July 14, 1789",
        descriptionNl: "De iconische gebeurtenis die de revolutie op 14 juli 1789 in gang zette",
        descriptionFr: "L'événement iconique qui a déclenché la révolution le 14 juillet 1789",
        descriptionDe: "Das ikonische Ereignis, das am 14. Juli 1789 die Revolution auslöste",
        descriptionEs: "El evento icónico que desencadenó la revolución el 14 de julio de 1789",
      },
      {
        id: "bastille-walk",
        name: "Walking Tour: Place de la Bastille",
        nameNl: "Wandeltour: Place de la Bastille",
        nameFr: "Visite à pied : Place de la Bastille",
        nameDe: "Rundgang: Place de la Bastille",
        nameEs: "Paseo guiado: Place de la Bastille",
        description: "Walk the grounds where the fortress once stood and trace the revolution's first steps",
        descriptionNl: "Wandel over de plek waar het fort ooit stond en volg de eerste stappen van de revolutie",
        descriptionFr: "Parcourez les lieux où la forteresse se dressait et retracez les premiers pas de la révolution",
        descriptionDe: "Gehen Sie über das Gelände, auf dem einst die Festung stand, und verfolgen Sie die ersten Schritte der Revolution",
        descriptionEs: "Recorre el terreno donde se alzaba la fortaleza y sigue los primeros pasos de la revolución",
      },
      {
        id: "marie-antoinette",
        name: "Marie Antoinette: The Last Queen",
        nameNl: "Marie Antoinette: De Laatste Koningin",
        nameFr: "Marie-Antoinette : La Dernière Reine",
        nameDe: "Marie Antoinette: Die letzte Königin",
        nameEs: "María Antonieta: La Última Reina",
        description: "The tragic queen whose life became a symbol of royal excess",
        descriptionNl: "De tragische koningin wier leven een symbool werd van koninklijke buitensporigheid",
        descriptionFr: "La reine tragique dont la vie est devenue un symbole de l'excès royal",
        descriptionDe: "Die tragische Königin, deren Leben zum Symbol königlicher Verschwendung wurde",
        descriptionEs: "La trágica reina cuya vida se convirtió en símbolo del exceso real",
      },
      {
        id: "danton",
        name: "Danton: Voice of the People",
        nameNl: "Danton: Stem van het Volk",
        nameFr: "Danton : La Voix du Peuple",
        nameDe: "Danton: Stimme des Volkes",
        nameEs: "Danton: La Voz del Pueblo",
        description: "The fiery orator who shaped the revolution and lost his head to it",
        descriptionNl: "De vurige redenaar die de revolutie vormde en er zijn hoofd bij verloor",
        descriptionFr: "L'orateur fougueux qui a façonné la révolution et y a perdu la tête",
        descriptionDe: "Der feurige Redner, der die Revolution formte und dabei seinen Kopf verlor",
        descriptionEs: "El fogoso orador que moldeó la revolución y perdió la cabeza por ella",
      },
      {
        id: "reign-of-terror",
        name: "The Reign of Terror",
        nameNl: "Het Schrikbewind",
        nameFr: "La Terreur",
        nameDe: "Die Schreckensherrschaft",
        nameEs: "El Reinado del Terror",
        description: "The dark period of mass executions under Robespierre",
        descriptionNl: "De donkere periode van massaexecuties onder Robespierre",
        descriptionFr: "La sombre période d'exécutions de masse sous Robespierre",
        descriptionDe: "Die dunkle Zeit der Massenhinrichtungen unter Robespierre",
        descriptionEs: "El oscuro período de ejecuciones masivas bajo Robespierre",
      },
      {
        id: "conciergerie-walk",
        name: "Walking Tour: The Conciergerie",
        nameNl: "Wandeltour: De Conciergerie",
        nameFr: "Visite à pied : La Conciergerie",
        nameDe: "Rundgang: Die Conciergerie",
        nameEs: "Paseo guiado: La Conciergerie",
        description: "Visit the medieval prison where Marie Antoinette spent her final days",
        descriptionNl: "Bezoek de middeleeuwse gevangenis waar Marie Antoinette haar laatste dagen doorbracht",
        descriptionFr: "Visitez la prison médiévale où Marie-Antoinette a passé ses derniers jours",
        descriptionDe: "Besuchen Sie das mittelalterliche Gefängnis, in dem Marie Antoinette ihre letzten Tage verbrachte",
        descriptionEs: "Visita la prisión medieval donde María Antonieta pasó sus últimos días",
      },
      {
        id: "napoleon",
        name: "Napoleon's Rise to Power",
        nameNl: "De Opkomst van Napoleon",
        nameFr: "L'Ascension de Napoléon",
        nameDe: "Napoleons Aufstieg zur Macht",
        nameEs: "El Ascenso de Napoleón al Poder",
        description: "From revolutionary general to Emperor of France",
        descriptionNl: "Van revolutionair generaal tot keizer van Frankrijk",
        descriptionFr: "De général révolutionnaire à empereur de France",
        descriptionDe: "Vom revolutionären General zum Kaiser von Frankreich",
        descriptionEs: "De general revolucionario a emperador de Francia",
      },
      {
        id: "charlotte-corday",
        name: "Charlotte Corday: The Assassin",
        nameNl: "Charlotte Corday: De Moordenares",
        nameFr: "Charlotte Corday : L'Assassine",
        nameDe: "Charlotte Corday: Die Attentäterin",
        nameEs: "Charlotte Corday: La Asesina",
        description: "The young woman who murdered Marat in his bathtub and changed history",
        descriptionNl: "De jonge vrouw die Marat in zijn badkuip vermoordde en de geschiedenis veranderde",
        descriptionFr: "La jeune femme qui a assassiné Marat dans sa baignoire et changé l'histoire",
        descriptionDe: "Die junge Frau, die Marat in seiner Badewanne ermordete und die Geschichte veränderte",
        descriptionEs: "La joven mujer que asesinó a Marat en su bañera y cambió la historia",
      },
    ],
  },
  {
    id: "museums",
    name: "Museums",
    nameNl: "Musea",
    nameFr: "Musées",
    nameDe: "Museen",
    nameEs: "Museos",
    icon: "museum",
    iconFamily: "MaterialIcons",
    iconImage: require("@/assets/images/category-museums.png"),
    color: "#2980B9",
    angles: [
      {
        id: "origin",
        name: "Origin of the Museum",
        nameNl: "Ontstaan van het Museum",
        nameFr: "Origine du Musée",
        nameDe: "Ursprung des Museums",
        nameEs: "Origen del Museo",
        description: "The founding story and how the museum came to be",
        descriptionNl: "Het ontstaansverhaal en hoe het museum tot stand kwam",
        descriptionFr: "L'histoire de sa fondation et comment le musée est né",
        descriptionDe: "Die Gründungsgeschichte und wie das Museum entstand",
        descriptionEs: "La historia de su fundación y cómo nació el museo",
        icon: "clock",
      },
      {
        id: "prominent-art",
        name: "Prominent Art Pieces",
        nameNl: "Prominente Kunstwerken",
        nameFr: "Œuvres d'art emblématiques",
        nameDe: "Bedeutende Kunstwerke",
        nameEs: "Obras de arte destacadas",
        description: "The most famous and significant works in the collection",
        descriptionNl: "De beroemdste en belangrijkste werken in de collectie",
        descriptionFr: "Les œuvres les plus célèbres et les plus importantes de la collection",
        descriptionDe: "Die berühmtesten und bedeutendsten Werke der Sammlung",
        descriptionEs: "Las obras más famosas e importantes de la colección",
        icon: "image",
      },
      {
        id: "architecture",
        name: "Architecture & Building",
        nameNl: "Architectuur & Gebouw",
        nameFr: "Architecture & Bâtiment",
        nameDe: "Architektur & Gebäude",
        nameEs: "Arquitectura & Edificio",
        description: "The architectural story and design of the building itself",
        descriptionNl: "Het architectuurverhaal en het ontwerp van het gebouw zelf",
        descriptionFr: "L'histoire architecturale et le design du bâtiment lui-même",
        descriptionDe: "Die architektonische Geschichte und Gestaltung des Gebäudes selbst",
        descriptionEs: "La historia arquitectónica y el diseño del edificio en sí",
        icon: "home",
      },
    ],
    topics: [
      {
        id: "louvre",
        name: "The Louvre",
        nameNl: "Het Louvre",
        nameFr: "Le Louvre",
        nameDe: "Der Louvre",
        nameEs: "El Louvre",
        description: "The world's largest art museum and its hidden stories",
        descriptionNl: "Het grootste kunstmuseum ter wereld en zijn verborgen verhalen",
        descriptionFr: "Le plus grand musée d'art du monde et ses histoires cachées",
        descriptionDe: "Das größte Kunstmuseum der Welt und seine verborgenen Geschichten",
        descriptionEs: "El museo de arte más grande del mundo y sus historias ocultas",
      },
      {
        id: "orsay",
        name: "Musée d'Orsay",
        nameNl: "Musée d'Orsay",
        nameFr: "Musée d'Orsay",
        nameDe: "Musée d'Orsay",
        nameEs: "Museo de Orsay",
        description: "From train station to impressionist masterpiece collection",
        descriptionNl: "Van treinstation tot collectie impressionistische meesterwerken",
        descriptionFr: "D'une gare à une collection de chefs-d'œuvre impressionnistes",
        descriptionDe: "Vom Bahnhof zur Sammlung impressionistischer Meisterwerke",
        descriptionEs: "De estación de tren a colección de obras maestras impresionistas",
      },
      {
        id: "pompidou",
        name: "Centre Pompidou",
        nameNl: "Centre Pompidou",
        nameFr: "Centre Pompidou",
        nameDe: "Centre Pompidou",
        nameEs: "Centro Pompidou",
        description: "The inside-out building that revolutionized modern art",
        descriptionNl: "Het binnenstebuiten gebouw dat moderne kunst revolutioneerde",
        descriptionFr: "Le bâtiment à l'envers qui a révolutionné l'art moderne",
        descriptionDe: "Das auf links gedrehte Gebäude, das die moderne Kunst revolutionierte",
        descriptionEs: "El edificio al revés que revolucionó el arte moderno",
      },
      {
        id: "orangerie",
        name: "Musée de l'Orangerie",
        nameNl: "Musée de l'Orangerie",
        nameFr: "Musée de l'Orangerie",
        nameDe: "Musée de l'Orangerie",
        nameEs: "Museo de la Orangerie",
        description: "Monet's Water Lilies and the intimate world of impressionism",
        descriptionNl: "Monets Waterlelies en de intieme wereld van het impressionisme",
        descriptionFr: "Les Nymphéas de Monet et le monde intime de l'impressionnisme",
        descriptionDe: "Monets Seerosen und die intime Welt des Impressionismus",
        descriptionEs: "Los Nenúfares de Monet y el mundo íntimo del impresionismo",
      },
      {
        id: "bourse-commerce",
        name: "Bourse de Commerce",
        nameNl: "Bourse de Commerce",
        nameFr: "Bourse de Commerce",
        nameDe: "Bourse de Commerce",
        nameEs: "Bolsa de Comercio",
        description: "Pinault's contemporary art collection in a stunning 18th-century rotunda",
        descriptionNl: "Pinaults hedendaagse kunstcollectie in een prachtige 18e-eeuwse rotonde",
        descriptionFr: "La collection d'art contemporain de Pinault dans une magnifique rotonde du XVIIIe siècle",
        descriptionDe: "Pinaults zeitgenössische Kunstsammlung in einer atemberaubenden Rotunde aus dem 18. Jahrhundert",
        descriptionEs: "La colección de arte contemporáneo de Pinault en una impresionante rotonda del siglo XVIII",
      },
      {
        id: "rodin",
        name: "Rodin Museum",
        nameNl: "Rodin Museum",
        nameFr: "Musée Rodin",
        nameDe: "Rodin-Museum",
        nameEs: "Museo Rodin",
        description: "The sculptor's mansion and the story of The Thinker",
        descriptionNl: "Het herenhuis van de beeldhouwer en het verhaal van De Denker",
        descriptionFr: "Le manoir du sculpteur et l'histoire du Penseur",
        descriptionDe: "Das Herrenhaus des Bildhauers und die Geschichte des Denkers",
        descriptionEs: "La mansión del escultor y la historia de El Pensador",
      },
      {
        id: "fondation-lv",
        name: "Fondation Louis Vuitton",
        nameNl: "Fondation Louis Vuitton",
        nameFr: "Fondation Louis Vuitton",
        nameDe: "Fondation Louis Vuitton",
        nameEs: "Fundación Louis Vuitton",
        description: "Frank Gehry's spectacular glass sails housing world-class contemporary art in the Bois de Boulogne",
        descriptionNl: "Frank Gehry's spectaculaire glazen zeilen met hedendaagse topkunst in het Bois de Boulogne",
        descriptionFr: "Les spectaculaires voiles de verre de Frank Gehry abritant de l'art contemporain de classe mondiale dans le Bois de Boulogne",
        descriptionDe: "Frank Gehrys spektakuläre Glassegel mit zeitgenössischer Weltklasse-Kunst im Bois de Boulogne",
        descriptionEs: "Las espectaculares velas de cristal de Frank Gehry que albergan arte contemporáneo de clase mundial en el Bois de Boulogne",
      },
      {
        id: "musee-carnavalet",
        name: "Musée Carnavalet",
        nameNl: "Musée Carnavalet",
        nameFr: "Musée Carnavalet",
        nameDe: "Musée Carnavalet",
        nameEs: "Museo Carnavalet",
        description: "The oldest museum of Paris telling the city's story from prehistory to present day",
        descriptionNl: "Het oudste museum van Parijs dat het verhaal van de stad vertelt van prehistorie tot heden",
        descriptionFr: "Le plus ancien musée de Paris racontant l'histoire de la ville de la préhistoire à nos jours",
        descriptionDe: "Das älteste Museum von Paris, das die Geschichte der Stadt von der Vorgeschichte bis heute erzählt",
        descriptionEs: "El museo más antiguo de París que cuenta la historia de la ciudad desde la prehistoria hasta hoy",
      },
    ],
  },
  {
    id: "epic-buildings",
    name: "Epic Buildings",
    nameNl: "Iconische Gebouwen",
    nameFr: "Bâtiments emblématiques",
    nameDe: "Ikonische Bauwerke",
    nameEs: "Edificios emblemáticos",
    icon: "business",
    iconFamily: "MaterialIcons",
    iconImage: require("@/assets/images/category-epic-buildings.png"),
    color: "#34495E",
    topics: [
      {
        id: "eiffel-tower",
        name: "The Eiffel Tower",
        nameNl: "De Eiffeltoren",
        nameFr: "La Tour Eiffel",
        nameDe: "Der Eiffelturm",
        nameEs: "La Torre Eiffel",
        description: "From controversial iron eyesore to the world's most beloved landmark",
        descriptionNl: "Van controversieel ijzeren gedrocht tot het meest geliefde monument ter wereld",
        descriptionFr: "De verrue de fer controversée au monument le plus aimé du monde",
        descriptionDe: "Vom umstrittenen Eisenmonstrum zum beliebtesten Wahrzeichen der Welt",
        descriptionEs: "De controvertida monstruosidad de hierro al monumento más querido del mundo",
      },
      {
        id: "notre-dame",
        name: "Notre-Dame Cathedral",
        nameNl: "Kathedraal Notre-Dame",
        nameFr: "Cathédrale Notre-Dame",
        nameDe: "Kathedrale Notre-Dame",
        nameEs: "Catedral de Notre-Dame",
        description: "Eight centuries of faith, fire, and resurrection on the Île de la Cité",
        descriptionNl: "Acht eeuwen geloof, vuur en wederopstanding op het Île de la Cité",
        descriptionFr: "Huit siècles de foi, de feu et de résurrection sur l'Île de la Cité",
        descriptionDe: "Acht Jahrhunderte Glaube, Feuer und Auferstehung auf der Île de la Cité",
        descriptionEs: "Ocho siglos de fe, fuego y resurrección en la Île de la Cité",
      },
      {
        id: "louvre-palace",
        name: "The Louvre Palace",
        nameNl: "Het Paleis van het Louvre",
        nameFr: "Le Palais du Louvre",
        nameDe: "Der Louvre-Palast",
        nameEs: "El Palacio del Louvre",
        description: "From medieval fortress to royal palace to the world's greatest museum",
        descriptionNl: "Van middeleeuws fort tot koninklijk paleis tot het grootste museum ter wereld",
        descriptionFr: "De forteresse médiévale à palais royal, puis au plus grand musée du monde",
        descriptionDe: "Von der mittelalterlichen Festung zum Königspalast zum größten Museum der Welt",
        descriptionEs: "De fortaleza medieval a palacio real y al museo más grande del mundo",
      },
      {
        id: "sacre-coeur",
        name: "Sacré-Cœur Basilica",
        nameNl: "Basiliek Sacré-Cœur",
        nameFr: "Basilique du Sacré-Cœur",
        nameDe: "Basilika Sacré-Cœur",
        nameEs: "Basílica del Sacré-Cœur",
        description: "The white dome on the hilltop and the turbulent history behind it",
        descriptionNl: "De witte koepel op de heuvel en de turbulente geschiedenis erachter",
        descriptionFr: "Le dôme blanc au sommet de la colline et l'histoire tumultueuse qui se cache derrière",
        descriptionDe: "Die weiße Kuppel auf dem Hügel und die turbulente Geschichte dahinter",
        descriptionEs: "La cúpula blanca en la cima de la colina y la turbulenta historia detrás de ella",
      },
      {
        id: "arc-de-triomphe",
        name: "Arc de Triomphe",
        nameNl: "Arc de Triomphe",
        nameFr: "Arc de Triomphe",
        nameDe: "Arc de Triomphe",
        nameEs: "Arco de Triunfo",
        description: "Napoleon's monument to military glory at the heart of the Champs-Élysées",
        descriptionNl: "Napoleons monument voor militaire glorie in het hart van de Champs-Élysées",
        descriptionFr: "Le monument de Napoléon à la gloire militaire au cœur des Champs-Élysées",
        descriptionDe: "Napoleons Denkmal des militärischen Ruhms im Herzen der Champs-Élysées",
        descriptionEs: "El monumento de Napoleón a la gloria militar en el corazón de los Campos Elíseos",
      },
      {
        id: "pantheon",
        name: "The Panthéon",
        nameNl: "Het Panthéon",
        nameFr: "Le Panthéon",
        nameDe: "Das Panthéon",
        nameEs: "El Panteón",
        description: "Where France honors its greatest citizens, from Voltaire to Marie Curie",
        descriptionNl: "Waar Frankrijk zijn grootste burgers eert, van Voltaire tot Marie Curie",
        descriptionFr: "Où la France honore ses plus grands citoyens, de Voltaire à Marie Curie",
        descriptionDe: "Wo Frankreich seine größten Bürger ehrt, von Voltaire bis Marie Curie",
        descriptionEs: "Donde Francia honra a sus más grandes ciudadanos, de Voltaire a Marie Curie",
      },
      {
        id: "opera-garnier",
        name: "Opéra Garnier",
        nameNl: "Opéra Garnier",
        nameFr: "Opéra Garnier",
        nameDe: "Opéra Garnier",
        nameEs: "Ópera Garnier",
        description: "The lavish palace of opera and the legend of the Phantom",
        descriptionNl: "Het weelderige operapaleis en de legende van het Spook",
        descriptionFr: "Le somptueux palais de l'opéra et la légende du Fantôme",
        descriptionDe: "Der prachtvolle Opernpalast und die Legende des Phantoms",
        descriptionEs: "El lujoso palacio de la ópera y la leyenda del Fantasma",
      },
      {
        id: "palace-versailles",
        name: "Palace of Versailles",
        nameNl: "Paleis van Versailles",
        nameFr: "Château de Versailles",
        nameDe: "Schloss Versailles",
        nameEs: "Palacio de Versalles",
        description: "The Sun King's masterpiece of power, excess, and absolute beauty",
        descriptionNl: "Het meesterwerk van de Zonnekoning vol macht, overdaad en absolute schoonheid",
        descriptionFr: "Le chef-d'œuvre du Roi-Soleil, fait de pouvoir, d'excès et de beauté absolue",
        descriptionDe: "Das Meisterwerk des Sonnenkönigs aus Macht, Überfluss und absoluter Schönheit",
        descriptionEs: "La obra maestra del Rey Sol de poder, exceso y belleza absoluta",
      },
    ],
  },
  {
    id: "modern-history",
    name: "Modern History",
    nameNl: "Moderne Geschiedenis",
    nameFr: "Histoire moderne",
    nameDe: "Moderne Geschichte",
    nameEs: "Historia moderna",
    icon: "history",
    iconFamily: "MaterialIcons",
    iconImage: require("@/assets/images/category-modern-history.png"),
    color: "#8E44AD",
    topics: [
      {
        id: "wwii-paris",
        name: "Paris during World War II",
        nameNl: "Parijs tijdens de Tweede Wereldoorlog",
        nameFr: "Paris pendant la Seconde Guerre mondiale",
        nameDe: "Paris während des Zweiten Weltkriegs",
        nameEs: "París durante la Segunda Guerra Mundial",
        description: "Occupation, resistance, and the fight for liberation",
        descriptionNl: "Bezetting, verzet en de strijd om bevrijding",
        descriptionFr: "Occupation, résistance et combat pour la libération",
        descriptionDe: "Besatzung, Widerstand und der Kampf um die Befreiung",
        descriptionEs: "Ocupación, resistencia y la lucha por la liberación",
      },
      {
        id: "liberation",
        name: "The Liberation of Paris",
        nameNl: "De Bevrijding van Parijs",
        nameFr: "La Libération de Paris",
        nameDe: "Die Befreiung von Paris",
        nameEs: "La Liberación de París",
        description: "August 1944 and the dramatic fight to free the city",
        descriptionNl: "Augustus 1944 en de dramatische strijd om de stad te bevrijden",
        descriptionFr: "Août 1944 et le combat dramatique pour libérer la ville",
        descriptionDe: "August 1944 und der dramatische Kampf um die Befreiung der Stadt",
        descriptionEs: "Agosto de 1944 y la dramática lucha por liberar la ciudad",
      },
      {
        id: "resistance-walk",
        name: "Walking Tour: Resistance Paris",
        nameNl: "Wandeltour: Verzets-Parijs",
        nameFr: "Visite à pied : Paris de la Résistance",
        nameDe: "Rundgang: Widerstandsorte in Paris",
        nameEs: "Paseo guiado: París de la Resistencia",
        description: "Walk past secret meeting points, hidden refuges, and memorials of the French Resistance",
        descriptionNl: "Loop langs geheime ontmoetingsplekken, schuilplaatsen en monumenten van het Franse Verzet",
        descriptionFr: "Passez devant les points de rencontre secrets, les refuges cachés et les mémoriaux de la Résistance française",
        descriptionDe: "Gehen Sie vorbei an geheimen Treffpunkten, versteckten Zufluchtsstätten und Gedenkstätten des französischen Widerstands",
        descriptionEs: "Pasa por puntos de encuentro secretos, refugios ocultos y monumentos de la Resistencia francesa",
      },
      {
        id: "jean-moulin",
        name: "Jean Moulin: Hero of the Resistance",
        nameNl: "Jean Moulin: Held van het Verzet",
        nameFr: "Jean Moulin : Héros de la Résistance",
        nameDe: "Jean Moulin: Held des Widerstands",
        nameEs: "Jean Moulin: Héroe de la Resistencia",
        description: "The prefect who unified the French Resistance and paid the ultimate price",
        descriptionNl: "De prefect die het Franse Verzet verenigde en de ultieme prijs betaalde",
        descriptionFr: "Le préfet qui a unifié la Résistance française et en a payé le prix ultime",
        descriptionDe: "Der Präfekt, der den französischen Widerstand vereinte und den höchsten Preis zahlte",
        descriptionEs: "El prefecto que unificó la Resistencia francesa y pagó el precio más alto",
      },
      {
        id: "may-1968",
        name: "May 1968 Student Protests",
        nameNl: "De Studentenprotesten van Mei 1968",
        nameFr: "Les Manifestations étudiantes de Mai 1968",
        nameDe: "Die Studentenproteste vom Mai 1968",
        nameEs: "Las Protestas estudiantiles de Mayo de 1968",
        description: "When students and workers nearly toppled the government",
        descriptionNl: "Toen studenten en arbeiders bijna de regering ten val brachten",
        descriptionFr: "Quand étudiants et travailleurs ont failli renverser le gouvernement",
        descriptionDe: "Als Studenten und Arbeiter fast die Regierung stürzten",
        descriptionEs: "Cuando estudiantes y trabajadores casi derrocaron al gobierno",
      },
      {
        id: "belle-epoque",
        name: "Paris in the Belle Époque",
        nameNl: "Parijs in de Belle Époque",
        nameFr: "Paris à la Belle Époque",
        nameDe: "Paris in der Belle Époque",
        nameEs: "París en la Belle Époque",
        description: "The golden age of art, culture, and Parisian life",
        descriptionNl: "De gouden eeuw van kunst, cultuur en het Parijse leven",
        descriptionFr: "L'âge d'or de l'art, de la culture et de la vie parisienne",
        descriptionDe: "Das goldene Zeitalter der Kunst, Kultur und des Pariser Lebens",
        descriptionEs: "La edad de oro del arte, la cultura y la vida parisina",
      },
      {
        id: "haussmann",
        name: "Haussmann: The Man Who Rebuilt Paris",
        nameNl: "Haussmann: De Man Die Parijs Herbouwde",
        nameFr: "Haussmann : L'Homme qui a reconstruit Paris",
        nameDe: "Haussmann: Der Mann, der Paris neu erbaute",
        nameEs: "Haussmann: El Hombre que reconstruyó París",
        description: "How one prefect demolished medieval Paris and created the city of boulevards",
        descriptionNl: "Hoe één prefect middeleeuws Parijs sloopte en de stad van boulevards creëerde",
        descriptionFr: "Comment un préfet a démoli le Paris médiéval et créé la ville des boulevards",
        descriptionDe: "Wie ein Präfekt das mittelalterliche Paris abriss und die Stadt der Boulevards schuf",
        descriptionEs: "Cómo un prefecto demolió el París medieval y creó la ciudad de los bulevares",
      },
      {
        id: "paris-expo-1900",
        name: "The 1900 World's Fair",
        nameNl: "De Wereldtentoonstelling van 1900",
        nameFr: "L'Exposition universelle de 1900",
        nameDe: "Die Weltausstellung von 1900",
        nameEs: "La Exposición Universal de 1900",
        description: "The grand exposition that showcased Paris as the capital of the modern world",
        descriptionNl: "De grote tentoonstelling die Parijs presenteerde als hoofdstad van de moderne wereld",
        descriptionFr: "La grande exposition qui a présenté Paris comme la capitale du monde moderne",
        descriptionDe: "Die große Ausstellung, die Paris als Hauptstadt der modernen Welt präsentierte",
        descriptionEs: "La gran exposición que presentó a París como la capital del mundo moderno",
      },
    ],
  },
  {
    id: "neighborhoods",
    name: "Neighborhoods",
    nameNl: "Wijken",
    nameFr: "Quartiers",
    nameDe: "Stadtviertel",
    nameEs: "Barrios",
    icon: "map",
    iconFamily: "Feather",
    iconImage: require("@/assets/images/category-neighborhoods.png"),
    color: "#27AE60",
    angles: [
      {
        id: "historical",
        name: "Historical",
        nameNl: "Historisch",
        nameFr: "Historique",
        nameDe: "Historisch",
        nameEs: "Histórico",
        description: "The origins and historical evolution of this neighborhood",
        descriptionNl: "De oorsprong en historische ontwikkeling van deze buurt",
        descriptionFr: "Les origines et l'évolution historique de ce quartier",
        descriptionDe: "Die Ursprünge und die historische Entwicklung dieses Viertels",
        descriptionEs: "Los orígenes y la evolución histórica de este barrio",
        icon: "book-open",
      },
      {
        id: "cultural",
        name: "Cultural",
        nameNl: "Cultureel",
        nameFr: "Culturel",
        nameDe: "Kulturell",
        nameEs: "Cultural",
        description: "Art, food, lifestyle, and cultural significance",
        descriptionNl: "Kunst, eten, levensstijl en culturele betekenis",
        descriptionFr: "Art, gastronomie, mode de vie et importance culturelle",
        descriptionDe: "Kunst, Essen, Lebensstil und kulturelle Bedeutung",
        descriptionEs: "Arte, gastronomía, estilo de vida e importancia cultural",
        icon: "coffee",
      },
      {
        id: "modern-times",
        name: "Modern Times",
        nameNl: "Moderne Tijd",
        nameFr: "Époque moderne",
        nameDe: "Moderne Zeit",
        nameEs: "Tiempos modernos",
        description: "What the neighborhood looks like today and how it has evolved",
        descriptionNl: "Hoe de buurt er vandaag uitziet en hoe deze is geëvolueerd",
        descriptionFr: "À quoi ressemble le quartier aujourd'hui et comment il a évolué",
        descriptionDe: "Wie das Viertel heute aussieht und wie es sich entwickelt hat",
        descriptionEs: "Cómo se ve el barrio hoy y cómo ha evolucionado",
        icon: "trending-up",
      },
      {
        id: "walking-tour",
        name: "Walking Tour",
        nameNl: "Wandeltour",
        nameFr: "Visite à pied",
        nameDe: "Rundgang",
        nameEs: "Paseo guiado",
        description: "A guided walk past the best and most famous places in the area",
        descriptionNl: "Een begeleide wandeling langs de beste en beroemdste plekken in het gebied",
        descriptionFr: "Une promenade guidée devant les meilleurs et les plus célèbres endroits du quartier",
        descriptionDe: "Ein geführter Spaziergang an den besten und berühmtesten Orten der Gegend vorbei",
        descriptionEs: "Un paseo guiado por los mejores y más famosos lugares de la zona",
        icon: "navigation",
      },
    ],
    topics: [
      {
        id: "montmartre",
        name: "Montmartre",
        nameNl: "Montmartre",
        nameFr: "Montmartre",
        nameDe: "Montmartre",
        nameEs: "Montmartre",
        description: "The hilltop village of artists, bohemians, and the Sacré-Cœur",
        descriptionNl: "Het bergdorp van kunstenaars, bohemiens en de Sacré-Cœur",
        descriptionFr: "Le village perché des artistes, des bohèmes et du Sacré-Cœur",
        descriptionDe: "Das Hügeldorf der Künstler, Bohemiens und des Sacré-Cœur",
        descriptionEs: "El pueblo en la colina de artistas, bohemios y el Sacré-Cœur",
      },
      {
        id: "montmartre-walk",
        name: "Walking Tour: Secret Montmartre",
        nameNl: "Wandeltour: Geheim Montmartre",
        nameFr: "Visite à pied : Montmartre secret",
        nameDe: "Rundgang: Das geheime Montmartre",
        nameEs: "Paseo guiado: Montmartre secreto",
        description: "Hidden vineyards, quiet passages, and the streets Renoir and Van Gogh once walked",
        descriptionNl: "Verborgen wijngaarden, stille doorgangen en de straten waar Renoir en Van Gogh ooit liepen",
        descriptionFr: "Vignobles cachés, passages tranquilles et les rues que Renoir et Van Gogh ont arpentées",
        descriptionDe: "Versteckte Weinberge, stille Passagen und die Straßen, auf denen Renoir und Van Gogh einst gingen",
        descriptionEs: "Viñedos escondidos, pasajes tranquilos y las calles que Renoir y Van Gogh recorrieron",
      },
      {
        id: "le-marais",
        name: "Le Marais",
        nameNl: "Le Marais",
        nameFr: "Le Marais",
        nameDe: "Le Marais",
        nameEs: "Le Marais",
        description: "Medieval streets, Jewish heritage, and trendy boutiques",
        descriptionNl: "Middeleeuwse straten, Joods erfgoed en trendy boetieks",
        descriptionFr: "Rues médiévales, patrimoine juif et boutiques tendance",
        descriptionDe: "Mittelalterliche Straßen, jüdisches Erbe und trendige Boutiquen",
        descriptionEs: "Calles medievales, herencia judía y boutiques de moda",
      },
      {
        id: "pigalle",
        name: "Pigalle",
        nameNl: "Pigalle",
        nameFr: "Pigalle",
        nameDe: "Pigalle",
        nameEs: "Pigalle",
        description: "From the Moulin Rouge to SoPi: the neighborhood that never stops reinventing itself",
        descriptionNl: "Van de Moulin Rouge tot SoPi: de buurt die zichzelf nooit stopt met heruitvinden",
        descriptionFr: "Du Moulin Rouge à SoPi : le quartier qui ne cesse de se réinventer",
        descriptionDe: "Vom Moulin Rouge bis SoPi: das Viertel, das sich immer wieder neu erfindet",
        descriptionEs: "Desde el Moulin Rouge hasta SoPi: el barrio que nunca deja de reinventarse",
      },
      {
        id: "saint-germain",
        name: "Saint-Germain-des-Prés",
        nameNl: "Saint-Germain-des-Prés",
        nameFr: "Saint-Germain-des-Prés",
        nameDe: "Saint-Germain-des-Prés",
        nameEs: "Saint-Germain-des-Prés",
        description: "The intellectual heart of Paris and its legendary cafés",
        descriptionNl: "Het intellectuele hart van Parijs en zijn legendarische cafés",
        descriptionFr: "Le cœur intellectuel de Paris et ses cafés légendaires",
        descriptionDe: "Das intellektuelle Herz von Paris und seine legendären Cafés",
        descriptionEs: "El corazón intelectual de París y sus cafés legendarios",
      },
      {
        id: "latin-quarter",
        name: "Latin Quarter",
        nameNl: "Quartier Latin",
        nameFr: "Quartier Latin",
        nameDe: "Quartier Latin",
        nameEs: "Barrio Latino",
        description: "The student district with centuries of academic tradition",
        descriptionNl: "De studentenwijk met eeuwen academische traditie",
        descriptionFr: "Le quartier étudiant avec des siècles de tradition académique",
        descriptionDe: "Das Studentenviertel mit jahrhundertelanger akademischer Tradition",
        descriptionEs: "El barrio estudiantil con siglos de tradición académica",
      },
      {
        id: "belleville",
        name: "Belleville",
        nameNl: "Belleville",
        nameFr: "Belleville",
        nameDe: "Belleville",
        nameEs: "Belleville",
        description: "The multicultural melting pot where Edith Piaf was born",
        descriptionNl: "De multiculturele smeltkroes waar Edith Piaf werd geboren",
        descriptionFr: "Le creuset multiculturel où est née Édith Piaf",
        descriptionDe: "Der multikulturelle Schmelztiegel, in dem Édith Piaf geboren wurde",
        descriptionEs: "El crisol multicultural donde nació Édith Piaf",
      },
      {
        id: "ile-de-la-cite",
        name: "Île de la Cité",
        nameNl: "Île de la Cité",
        nameFr: "Île de la Cité",
        nameDe: "Île de la Cité",
        nameEs: "Île de la Cité",
        description: "The island birthplace of Paris with Notre-Dame and the Sainte-Chapelle",
        descriptionNl: "Het eiland waar Parijs geboren werd, met Notre-Dame en de Sainte-Chapelle",
        descriptionFr: "L'île berceau de Paris avec Notre-Dame et la Sainte-Chapelle",
        descriptionDe: "Die Insel, Geburtsort von Paris, mit Notre-Dame und der Sainte-Chapelle",
        descriptionEs: "La isla cuna de París con Notre-Dame y la Sainte-Chapelle",
      },
    ],
  },
  {
    id: "food-drinks",
    name: "Culinary",
    nameNl: "Culinair",
    nameFr: "Gastronomie",
    nameDe: "Kulinarisch",
    nameEs: "Gastronomía",
    icon: "restaurant",
    iconFamily: "MaterialIcons",
    iconImage: require("@/assets/images/category-culinary.png"),
    color: "#E67E22",
    topics: [
      {
        id: "parisian-bistro",
        name: "The Parisian Bistro",
        nameNl: "Het Parijse Bistro",
        nameFr: "Le Bistro parisien",
        nameDe: "Das Pariser Bistro",
        nameEs: "El Bistró parisino",
        description: "The history and soul of the classic neighborhood bistro",
        descriptionNl: "De geschiedenis en ziel van het klassieke buurtbistro",
        descriptionFr: "L'histoire et l'âme du bistro de quartier classique",
        descriptionDe: "Die Geschichte und Seele des klassischen Nachbarschaftsbistros",
        descriptionEs: "La historia y el alma del clásico bistró de barrio",
      },
      {
        id: "rue-montorgueil-walk",
        name: "Walking Tour: Rue Montorgueil",
        nameNl: "Wandeltour: Rue Montorgueil",
        nameFr: "Visite à pied : Rue Montorgueil",
        nameDe: "Rundgang: Rue Montorgueil",
        nameEs: "Paseo guiado: Rue Montorgueil",
        description: "Past the best fromageries, bakeries, and market stalls of this iconic food street",
        descriptionNl: "Langs de beste kaasboeren, bakkers en marktkraampjes van deze iconische foodstraat",
        descriptionFr: "Devant les meilleures fromageries, boulangeries et étals de marché de cette rue gastronomique iconique",
        descriptionDe: "Vorbei an den besten Käseläden, Bäckereien und Marktständen dieser ikonischen Food-Straße",
        descriptionEs: "Pasando por las mejores queserías, panaderías y puestos del mercado de esta icónica calle gastronómica",
      },
      {
        id: "patisserie",
        name: "French Pastry & Pâtisserie",
        nameNl: "Frans Gebak & Patisserie",
        nameFr: "Pâtisserie française",
        nameDe: "Französisches Gebäck & Pâtisserie",
        nameEs: "Pastelería francesa",
        description: "From croissants to macarons: the art and craft of French pastry",
        descriptionNl: "Van croissants tot macarons: de kunst en het vakmanschap van Frans gebak",
        descriptionFr: "Des croissants aux macarons : l'art et le savoir-faire de la pâtisserie française",
        descriptionDe: "Von Croissants bis Macarons: die Kunst und das Handwerk der französischen Pâtisserie",
        descriptionEs: "De croissants a macarons: el arte y la artesanía de la pastelería francesa",
      },
      {
        id: "wine-bars",
        name: "Wine Bars of Paris",
        nameNl: "Wijnbars van Parijs",
        nameFr: "Les Bars à vins de Paris",
        nameDe: "Weinbars von Paris",
        nameEs: "Bares de vino de París",
        description: "The rise of the natural wine bar and Parisian wine culture",
        descriptionNl: "De opkomst van de natuurlijke wijnbar en de Parijse wijncultuur",
        descriptionFr: "L'essor du bar à vins naturels et la culture vinicole parisienne",
        descriptionDe: "Der Aufstieg der Naturweinbar und die Pariser Weinkultur",
        descriptionEs: "El auge del bar de vinos naturales y la cultura vinícola parisina",
      },
      {
        id: "les-halles",
        name: "Les Halles: The Belly of Paris",
        nameNl: "Les Halles: De Buik van Parijs",
        nameFr: "Les Halles : Le Ventre de Paris",
        nameDe: "Les Halles: Der Bauch von Paris",
        nameEs: "Les Halles: El Vientre de París",
        description: "The legendary market hall that Zola called the belly of Paris",
        descriptionNl: "De legendarische markthal die Zola de buik van Parijs noemde",
        descriptionFr: "La légendaire halle de marché que Zola appelait le ventre de Paris",
        descriptionDe: "Die legendäre Markthalle, die Zola den Bauch von Paris nannte",
        descriptionEs: "El legendario mercado que Zola llamó el vientre de París",
      },
      {
        id: "cafe-culture",
        name: "Café Culture",
        nameNl: "Cafécultuur",
        nameFr: "La Culture du café",
        nameDe: "Cafékultur",
        nameEs: "Cultura de café",
        description: "How the Parisian café shaped French philosophy, art, and revolution",
        descriptionNl: "Hoe het Parijse café de Franse filosofie, kunst en revolutie vormde",
        descriptionFr: "Comment le café parisien a façonné la philosophie, l'art et la révolution française",
        descriptionDe: "Wie das Pariser Café die französische Philosophie, Kunst und Revolution prägte",
        descriptionEs: "Cómo el café parisino moldeó la filosofía, el arte y la revolución francesa",
      },
      {
        id: "julia-child",
        name: "Julia Child's Paris",
        nameNl: "Het Parijs van Julia Child",
        nameFr: "Le Paris de Julia Child",
        nameDe: "Julia Childs Paris",
        nameEs: "El París de Julia Child",
        description: "The American chef who brought French cuisine to the world",
        descriptionNl: "De Amerikaanse kok die de Franse keuken naar de wereld bracht",
        descriptionFr: "La cheffe américaine qui a fait connaître la cuisine française au monde entier",
        descriptionDe: "Die amerikanische Köchin, die die französische Küche in die Welt brachte",
        descriptionEs: "La chef estadounidense que llevó la cocina francesa al mundo",
      },
      {
        id: "street-food-markets",
        name: "Street Food & Markets",
        nameNl: "Straateten & Markten",
        nameFr: "Street food & Marchés",
        nameDe: "Straßenessen & Märkte",
        nameEs: "Comida callejera y mercados",
        description: "From crêpes to falafel: the best street markets and their hidden gems",
        descriptionNl: "Van crêpes tot falafel: de beste straatmarkten en hun verborgen parels",
        descriptionFr: "Des crêpes aux falafels : les meilleurs marchés de rue et leurs trésors cachés",
        descriptionDe: "Von Crêpes bis Falafel: die besten Straßenmärkte und ihre verborgenen Schätze",
        descriptionEs: "De crêpes a falafel: los mejores mercados callejeros y sus joyas ocultas",
      },
    ],
  },
];

export interface PodcastLength {
  id: string;
  name: string;
  nameNl: string;
  nameFr: string;
  nameDe: string;
  nameEs: string;
  duration: string;
  words: number;
}

export const podcastLengths: PodcastLength[] = [
  { id: "short", name: "Short", nameNl: "Kort", nameFr: "Court", nameDe: "Kurz", nameEs: "Corto", duration: "~3 min", words: 400 },
  { id: "long", name: "Long", nameNl: "Lang", nameFr: "Long", nameDe: "Lang", nameEs: "Largo", duration: "~8 min", words: 1100 },
];

import city from "./city";

export interface UserLevel {
  id: string;
  name: string;
  nameNl: string;
  nameFr: string;
  nameDe: string;
  nameEs: string;
  icon: string;
  minPodcasts: number;
  description: string;
  descriptionNl: string;
  descriptionFr: string;
  descriptionDe: string;
  descriptionEs: string;
}

export const userLevels: UserLevel[] = city.userLevels.map((level) => ({
  id: level.id,
  name: level.name.en,
  nameNl: level.name.nl,
  nameFr: level.name.fr,
  nameDe: level.name.de,
  nameEs: level.name.es,
  icon: level.icon,
  minPodcasts: level.minPodcasts,
  description: level.description.en,
  descriptionNl: level.description.nl,
  descriptionFr: level.description.fr,
  descriptionDe: level.description.de,
  descriptionEs: level.description.es,
}));

interface Localizable {
  name: string;
  nameNl: string;
  nameFr: string;
  nameDe: string;
  nameEs: string;
}

interface LocalizableWithDescription extends Localizable {
  description: string;
  descriptionNl: string;
  descriptionFr: string;
  descriptionDe: string;
  descriptionEs: string;
}

export function getLocalizedName(item: Localizable, language: string): string {
  switch (language) {
    case "nl": return item.nameNl;
    case "fr": return item.nameFr;
    case "de": return item.nameDe;
    case "es": return item.nameEs;
    default: return item.name;
  }
}

export function getLocalizedDescription(item: LocalizableWithDescription, language: string): string {
  switch (language) {
    case "nl": return item.descriptionNl;
    case "fr": return item.descriptionFr;
    case "de": return item.descriptionDe;
    case "es": return item.descriptionEs;
    default: return item.description;
  }
}

export function getUserLevel(podcastCount: number): UserLevel {
  for (let i = userLevels.length - 1; i >= 0; i--) {
    if (podcastCount >= userLevels[i].minPodcasts) {
      return userLevels[i];
    }
  }
  return userLevels[0];
}

export function getNextLevel(podcastCount: number): UserLevel | null {
  const currentLevel = getUserLevel(podcastCount);
  const currentIndex = userLevels.indexOf(currentLevel);
  if (currentIndex < userLevels.length - 1) {
    return userLevels[currentIndex + 1];
  }
  return null;
}

export function checkLevelUp(oldCount: number, newCount: number): UserLevel | null {
  const oldLevel = getUserLevel(oldCount);
  const newLevel = getUserLevel(newCount);
  if (newLevel.id !== oldLevel.id) {
    return newLevel;
  }
  return null;
}
