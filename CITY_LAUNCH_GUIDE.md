# Lanceerhandleiding: Nieuwe Stad Toevoegen

## Referentie

- Apple Developer Team ID: `L9BR52LZ5P`
- Apple ID login: `reinier@greenhome.nl`
- Backend domain (gedeeld): `paris-stories.replit.app`
- Firebase project: gedeeld voor alle steden

## Naamconventies

| Veld | Patroon | Voorbeeld |
|------|---------|-----------|
| City ID (DB) | `london` | `amsterdam`, `paris` |
| App naam | `London Stories` | `Amsterdam Stories` |
| Slug | `london-stories` | `amsterdam-stories` |
| Bundle ID (iOS) | `app.replit.londonstories` | `app.replit.amsterdamstories` |
| Scheme | `londonstories` | `amsterdamstories` |
| Android package | `com.greenhome.londonstories` | `com.greenhome.amsterdamstories` |
| SKU (App Store) | `city-stories-london` | `city-stories-amsterdam` |

## Bestaande steden

| Stad | City ID | EAS Project ID | Apple ID | SKU |
|------|---------|----------------|----------|-----|
| Paris | `paris` | `68998269-2bf6-4afa-8d80-56df617ea768` | `6760458412` | *(check App Store Connect)* |
| Amsterdam | `amsterdam` | `8bba9b9e-d635-4276-b8b6-1d36877f1dc3` | `6761359426` | `city-stories-amsterdam` |

---

## Stap 1: Content voorbereiden

**Wie: Jij (inhoudelijk)**

- [ ] Kies 5-8 thema's met elk 8 topics (zie Amsterdam: History, Golden Age, Museums, Buildings, Modern History, Neighborhoods, Culinary)
- [ ] Bedenk stadspecifieke angles per thema
- [ ] Schrijf user levels (4 niveaus, eigen namen, in 5 talen: nl/en/fr/de/es)
- [ ] Schrijf AI role descriptions (in 5 talen)
- [ ] Schrijf walking tour & modern culture perspectives (in 5 talen)
- [ ] Verzamel/maak assets: app icon (1024x1024), splash screen, thema-afbeeldingen

---

## Stap 2: Database — stad toevoegen

**Wie: Replit Agent**

- [ ] City record invoegen in `cities` tabel (alle 22 kolommen)
- [ ] Topic-theme mapping invullen (`topicThemeMap`, `themeAngles`, `perspectivePrompts`)
- [ ] Verifieer via `/api/city/config` met header `X-City-Id: <cityid>`
- [ ] Verifieer privacy policy via `/privacy-policy?city=<cityid>`

---

## Stap 3: Frontend content toevoegen

**Wie: Replit Agent**

- [ ] `constants/themes.ts` — Thema's, topics en angles toevoegen voor nieuwe stad
- [ ] `constants/onboarding.ts` — Onboarding slides aanpassen
- [ ] `constants/city.ts` — Fallback/default config toevoegen in `CITY_DEFAULTS`
- [ ] `app.config.ts` — Icon en splash icon mapping toevoegen (`cityIcons`, `citySplashIcons`)
- [ ] Asset bestanden toevoegen: `assets/images/icon-<stad>.png`, `assets/images/splash-icon-<stad>.png`, thema-afbeeldingen

---

## Stap 4: Expo.dev — project aanmaken

**Wie: Jij op expo.dev**

