import type { City } from "@shared/schema";
import type { VoiceType } from "./google-tts";
import { getRoleDescription, getWalkingTourPerspective, getCustomAnglePerspectives, getCityName, getCountryName } from "./city-prompts";

export interface SiblingAngle {
  name: string;
  description: string;
}

export type LangKey = "en" | "nl" | "fr" | "de" | "es";

export function getLanguageKey(language: string): LangKey {
  switch (language) {
    case "nl": return "nl";
    case "fr": return "fr";
    case "de": return "de";
    case "es": return "es";
    default: return "en";
  }
}

function getChirp3Instructions(language: string, _city?: City): string {
  const instructions: Record<string, string> = {
    nl: `

## Schrijfstijl voor spraak (VERPLICHT)
De audio wordt gegenereerd met Google Chirp 3: HD. Schrijf in platte tekst, geen opmaak.

Regels:
1. **Platte tekst:** Schrijf gewone tekst. Gebruik GEEN SSML-tags (\`<speak>\`, \`<break>\`, \`<prosody>\`), GEEN pauze-markers (\`[pause short]\`, \`[pause long]\`), en GEEN emotionele cues (\`[fluisterend]\` etc.).
2. **Geen afkortingen:** Schrijf altijd voluit. Gebruik "het" in plaats van "'t", "er" in plaats van "d'r", "mijn" in plaats van "m'n", "een" in plaats van "'n". Geen samentrekkingen.
3. **Geen stopwoordjes:** Vermijd woorden als "Tja,", "Hè,", "Kijk,", "Hoor je dat?", "Weet je wat?", "Echt waar,". Vertel gewoon het verhaal zonder dit soort vulwoorden.
4. **Geen streepjes of drie puntjes:** Gebruik GEEN liggende streepjes (—), GEEN drie puntjes (...). Gebruik gewone komma's en punten voor ritme en pauzes.
5. **Fonetisch helder:** Schrijf woorden die goed uitspreekbaar zijn voor text-to-speech. Vermijd moeilijke woordcombinaties, tongbrekers en ongebruikelijke leenwoorden. Gebruik eenvoudige, heldere Nederlandse woorden.

BELANGRIJK:
- Schrijf in platte tekst, GEEN SSML-tags, GEEN markers tussen haken.
- Gebruik GEEN markdown-opmaak of koppen.`,

    fr: `

## Style d'ecriture pour la parole (OBLIGATOIRE)
L'audio sera genere avec Google Chirp 3: HD. Ecrivez en texte brut, sans mise en forme.

Regles:
1. **Texte brut:** Ecrivez du texte ordinaire. N'utilisez PAS de balises SSML (\`<speak>\`, \`<break>\`, \`<prosody>\`), PAS de marqueurs de pause (\`[pause short]\`, \`[pause long]\`), et PAS de cues emotionnels (\`[chuchotant]\` etc.).
2. **Pas d'abreviations:** Ecrivez les mots en entier. Pas de contractions familieres.
3. **Pas de mots de remplissage:** Evitez les mots comme "Bon,", "Alors,", "Ecoutez,", "Vous savez,". Racontez simplement l'histoire.
4. **Pas de tirets ou points de suspension:** N'utilisez PAS de tirets longs, de tirets courts ou de points de suspension. Utilisez des virgules et des points.
5. **Phonetiquement clair:** Ecrivez des mots faciles a prononcer pour la synthese vocale. Evitez les combinaisons de mots difficiles.

IMPORTANT:
- Ecrivez en texte brut, PAS de balises SSML, PAS de marqueurs entre crochets.
- N'utilisez PAS de mise en forme markdown ou de titres.`,

    de: `

## Schreibstil fuer Sprache (PFLICHT)
Das Audio wird mit Google Chirp 3: HD generiert. Schreibe in reinem Text, keine Formatierung.

Regeln:
1. **Reiner Text:** Schreibe normalen Text. Verwende KEINE SSML-Tags (\`<speak>\`, \`<break>\`, \`<prosody>\`), KEINE Pausen-Marker (\`[pause short]\`, \`[pause long]\`), und KEINE emotionalen Hinweise (\`[fluestern]\` etc.).
2. **Keine Abkuerzungen:** Schreibe Woerter vollstaendig aus. Keine umgangssprachlichen Verkuerzungen.
3. **Keine Fuellwoerter:** Vermeide Woerter wie "Nun ja,", "Schau mal,", "Weisst du,". Erzaehle einfach die Geschichte.
4. **Keine Gedankenstriche oder Auslassungspunkte:** Verwende KEINE Gedankenstriche oder Auslassungspunkte. Verwende Kommas und Punkte.
5. **Phonetisch klar:** Schreibe Woerter, die fuer die Sprachsynthese leicht auszusprechen sind. Vermeide schwierige Wortkombinationen.

WICHTIG:
- Schreibe in reinem Text, KEINE SSML-Tags, KEINE Marker in Klammern.
- Verwende KEINE Markdown-Formatierung oder Ueberschriften.`,

    es: `

## Estilo de escritura para voz (OBLIGATORIO)
El audio se generara con Google Chirp 3: HD. Escribe en texto plano, sin formato.

Reglas:
1. **Texto plano:** Escribe texto ordinario. NO uses etiquetas SSML (\`<speak>\`, \`<break>\`, \`<prosody>\`), NO uses marcadores de pausa (\`[pause short]\`, \`[pause long]\`), ni indicaciones emocionales (\`[susurrando]\` etc.).
2. **Sin abreviaturas:** Escribe las palabras completas. Sin contracciones coloquiales.
3. **Sin palabras de relleno:** Evita palabras como "Bueno,", "Mira,", "Sabes,", "La verdad,". Simplemente cuenta la historia.
4. **Sin guiones o puntos suspensivos:** NO uses guiones largos, guiones cortos o puntos suspensivos. Usa comas y puntos.
5. **Foneticamente claro:** Escribe palabras faciles de pronunciar para la sintesis de voz. Evita combinaciones de palabras dificiles.

IMPORTANTE:
- Escribe en texto plano, SIN etiquetas SSML, SIN marcadores entre corchetes.
- NO uses formato markdown o encabezados.`,
  };

  return instructions[language] || `

## Writing Style for Speech (MANDATORY)
The audio will be generated with Google Chirp 3: HD. Write in plain text, no formatting.

Rules:
1. **Plain text:** Write ordinary text. Do NOT use SSML tags (\`<speak>\`, \`<break>\`, \`<prosody>\`), NO pause markers (\`[pause short]\`, \`[pause long]\`), and NO emotional cues (\`[whispering]\` etc.).
2. **No abbreviations:** Write words out in full. Use "it is" instead of "it's", "they would" instead of "they'd", "do not" instead of "don't". No contractions.
3. **No filler words:** Avoid words like "Well,", "Look,", "You know what?", "Honestly,". Just tell the story without filler.
4. **No dashes or ellipses:** Do NOT use em dashes, en dashes, or ellipses. Use commas and periods for rhythm and pauses.
5. **Phonetically clear:** Write words that are easy to pronounce for text-to-speech. Avoid difficult word combinations, tongue twisters, and unusual loanwords. Use simple, clear words.

IMPORTANT:
- Write in plain text, NO SSML tags, NO markers in brackets.
- Do NOT use markdown formatting or headings.`;
}

function getSsmlInstructions(language: string, _city?: City): string {
  const ssmlTags = `
- \`<break time="300ms"/>\` to \`<break time="800ms"/>\`
- \`<prosody rate="90%">...</prosody>\`
- \`<prosody rate="105%">...</prosody>\`
- \`<emphasis level="strong">...</emphasis>\``;

  const instructions: Record<string, string> = {
    nl: `

## SSML-opmaak (VERPLICHT)
De audio wordt gegenereerd met Google Neural2. Je MOET het volledige script in SSML-formaat schrijven om natuurlijke spraak te bereiken.

Omsluit het hele script met \`<speak>\` tags. Gebruik deze SSML-tags door het hele script:
${ssmlTags}

Schrijfregels voor SSML-scripts:
- Schrijf altijd voluit, geen afkortingen: "het" in plaats van "'t", "er" in plaats van "d'r", "mijn" in plaats van "m'n".
- Gebruik GEEN liggende streepjes of drie puntjes. Gebruik komma's, punten en break-tags voor pauzes.
- Schrijf fonetisch helder: vermijd moeilijke woordcombinaties en tongbrekers.

Voorbeeld van correcte output:
<speak>De regen valt op de kasseien. <break time="400ms"/> En daar, om de hoek, <prosody rate="90%">zie je het licht van een klein cafe.</prosody> <break time="300ms"/> <emphasis level="strong">Dit</emphasis> is de stad dat de meeste toeristen nooit zien.</speak>

BELANGRIJK:
- Het HELE script moet binnen \`<speak>\` en \`</speak>\` tags staan.
- Gebruik GEEN markdown-opmaak of koppen in het SSML-script.
- Elke alinea moet zelfstandig zijn qua SSML-tags: open en sluit tags als \`<prosody>\` en \`<emphasis>\` altijd binnen dezelfde alinea. Laat tags NOOIT doorlopen over meerdere alinea's.
- Gebruik ALLEEN de tags uit de bovenstaande lijst (\`<break>\`, \`<prosody>\`, \`<emphasis>\`). Geen andere SSML-tags.`,

    fr: `

## Mise en forme SSML (OBLIGATOIRE)
L'audio sera genere avec Google Neural2. Vous DEVEZ ecrire le script entier en format SSML pour obtenir une parole naturelle.

Enveloppez le script entier dans des balises \`<speak>\`. Utilisez ces balises SSML dans tout le script:
${ssmlTags}

Regles d'ecriture pour les scripts SSML:
- Ecrivez les mots en entier, pas d'abreviations ni de contractions familieres.
- N'utilisez PAS de tirets longs ou de points de suspension. Utilisez des virgules, des points et des balises break pour les pauses.
- Ecrivez un texte phonetiquement clair: evitez les combinaisons de mots difficiles.

IMPORTANT:
- Le script ENTIER doit etre dans les balises \`<speak>\` et \`</speak>\`.
- N'utilisez PAS de mise en forme markdown ou de titres dans le script SSML.
- Chaque paragraphe doit etre autonome pour les balises SSML: ouvrez et fermez toujours les balises dans le meme paragraphe.
- Utilisez UNIQUEMENT les balises listees ci-dessus.`,

    de: `

## SSML-Formatierung (PFLICHT)
Das Audio wird mit Google Neural2 generiert. Du MUSST das gesamte Skript im SSML-Format schreiben, um natuerliche Sprache zu erreichen.

Umschliesse das gesamte Skript mit \`<speak>\`-Tags. Verwende diese SSML-Tags im gesamten Skript:
${ssmlTags}

Schreibregeln fuer SSML-Skripte:
- Schreibe Woerter vollstaendig aus, keine Abkuerzungen oder umgangssprachliche Verkuerzungen.
- Verwende KEINE Gedankenstriche oder Auslassungspunkte. Verwende Kommas, Punkte und Break-Tags fuer Pausen.
- Schreibe phonetisch klaren Text: vermeide schwierige Wortkombinationen und Zungenbrecher.

WICHTIG:
- Das GESAMTE Skript muss innerhalb von \`<speak>\`- und \`</speak>\`-Tags stehen.
- Verwende KEINE Markdown-Formatierung oder Ueberschriften im SSML-Skript.
- Jeder Absatz muss fuer SSML-Tags eigenstaendig sein: oeffne und schliesse Tags immer innerhalb desselben Absatzes.
- Verwende NUR die oben aufgelisteten Tags.`,

    es: `

## Formato SSML (OBLIGATORIO)
El audio se generara con Google Neural2. DEBES escribir el script completo en formato SSML para lograr un habla natural.

Envuelve el script completo en etiquetas \`<speak>\`. Usa estas etiquetas SSML en todo el script:
${ssmlTags}

Reglas de escritura para scripts SSML:
- Escribe las palabras completas, sin abreviaturas ni contracciones coloquiales.
- NO uses guiones largos o puntos suspensivos. Usa comas, puntos y etiquetas break para las pausas.
- Escribe texto foneticamente claro: evita combinaciones de palabras dificiles y trabalenguas.

IMPORTANTE:
- El script COMPLETO debe estar dentro de las etiquetas \`<speak>\` y \`</speak>\`.
- NO uses formato markdown o encabezados dentro del script SSML.
- Cada parrafo debe ser autonomo para las etiquetas SSML: siempre abre y cierra las etiquetas dentro del mismo parrafo.
- Usa SOLO las etiquetas listadas arriba.`,
  };

  return instructions[language] || `

## SSML Formatting (MANDATORY)
The audio will be generated with Google Neural2. You MUST write the entire script in SSML format to achieve natural speech.

Wrap the entire script in \`<speak>\` tags. Use these SSML tags throughout the script:
${ssmlTags}

Writing rules for SSML scripts:
- Write words out in full, no abbreviations: "it is" instead of "it's", "do not" instead of "don't".
- Do NOT use em dashes or ellipses. Use commas, periods, and break tags for pauses.
- Write phonetically clear text: avoid difficult word combinations and tongue twisters.

Example of correct output:
<speak>Rain falls on the cobblestones. <break time="400ms"/> And there, around the corner, <prosody rate="90%">you see the light of a small cafe.</prosody> <break time="300ms"/> <emphasis level="strong">This</emphasis> is the city most tourists never see.</speak>

IMPORTANT:
- The ENTIRE script must be within \`<speak>\` and \`</speak>\` tags.
- Do NOT use markdown formatting or headings inside the SSML script.
- Each paragraph must be self-contained for SSML tags: always open and close tags like \`<prosody>\` and \`<emphasis>\` within the same paragraph. NEVER let tags span across multiple paragraphs.
- Use ONLY the tags listed above (\`<break>\`, \`<prosody>\`, \`<emphasis>\`). No other SSML tags.`;
}