1. Ga naar https://expo.dev
2. Klik "Create a project"
3. Naam: `<Stad> Stories` (bijv. "London Stories")
4. Slug: `<stad>-stories` (bijv. "london-stories")
5. Noteer het **Project ID** (UUID formaat: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

## Stap 5: EAS build profielen toevoegen

**Wie: Replit Agent**

- [ ] 3 build profielen toevoegen aan `eas.json` (`development:<stad>`, `preview:<stad>`, `production:<stad>`)
- [ ] Alle `EXPO_PUBLIC_*` env vars invullen inclusief `EXPO_PUBLIC_EAS_PROJECT_ID`
- [ ] Submit profiel toevoegen met `ascAppId` (wordt ingevuld na stap 6)

---

## Stap 6: App Store Connect — app aanmaken

**Wie: Jij op appstoreconnect.apple.com**

1. Ga naar "My Apps" → "+" → "New App"
2. Platform: iOS
3. Naam: `<Stad> Stories`
4. Primary language: English (U.S.)
5. Bundle ID: `app.replit.<stadstories>` (moet eerst geregistreerd zijn in Apple Developer portal)
6. SKU: `city-stories-<stad>`
7. Noteer het **Apple ID** (nummer, bijv. `6761359426`)

---

## Stap 7: Apple ID invullen in eas.json

**Wie: Replit Agent**

- [ ] `ascAppId` invullen in het submit-profiel van `eas.json`

---

## Stap 8: App Store metadata schrijven

**Wie: Replit Agent**

- [ ] `APP_STORE_METADATA_<STAD>.md` aanmaken met volledige metadata in 5 talen (EN/NL/FR/DE/ES)
- [ ] Beschrijvingen, subtitles, keywords, promotional text, what's new
- [ ] App Review Notes met demo account en testinstructies

---

## Stap 9: Firebase — demo account aanmaken

**Wie: Jij in Firebase Console**

1. Ga naar Firebase Console → Authentication → Users
2. Voeg gebruiker toe: `reviewer@<stad>stories.app` met wachtwoord `TestReview2026!`
3. Dit account vermeld je in de App Review Notes

---

## Stap 10: Build maken

**Wie: Jij in terminal (lokaal of Replit shell)**

```bash
eas build --platform ios --profile production:<stad>
```

- Bij eerste build: **Reuse distribution certificate** → Yes (zelfde Team cert voor alle apps)
- Bij eerste build: **Generate new provisioning profile** → Yes (elke app heeft eigen profiel)
- Bij eerste build: **Select App Store Connect API Key** → Kies de bestaande key (Key ID: `9HL9J9S224`, Team: GreenHome B.V.)

---

## Stap 11: Submitten naar App Store

**Wie: Jij in terminal**

**Belangrijk:** Je moet de env vars meegeven zodat EAS CLI de juiste project-context gebruikt (anders valt hij terug op Paris).

```bash
EXPO_PUBLIC_CITY_ID=<stad> \
EXPO_PUBLIC_APP_SLUG=<stad>-stories \
EXPO_PUBLIC_BUNDLE_ID=app.replit.<stadstories> \
EXPO_PUBLIC_EAS_PROJECT_ID=<eas-project-id> \
eas submit --platform ios --profile production:<stad>
```

Of direct met de build URL (kopieer uit de build output):

```bash
EXPO_PUBLIC_CITY_ID=<stad> \
EXPO_PUBLIC_APP_SLUG=<stad>-stories \
EXPO_PUBLIC_BUNDLE_ID=app.replit.<stadstories> \
EXPO_PUBLIC_EAS_PROJECT_ID=<eas-project-id> \
eas submit --platform ios --profile production:<stad> --url <build-artifact-url>
```

- Selecteer de **bestaande App Store Connect API Key** (Key ID: `9HL9J9S224`)

---

## Stap 12: App Store Connect invullen

**Wie: Jij op appstoreconnect.apple.com**

- [ ] Metadata kopiëren uit `APP_STORE_METADATA_<STAD>.md`
- [ ] Screenshots uploaden (6.7" en 6.5")
- [ ] Privacy labels invullen (Email, User Content, User ID, Usage Data)
- [ ] Age rating: 4+ (alle vragen "No")
- [ ] Export compliance: Uses encryption → No
- [ ] App Review informatie: demo account + review notes
- [ ] Submit for Review

---

## Stap 13: Verificatie

**Wie: Jij + Replit Agent**

- [ ] Test podcast generatie met stadspecifieke prompts
- [ ] Test moderatie accepteert stadspecifieke topics
- [ ] Audio bestanden worden opgeslagen onder `podcast-audio/<stad>/`
- [ ] Privacy policy klopt op `/privacy-policy?city=<stad>`
- [ ] App werkt in TestFlight voor review