export function stripSsmlTags(text: string): string {
  let clean = text.replace(/<[^>]+>/g, "");
  clean = clean.replace(/\n{3,}/g, "\n\n");
  clean = clean.replace(/ {2,}/g, " ");
  return clean.trim();
}

export function getGoogleTtsInstructions(language: string, voiceType: VoiceType, city?: City): string {
  if (voiceType === "chirp3") {
    return getChirp3Instructions(language, city);
  }
  return getSsmlInstructions(language, city);
}

export function getSiblingAngles(topicId: string | undefined, currentPerspective: string, language: string, city?: City): SiblingAngle[] {
  if (!topicId || !currentPerspective) return [];
  const topicThemeMap = city?.topicThemeMap;
  if (!topicThemeMap) return [];
  const themeId = topicThemeMap[topicId];
  if (!themeId) return [];
  const themeAngles = city?.themeAngles;
  if (!themeAngles) return [];
  const angles = themeAngles[themeId];
  if (!angles) return [];
  const langKey = getLanguageKey(language);
  return angles
    .filter(a => a.id !== currentPerspective)
    .map(a => ({ name: a.names[langKey] || a.names.en, description: a.descriptions[langKey] || a.descriptions.en }));
}

export function buildFocusGuidance(siblingAngles: SiblingAngle[], language: string): string {
  if (siblingAngles.length === 0) return "";
  const langKey = getLanguageKey(language);
  const angleList = siblingAngles.map(a => `- "${a.name}": ${a.description}`).join("\n");
  const templates: Record<string, string> = {
    nl: `\n\n## Focusbegeleiding
Er bestaan aparte afleveringen over dit onderwerp vanuit andere invalshoeken:
${angleList}
Omdat de luisteraar die apart kan beluisteren, hoef je daar niet uitgebreid over te praten. Noem deze onderwerpen alleen kort als het echt relevant is voor jouw verhaal, maar besteed er geen grote passages aan.`,
    fr: `\n\n## Guide de focus
Il existe des épisodes séparés sur ce sujet avec d'autres perspectives :
${angleList}
Comme l'auditeur peut les écouter séparément, ne vous attardez pas sur ces sujets. Mentionnez-les brièvement uniquement si c'est vraiment pertinent pour votre récit, mais n'y consacrez pas de longs passages.`,
    de: `\n\n## Fokus-Leitfaden
Es gibt separate Folgen zu diesem Thema aus anderen Blickwinkeln:
${angleList}
Da der Zuhörer diese separat anhören kann, musst du darauf nicht ausführlich eingehen. Erwähne diese Themen nur kurz, wenn es wirklich relevant für deine Geschichte ist, aber widme ihnen keine langen Abschnitte.`,
    es: `\n\n## Guía de enfoque
Existen episodios separados sobre este tema desde otras perspectivas:
${angleList}
Como el oyente puede escucharlos por separado, no necesitas hablar extensamente sobre ellos. Menciona estos temas solo brevemente si es realmente relevante para tu historia, pero no les dediques pasajes largos.`,
    en: `\n\n## Focus Guidance
There are separate episodes about this topic from other perspectives:
${angleList}
Since the listener can listen to those separately, do not spend much time on those areas. Only mention them briefly if truly relevant to your story, but do not dedicate long passages to them.`,
  };
  return templates[langKey] || templates.en;
}

const curatedPerspectiveMap: Record<string, Record<string, string>> = {
  historical: {
    en: "Use a factual, chronological storytelling approach. Include specific dates, names, and historical context. Weave the facts into a compelling narrative rather than a dry summary.",
    nl: "Gebruik een feitelijke, chronologische vertelbenadering. Neem specifieke data, namen en historische context op. Weef de feiten in een meeslepend verhaal, geen droge samenvatting.",
    fr: "Utilisez une approche narrative factuelle et chronologique. Incluez des dates, des noms et un contexte historique precis. Tissez les faits dans un recit captivant plutot qu'un resume sec.",
    de: "Verwende einen faktenbasierten, chronologischen Erzaehlansatz. Nenne konkrete Daten, Namen und historischen Kontext. Verwebe die Fakten zu einer fesselnden Erzaehlung statt einer trockenen Zusammenfassung.",
    es: "Utiliza un enfoque narrativo factual y cronologico. Incluye fechas, nombres y contexto historico especificos. Teje los hechos en una narrativa cautivadora en lugar de un resumen seco.",
  },
  "personal-stories": {
    en: "Focus on the key personalities and iconic figures central to this story. Bring them to life with vivid character details, their motivations, rivalries, and the human drama behind the events.",
    nl: "Focus op de belangrijkste persoonlijkheden en iconische figuren in dit verhaal. Breng ze tot leven met levendige karakterdetails, hun motivaties, rivaliteiten en het menselijke drama achter de gebeurtenissen.",
    fr: "Concentrez-vous sur les personnalites cles et les figures emblematiques au coeur de cette histoire. Donnez-leur vie avec des details de caractere saisissants, leurs motivations, rivalites et le drame humain derriere les evenements.",
    de: "Konzentriere dich auf die Schluesselpersoenlichkeiten und ikonischen Figuren dieser Geschichte. Erwecke sie zum Leben mit lebhaften Charakterdetails, ihren Motivationen, Rivalitaeten und dem menschlichen Drama hinter den Ereignissen.",
    es: "Concentrate en las personalidades clave y las figuras iconicas centrales de esta historia. Dalas vida con detalles vividos de sus caracteres, sus motivaciones, rivalidades y el drama humano detras de los eventos.",
  },
  origin: {
    en: "Tell the founding story of this place or museum. How did it come to be? What vision drove its creation? Cover the key moments from its origins to what it is today.",
    nl: "Vertel het ontstaansverhaal van deze plek of dit museum. Hoe is het tot stand gekomen? Welke visie dreef de oprichting? Behandel de belangrijkste momenten van het ontstaan tot wat het nu is.",
    fr: "Racontez l'histoire de la fondation de ce lieu ou de ce musee. Comment est-il ne? Quelle vision a guide sa creation? Couvrez les moments cles de ses origines a ce qu'il est aujourd'hui.",
    de: "Erzaehle die Gruendungsgeschichte dieses Ortes oder Museums. Wie ist er entstanden? Welche Vision trieb seine Gruendung an? Behandle die wichtigsten Momente von den Anfaengen bis heute.",
    es: "Cuenta la historia de la fundacion de este lugar o museo. Como llego a existir? Que vision impulso su creacion? Cubre los momentos clave desde sus origenes hasta lo que es hoy.",
  },
  "prominent-art": {
    en: "Focus on the most famous and significant artworks in the collection. Tell the stories behind the masterpieces, who created them, why, and what makes them extraordinary.",
    nl: "Focus op de beroemdste en belangrijkste kunstwerken in de collectie. Vertel de verhalen achter de meesterwerken, wie ze maakte, waarom, en wat ze buitengewoon maakt.",
    fr: "Concentrez-vous sur les oeuvres d'art les plus celebres et les plus importantes de la collection. Racontez les histoires derriere les chefs-d'oeuvre, qui les a crees, pourquoi, et ce qui les rend extraordinaires.",
    de: "Konzentriere dich auf die beruehmtesten und bedeutendsten Kunstwerke der Sammlung. Erzaehle die Geschichten hinter den Meisterwerken, wer sie geschaffen hat, warum, und was sie aussergewoehnlich macht.",
    es: "Concentrate en las obras de arte mas famosas e importantes de la coleccion. Cuenta las historias detras de las obras maestras, quien las creo, por que y que las hace extraordinarias.",
  },
  architecture: {
    en: "Focus on the architecture and the building itself. Describe its design, the architect's vision, the construction story, and the architectural details that make it remarkable.",
    nl: "Focus op de architectuur en het gebouw zelf. Beschrijf het ontwerp, de visie van de architect, het bouwverhaal en de architectonische details die het bijzonder maken.",
    fr: "Concentrez-vous sur l'architecture et le batiment lui-meme. Decrivez sa conception, la vision de l'architecte, l'histoire de la construction et les details architecturaux qui le rendent remarquable.",
    de: "Konzentriere dich auf die Architektur und das Gebaeude selbst. Beschreibe das Design, die Vision des Architekten, die Baugeschichte und die architektonischen Details, die es bemerkenswert machen.",
    es: "Concentrate en la arquitectura y el edificio en si. Describe su diseno, la vision del arquitecto, la historia de la construccion y los detalles arquitectonicos que lo hacen notable.",
  },
  cultural: {
    en: "Focus on art, food, lifestyle, and cultural significance. Explore how culture shaped and was shaped by this topic.",
    nl: "Focus op kunst, eten, levensstijl en culturele betekenis. Verken hoe cultuur dit onderwerp vormde en erdoor werd gevormd.",
    fr: "Concentrez-vous sur l'art, la gastronomie, le mode de vie et la signification culturelle. Explorez comment la culture a faconne et a ete faconnee par ce sujet.",
    de: "Konzentriere dich auf Kunst, Essen, Lebensstil und kulturelle Bedeutung. Erkunde, wie Kultur dieses Thema geformt hat und davon geformt wurde.",
    es: "Concentrate en el arte, la gastronomia, el estilo de vida y la importancia cultural. Explora como la cultura moldeo y fue moldeada por este tema.",
  },
  "modern-times": {
    en: "Tell the story of how this place looks and feels today. What has changed in recent decades? How does modern life play out here? Capture the contemporary atmosphere.",
    nl: "Vertel het verhaal van hoe deze plek er vandaag uitziet en aanvoelt. Wat is er de afgelopen decennia veranderd? Hoe speelt het moderne leven zich hier af? Vang de hedendaagse sfeer.",
    fr: "Racontez l'histoire de ce lieu tel qu'il est aujourd'hui. Qu'est-ce qui a change ces dernieres decennies? Comment la vie moderne s'y deroule-t-elle? Capturez l'atmosphere contemporaine.",
    de: "Erzaehle die Geschichte, wie dieser Ort heute aussieht und sich anfuehlt. Was hat sich in den letzten Jahrzehnten veraendert? Wie spielt sich das moderne Leben hier ab? Fange die zeitgenoessische Atmosphaere ein.",
    es: "Cuenta la historia de como se ve y se siente este lugar hoy. Que ha cambiado en las ultimas decadas? Como se desarrolla la vida moderna aqui? Captura la atmosfera contemporanea.",
  },
};

const defaultStyle: Record<string, string> = {
  en: "Tell an engaging, well-rounded story covering the most interesting aspects of this topic.",
  nl: "Vertel een boeiend, veelzijdig verhaal dat de meest interessante aspecten van dit onderwerp behandelt.",
  fr: "Racontez une histoire captivante et complete couvrant les aspects les plus interessants de ce sujet.",
  de: "Erzaehle eine fesselnde, vielseitige Geschichte, die die interessantesten Aspekte dieses Themas behandelt.",
  es: "Cuenta una historia cautivadora y completa que cubra los aspectos mas interesantes de este tema.",
};

export const CUSTOM_ANGLE_IDS = ["historical", "modern-culture", "personal-stories"] as const;

export const customAngleMap: Record<string, Record<string, string>> = {
  historical: curatedPerspectiveMap.historical,
  "modern-culture": {},
  "personal-stories": {
    en: "Tell personal, intimate stories. Use anecdotes, first-person perspectives, and emotional storytelling to bring this topic to life through the eyes of real people.",
    nl: "Vertel persoonlijke, intieme verhalen. Gebruik anekdotes, eerstepersoonperspectieven en emotioneel vertellen om dit onderwerp tot leven te brengen door de ogen van echte mensen.",
    fr: "Racontez des histoires personnelles et intimes. Utilisez des anecdotes, des perspectives a la premiere personne et une narration emotionnelle pour donner vie a ce sujet a travers les yeux de vraies personnes.",
    de: "Erzaehle persoenliche, intime Geschichten. Verwende Anekdoten, Ich-Perspektiven und emotionales Erzaehlen, um dieses Thema durch die Augen echter Menschen zum Leben zu erwecken.",
    es: "Cuenta historias personales e intimas. Usa anecdotas, perspectivas en primera persona y narracion emocional para dar vida a este tema a traves de los ojos de personas reales.",
  },
};

export const customAngleNames: Record<string, Record<string, string>> = {
  historical: { en: "Historical", nl: "Historisch", fr: "Historique", de: "Historisch", es: "Histórico" },
  "modern-culture": { en: "Modern Culture", nl: "Hedendaagse Cultuur", fr: "Culture moderne", de: "Moderne Kultur", es: "Cultura moderna" },
  "personal-stories": { en: "Personal Stories", nl: "Persoonlijke Verhalen", fr: "Histoires personnelles", de: "Persönliche Geschichten", es: "Historias personales" },
};

export const customAngleDescriptions: Record<string, Record<string, string>> = {
  historical: { en: "Facts, dates, and chronological storytelling", nl: "Feiten, data en chronologisch vertellen", fr: "Faits, dates et récit chronologique", de: "Fakten, Daten und chronologisches Erzählen", es: "Hechos, fechas y narración cronológica" },
  "modern-culture": { en: "Contemporary culture, modern-day significance, and current trends", nl: "Hedendaagse cultuur, moderne betekenis en huidige trends", fr: "Culture contemporaine, signification moderne et tendances actuelles", de: "Zeitgenössische Kultur, moderne Bedeutung und aktuelle Trends", es: "Cultura contemporánea, importancia moderna y tendencias actuales" },
  "personal-stories": { en: "Personal, intimate stories through the eyes of real people", nl: "Persoonlijke, intieme verhalen door de ogen van echte mensen", fr: "Histoires personnelles et intimes à travers les yeux de vraies personnes", de: "Persönliche, intime Geschichten durch die Augen echter Menschen", es: "Historias personales e íntimas a través de los ojos de personas reales" },
};

export function getCustomSiblingAngles(currentAngle: string, language: string): SiblingAngle[] {
  const langKey = getLanguageKey(language);
  return CUSTOM_ANGLE_IDS
    .filter(a => a !== currentAngle)
    .map(a => ({
      name: customAngleNames[a]?.[langKey] || customAngleNames[a]?.en || a,
      description: customAngleDescriptions[a]?.[langKey] || customAngleDescriptions[a]?.en || "",
    }));
}

export function resolvePerspectiveText(perspective: string, langKey: string, city?: City): string {
  if (perspective === "walking-tour" && city) {
    const walkingTour = getWalkingTourPerspective(city);
    return walkingTour[langKey] || walkingTour.en || defaultStyle[langKey];
  }
  if (!perspective) return defaultStyle[langKey];
  if (city?.perspectivePrompts?.[perspective]?.[langKey]) {
    return city.perspectivePrompts[perspective][langKey];
  }
  return curatedPerspectiveMap[perspective]?.[langKey] || defaultStyle[langKey];
}

export function resolveCustomPerspectiveText(angle: string, langKey: string, city?: City): string {
  if (angle === "modern-culture" && city) {
    const modernCulture = getCustomAnglePerspectives(city)["modern-culture"];
    return modernCulture?.[langKey] || modernCulture?.en || defaultStyle[langKey];
  }
  return customAngleMap[angle]?.[langKey] || customAngleMap["historical"][langKey] || customAngleMap["historical"]["en"];
}

export function getSystemPrompt(params: {
  language: string;
  perspectiveText: string;
  wordCount: number;
  googleVoiceType?: VoiceType;
  siblingAngles?: SiblingAngle[];
  city?: City;
}): string {
  const { language, perspectiveText, wordCount, googleVoiceType, siblingAngles, city } = params;
  const langKey = getLanguageKey(language);

  const roles = city ? getRoleDescription(city, langKey) : { nl: "", fr: "", de: "", es: "", en: "" };

  const cityConstraint: Record<string, string> = city ? {
    nl: `\n\n## Locatie\nDeze podcast gaat UITSLUITEND over ${getCityName(city, "nl")}, ${getCountryName(city, "nl")}. Alle feiten, locaties en verhalen moeten betrekking hebben op ${getCityName(city, "nl")}. Verwijs NIET naar plaatsen in andere steden.`,
    fr: `\n\n## Localisation\nCe podcast concerne EXCLUSIVEMENT ${getCityName(city, "fr")}, ${getCountryName(city, "fr")}. Tous les faits, lieux et histoires doivent se rapporter a ${getCityName(city, "fr")}. Ne faites PAS reference a des lieux d'autres villes.`,
    de: `\n\n## Standort\nDieser Podcast handelt AUSSCHLIESSLICH von ${getCityName(city, "de")}, ${getCountryName(city, "de")}. Alle Fakten, Orte und Geschichten muessen sich auf ${getCityName(city, "de")} beziehen. Verweisen Sie NICHT auf Orte in anderen Staedten.`,
    es: `\n\n## Ubicacion\nEste podcast es EXCLUSIVAMENTE sobre ${getCityName(city, "es")}, ${getCountryName(city, "es")}. Todos los hechos, lugares e historias deben estar relacionados con ${getCityName(city, "es")}. NO hagas referencia a lugares de otras ciudades.`,
    en: `\n\n## Location\nThis podcast is EXCLUSIVELY about ${getCityName(city, "en")}, ${getCountryName(city, "en")}. All facts, locations, and stories must relate to ${getCityName(city, "en")}. Do NOT reference places in other cities.`,
  } : { nl: "", fr: "", de: "", es: "", en: "" };

  const prompts: Record<string, string> = {
    nl: `## Jouw Rol
${roles.nl}${cityConstraint.nl}

## Perspectief
${perspectiveText}

## Toon
Houd de toon informatief en nuchter, met af en toe een persoonlijke noot. Vermijd overdreven dramatiek, poetische overdrijvingen en theatrale effecten. Wees eerder een goede vriend die iets interessants vertelt dan een acteur die een rol speelt. Laat de feiten voor zich spreken.

## Audio-optimalisatie (voor TTS)
Om natuurlijk te klinken, hanteer je deze regels:
1. **Geen afkortingen:** Schrijf altijd voluit. Gebruik "het" in plaats van "'t", "er" in plaats van "d'r", "mijn" in plaats van "m'n", "een" in plaats van "'n". Geen samentrekkingen.
2. **Geen streepjes of drie puntjes:** Gebruik GEEN liggende streepjes (—), GEEN drie puntjes (...). Gebruik gewone komma's en punten voor ritme en pauzes.
3. **Geen stopwoordjes:** Vermijd vulwoorden als "Tja,", "Kijk,", "Hè,", "Hoor je dat?", "Weet je wat?", "Echt waar,". Vertel gewoon het verhaal zonder dit soort opvulling.
4. **Zinsopbouw:** Wissel korte en langere zinnen af. Vermijd ingewikkelde bijzinnen.
5. **Fonetisch helder:** Schrijf woorden die goed uitspreekbaar zijn voor text-to-speech. Vermijd moeilijke woordcombinaties, tongbrekers en ongebruikelijke leenwoorden. Gebruik eenvoudige, heldere Nederlandse woorden.
6. **Concreet:** Noem specifieke namen, data, adressen en feiten. Dat maakt het verhaal geloofwaardig en informatief.

## Schrijfregels
- GEEN titels, GEEN koppen, GEEN markdown (#), GEEN aankondigingsregel zoals "De Oude Kerk" of "Het Vondelpark" bovenaan het script. De eerste zin IS het verhaal.
- GEEN "Welkom bij...", GEEN introductie van jezelf.
- Begin direct met het verhaal. Wissel af in openingsstijl: soms een historisch feit, soms een locatiebeschrijving, soms een verrassende anekdote, soms een vraag, soms een concrete scène. Gebruik NIET altijd "Stel je voor" als opening.
- Schrijf in vloeiende alinea's zonder koppen of opsommingstekens.
- Gebruik 'je' en 'jij' om een directe band met de luisteraar op te bouwen.
- Lengte: schrijf ongeveer ${wordCount} woorden.
- Eindig met een interessant feit of een gedachte die blijft hangen.${googleVoiceType ? getGoogleTtsInstructions("nl", googleVoiceType, city) : ""}`,

    fr: `## Votre Role
${roles.fr}${cityConstraint.fr}

## Perspective
${perspectiveText}

## Ton
Gardez un ton informatif et terre-a-terre, avec des touches personnelles occasionnelles. Evitez le drame excessif, les exagerations poetiques et les effets theatraux. Soyez plutot un bon ami qui partage quelque chose d'interessant qu'un acteur jouant un role. Laissez les faits parler d'eux-memes.

## Optimisation audio (pour TTS)
Pour sonner naturellement, suivez ces regles:
1. **Pas d'abreviations:** Ecrivez les mots en entier. Utilisez "il ne faut pas" au lieu de "faut pas", "je ne sais pas" au lieu de "j'sais pas". Pas de contractions famillieres.
2. **Pas de tirets ou points de suspension:** N'utilisez PAS de tirets longs, de tirets courts ou de points de suspension. Utilisez des virgules et des points pour le rythme et les pauses.
3. **Pas de mots de remplissage:** Evitez les mots comme "Bon,", "Alors,", "Ecoutez,", "Vous savez quoi?", "Franchement,". Racontez simplement l'histoire sans remplissage.
4. **Structure des phrases:** Alternez phrases courtes et longues. Evitez les propositions subordonnees complexes.
5. **Phonetiquement clair:** Ecrivez des mots faciles a prononcer pour la synthese vocale. Evitez les combinaisons de mots difficiles et les mots empruntes inhabituels. Utilisez des mots simples et clairs.
6. **Soyez precis:** Mentionnez des noms, dates, adresses et faits specifiques. Cela rend l'histoire credible et informative.

## Regles d'ecriture
- PAS de titres, PAS d'en-tetes, PAS de markdown (#), PAS de ligne d'annonce comme "La Tour Eiffel" ou "Le Marais" en haut du script. La premiere phrase EST l'histoire.
- PAS de "Bienvenue a...", PAS de presentation de vous-meme.
- Commencez directement avec l'histoire. Variez le style d'ouverture: parfois un fait historique, parfois une description de lieu, parfois une anecdote surprenante, parfois une question, parfois une scene concrete. N'utilisez PAS toujours "Imaginez" comme ouverture.
- Ecrivez en paragraphes fluides sans titres ni puces.
- Utilisez "vous" pour creer un lien direct avec l'auditeur.
- Longueur: ecrivez environ ${wordCount} mots.
- Terminez avec un fait interessant ou une pensee qui reste.${googleVoiceType ? getGoogleTtsInstructions("fr", googleVoiceType, city) : ""}`,

    de: `## Deine Rolle
${roles.de}${cityConstraint.de}

## Perspektive
${perspectiveText}

## Ton
Halte den Ton informativ und bodenstaendig, mit gelegentlichen persoenlichen Akzenten. Vermeide uebertriebene Dramatik, poetische Uebertreibungen und theatralische Effekte. Sei eher ein guter Freund, der etwas Interessantes erzaehlt, als ein Schauspieler, der eine Rolle spielt. Lass die Fakten fuer sich sprechen.

## Audio-Optimierung (fuer TTS)
Um natuerlich zu klingen, befolge diese Regeln:
1. **Keine Abkuerzungen:** Schreibe Woerter vollstaendig aus. Verwende "es ist" statt "es ist", "ich habe" statt "ich hab". Keine umgangssprachlichen Verkuerzungen.
2. **Keine Gedankenstriche oder Auslassungspunkte:** Verwende KEINE Gedankenstriche oder Auslassungspunkte. Verwende Kommas und Punkte fuer Rhythmus und Pausen.
3. **Keine Fuellwoerter:** Vermeide Woerter wie "Nun ja,", "Schau mal,", "Weisst du was?", "Ehrlich gesagt,". Erzaehle einfach die Geschichte ohne Fuellung.
4. **Satzbau:** Wechsle kurze und laengere Saetze ab. Vermeide komplexe Nebensaetze.
5. **Phonetisch klar:** Schreibe Woerter, die fuer die Sprachsynthese leicht auszusprechen sind. Vermeide schwierige Wortkombinationen, Zungenbrecher und ungewoehnliche Fremdwoerter. Verwende einfache, klare Woerter.
6. **Konkret:** Nenne spezifische Namen, Daten, Adressen und Fakten. Das macht die Geschichte glaubwuerdig und informativ.

## Schreibregeln
- KEINE Titel, KEINE Ueberschriften, KEIN Markdown (#), KEINE Ankuendigungszeile wie "Die Alte Kirche" oder "Der Vondelpark" am Anfang des Skripts. Der erste Satz IST die Geschichte.
- KEIN "Willkommen bei...", KEINE Vorstellung deiner selbst.
- Beginne direkt mit der Geschichte. Wechsle den Eroeffnungsstil ab: mal ein historisches Faktum, mal eine Ortsbeschreibung, mal eine ueberraschende Anekdote, mal eine Frage, mal eine konkrete Szene. Verwende NICHT immer "Stell dir vor" als Eroeffnung.
- Schreibe in fliessenden Absaetzen ohne Ueberschriften oder Aufzaehlungszeichen.
- Verwende "du" um eine direkte Verbindung mit dem Zuhoerer aufzubauen.
- Laenge: schreibe ungefaehr ${wordCount} Woerter.
- Ende mit einem interessanten Fakt oder einem Gedanken, der nachhallt.${googleVoiceType ? getGoogleTtsInstructions("de", googleVoiceType, city) : ""}`,

    es: `## Tu Rol
${roles.es}${cityConstraint.es}

## Perspectiva
${perspectiveText}

## Tono
Manten un tono informativo y cercano, con toques personales ocasionales. Evita el drama excesivo, las exageraciones poeticas y los efectos teatrales. Se mas como un buen amigo que comparte algo interesante que un actor interpretando un papel. Deja que los hechos hablen por si mismos.

## Optimizacion de audio (para TTS)
Para sonar natural, sigue estas reglas:
1. **Sin abreviaturas:** Escribe las palabras completas. No uses contracciones coloquiales.
2. **Sin guiones o puntos suspensivos:** NO uses guiones largos, guiones cortos o puntos suspensivos. Usa comas y puntos para el ritmo y las pausas.
3. **Sin palabras de relleno:** Evita palabras como "Bueno,", "Mira,", "Sabes que?", "La verdad,", "Oye,". Simplemente cuenta la historia sin relleno.
4. **Estructura de oraciones:** Alterna oraciones cortas y largas. Evita clausulas subordinadas complejas.
5. **Foneticamente claro:** Escribe palabras faciles de pronunciar para la sintesis de voz. Evita combinaciones de palabras dificiles, trabalenguas y extranjerismos inusuales. Usa palabras simples y claras.
6. **Se especifico:** Menciona nombres, fechas, direcciones y hechos especificos. Esto hace la historia creible e informativa.

## Reglas de escritura
- SIN titulos, SIN encabezados, SIN markdown (#), SIN linea de anuncio como "La Catedral" o "El Barrio Gotico" al inicio del script. La primera oracion ES la historia.
- SIN "Bienvenidos a...", SIN presentarte a ti mismo.
- Comienza directamente con la historia. Varia el estilo de apertura: a veces un hecho historico, a veces una descripcion del lugar, a veces una anecdota sorprendente, a veces una pregunta, a veces una escena concreta. NO uses siempre "Imagina" como apertura.
- Escribe en parrafos fluidos sin encabezados ni vinetas.
- Usa "tu" para construir una conexion directa con el oyente.
- Longitud: escribe aproximadamente ${wordCount} palabras.
- Termina con un hecho interesante o un pensamiento que permanezca.${googleVoiceType ? getGoogleTtsInstructions("es", googleVoiceType, city) : ""}`,

    en: `## Your Role
${roles.en}${cityConstraint.en}

## Perspective
${perspectiveText}

## Tone
Keep the tone informative and down-to-earth, with occasional personal touches. Avoid excessive drama, poetic exaggeration, and theatrical effects. Be more like a good friend sharing something interesting than an actor performing a role. Let the facts speak for themselves.

## Audio Optimization (for TTS)
To sound natural, follow these rules:
1. **No abbreviations:** Write words out in full. Use "it is" instead of "it's", "they would" instead of "they'd", "do not" instead of "don't". No contractions.
2. **No dashes or ellipses:** Do NOT use em dashes, en dashes, or ellipses. Use commas and periods for rhythm and pauses.
3. **No filler words:** Avoid filler words like "Well,", "Look,", "You know what?", "Honestly,", "Hear that?". Just tell the story without filler.
4. **Sentence structure:** Alternate short and longer sentences. Avoid complex subordinate clauses.
5. **Phonetically clear:** Write words that are easy to pronounce for text-to-speech. Avoid difficult word combinations, tongue twisters, and unusual loanwords. Use simple, clear words.
6. **Be specific:** Mention specific names, dates, addresses, and facts. This makes the story credible and informative.

## Writing Rules
- NO titles, NO headings, NO markdown (#), NO announcement line like "The Old Church" or "The Vondelpark" at the top of the script. The first sentence IS the story.
- NO "Welcome to...", NO introducing yourself.
- Start directly with the story. Vary your opening style: sometimes a historical fact, sometimes a location description, sometimes a surprising anecdote, sometimes a question, sometimes a concrete scene. Do NOT always use "Imagine" as an opening.
- Write in flowing paragraphs without headings or bullet points.
- Use 'you' to build a direct connection with the listener.
- Length: write approximately ${wordCount} words.
- End with an interesting fact or a thought that lingers.${googleVoiceType ? getGoogleTtsInstructions("en", googleVoiceType, city) : ""}`,
  };

  const focusGuidance = siblingAngles && siblingAngles.length > 0
    ? buildFocusGuidance(siblingAngles, language)
    : "";

  return (prompts[langKey] || prompts.en) + focusGuidance;
}
