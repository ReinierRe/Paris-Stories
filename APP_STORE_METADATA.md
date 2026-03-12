# App Store Connect Metadata — Paris Stories

Kopieer onderstaande teksten naar de juiste velden in App Store Connect.
Alle secties zijn klaar om in te vullen.

---

## 1. App Information (General)

**App Name**: Paris Stories
**Subtitle** (max 30 tekens): Personalized Paris Podcasts
**Bundle ID**: com.greenhome.parisstories
**Primary Language**: English (U.S.)
**Category**: Education
**Secondary Category**: Travel

---

## 2. App Description

### Description (max 4000 tekens)

```
Discover the real Paris through AI-powered podcast stories. Paris Stories creates personalized audio guides about the history, culture, food, art, and hidden gems of the City of Light — generated just for you.

HOW IT WORKS
Browse our curated library of Paris topics — from the founding of Lutetia to the secrets of Montmartre, from classic French cuisine to the art of the Belle Époque. Pick a topic, choose your preferred storytelling angle, and Paris Stories generates a unique, factual podcast episode tailored to your interests.

CURATED LIBRARY
Explore topics across six rich categories:
• History — From Roman Lutetia to Haussmann's grand boulevards
• Food & Drink — Parisian bistros, patisseries, and wine culture
• Art & Culture — The Louvre, Impressionism, and literary Paris
• Architecture — Gothic cathedrals, Art Nouveau, and modern landmarks
• Hidden Gems — Secret passages, underground Paris, and local favorites
• Daily Life — Café culture, markets, neighborhoods, and Parisian style

CUSTOM PODCASTS
Want to learn about something specific? Create your own podcast about any Paris-related topic. Enter your subject, pick a storytelling angle, and get a unique episode in minutes.

MULTIPLE LANGUAGES & VOICES
Listen in English, Dutch, French, German, or Spanish. Choose between a male or female voice. Set your preferences once in your profile — every podcast adapts automatically.

KEY FEATURES
• AI-generated scripts with factual, well-researched content
• Natural-sounding audio powered by Google Cloud Text-to-Speech
• Interactive player with seekable progress bar
• Save and replay your favorite episodes
• Clean, intuitive interface designed for discovery
• Content moderation ensures appropriate topics

Paris Stories is perfect for travelers preparing a trip to Paris, history enthusiasts, Francophiles, language learners, or anyone curious about one of the world's most fascinating cities.

All content is generated using artificial intelligence and converted to natural-sounding speech. While we strive for accuracy, AI-generated content may occasionally contain inaccuracies.
```

### Promotional Text (max 170 tekens, kan altijd gewijzigd worden zonder review)

```
Explore Paris like never before. AI-powered podcast stories about history, food, art, and hidden gems — in your language, your voice.
```

---

## 3. Keywords (max 100 tekens, komma-gescheiden)

```
paris,podcast,travel,audio guide,history,france,AI,stories,culture,food,art
```

---

## 4. What's New (Version 1.0.0)

```
Welcome to Paris Stories! Discover the real Paris through AI-powered podcast stories about history, culture, food, art, and hidden gems.
```

---

## 5. Support URL

```
https://YOUR-REPLIT-APP-URL/privacy-policy
```
(Vervang met je gepubliceerde URL. De privacy policy pagina dient ook als contactpunt.)

---

## 6. Privacy Policy URL

```
https://YOUR-REPLIT-APP-URL/privacy-policy
```

---

## 7. Age Rating Questionnaire

Beantwoord alle vragen in App Store Connect als volgt:

| Vraag | Antwoord |
|-------|----------|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic or Sadistic Realistic Violence | None |
| Profanity or Crude Humor | None |
| Mature/Suggestive Themes | None |
| Horror/Fear Themes | None |
| Medical/Treatment Information | None |
| Alcohol, Tobacco, or Drug Use or References | Infrequent/Mild |
| Simulated Gambling | None |
| Sexual Content or Nudity | None |
| Contests | None |
| Unrestricted Web Access | No |
| Gambling with Real Currency | No |

**Resultaat**: 4+ (Geschikt voor alle leeftijden)

**Toelichting**: "Infrequent/Mild" bij alcohol omdat podcasts over Parijse eetcultuur mogelijk wijn en bistro-cultuur bespreken. Dit verandert de rating niet naar 12+, maar is eerlijker richting Apple.

---

## 8. App Privacy (Privacy Labels)

Ga naar App Store Connect > App Privacy en configureer het volgende:

### Data Types to Declare:

#### A. Contact Info — Email Address
- **Collected**: Yes
- **Linked to User**: Yes
- **Used for Tracking**: No
- **Purposes**: App Functionality (account creation and login)

#### B. User Content
- **Collected**: Yes (custom podcast topics entered by users)
- **Linked to User**: Yes
- **Used for Tracking**: No
- **Purposes**: App Functionality (topics are sent to AI to generate podcast scripts)

#### C. Identifiers — User ID
- **Collected**: Yes (Firebase Authentication UID)
- **Linked to User**: Yes
- **Used for Tracking**: No
- **Purposes**: App Functionality (user account management)

#### D. Usage Data — Product Interaction
- **Collected**: Yes (podcast generation history)
- **Linked to User**: Yes
- **Used for Tracking**: No
- **Purposes**: App Functionality (saving user's podcast library)

### Third-Party Data Processing
De app stuurt data naar externe diensten. Dit valt onder de privacy labels hierboven:
- **Anthropic Claude** — Ontvangt podcast-onderwerpen (User Content) voor scriptgeneratie
- **Google Cloud Text-to-Speech** — Ontvangt gegenereerde scripts voor audio-omzetting
- **Firebase Authentication** — Beheert login/registratie (Email, User ID)

Geen van deze diensten wordt gebruikt voor tracking of advertenties.

### Data Used to Track You
**No** — De app gebruikt geen data om je te volgen over andere apps of websites.

### Data NOT Collected:
- Location
- Financial Info
- Health & Fitness
- Browsing History
- Search History
- Contacts
- Diagnostics
- Photos or Videos
- Sensitive Info
- Other Data

---

## 9. App Review Information

### Sign-in Required
**Yes** — De app vereist een account om podcasts te genereren en te beluisteren.

### Demo Account
Maak een testaccount aan in Firebase Console voordat je de app indient:
- **Email**: reviewer@parisstories.app (of een ander emailadres)
- **Password**: TestReview2026!

Vul deze gegevens in bij App Store Connect > App Review Information > Sign-in Information.

### Contact Information (Review Team)
Vul je eigen contactgegevens in zodat Apple je kan bereiken als er vragen zijn tijdens de review.

### App Review Notes (kopieer dit naar het Notes-veld)

```
Paris Stories generates AI-powered podcast stories about Paris. The app uses Anthropic Claude (AI) to create factual scripts and Google Cloud Text-to-Speech to convert them to audio.

TO TEST THE APP:
1. Log in with the provided demo account credentials
2. Go to the "Library" tab to browse curated Paris topics
3. Select any topic (e.g., "Lutetia: The Birth of Paris" under History)
4. Choose a storytelling angle (e.g., "Historical") and tap "Generate Podcast"
5. Wait approximately 30-60 seconds for AI generation
6. The podcast will appear in "My Podcasts" — tap to play

TO TEST CUSTOM PODCASTS:
1. Go to "My Podcasts" tab and tap "Create Custom Podcast"
2. Enter a Paris-related topic (e.g., "The history of croissants in Paris")
3. Choose a storytelling angle and generate
4. Custom topics are moderated by AI — inappropriate subjects are rejected

ADDITIONAL FEATURES:
- Profile tab: Change language (EN/NL/FR/DE/ES) and voice (male/female) preferences
- Player: Interactive seekable progress bar, read-along script
- Delete Account: Available in Profile > Delete Account (Apple requirement)
- Privacy Policy: Accessible from Profile and Login screens

Note: Podcast generation requires an active internet connection and takes 30-60 seconds per episode. All content is AI-generated and moderated.
```

---

## 10. Screenshots

Je hebt screenshots nodig voor iPhone (6.7" en 6.5") en optioneel iPad.

### Aanbevolen screenshots (5-8 stuks, in deze volgorde):

1. **Library** — Het hoofdscherm met categorieën (History, Food, Art, etc.)
2. **Topic keuze** — Een uitgeklapte categorie met topics
3. **Podcast speler** — De player met een afspelend verhaal en script
4. **Custom podcast** — Het scherm om een eigen onderwerp in te voeren
5. **My Podcasts** — De lijst met opgeslagen podcasts
6. **Profile** — Het profielscherm met taal- en stemkeuze
7. **Login** — Het welkomstscherm met de onboarding slides

### Screenshot specificaties:
- **iPhone 6.7"** (verplicht): 1290 × 2796 px (iPhone 15 Pro Max / 16 Plus)
- **iPhone 6.5"** (verplicht): 1284 × 2778 px (iPhone 14 Plus / 13 Pro Max)
- **iPad 12.9"** (optioneel): 2048 × 2732 px

**Tip**: Gebruik een iPhone simulator in Xcode of een fysiek toestel om screenshots te maken. Cmd+S in de Simulator maakt een screenshot.

---

## 11. Export Compliance

Bij het uploaden van een build vraagt Apple naar export compliance:

**Does your app use encryption?** → **Yes**
(De app gebruikt HTTPS voor API-communicatie en Firebase Auth.)

**Does your app qualify for any of the exemptions?** → **Yes**
(De app gebruikt alleen standaard HTTPS/TLS, geen custom encryptie.)

Selecteer: "Your app uses standard encryption exempt from EAR regulations."

---

## 12. Copyright

```
© 2026 GreenHome
```

---

## 13. Build & Submission Checklist

- [ ] App icon (1024×1024 px, geen transparantie, geen afgeronde hoeken)
- [ ] Screenshots voor alle vereiste schermformaten (6.7" en 6.5")
- [ ] Demo account aangemaakt in Firebase Console
- [ ] Privacy Policy URL live en bereikbaar
- [ ] Support URL ingevuld
- [ ] Copyright ingevuld (© 2026 GreenHome)
- [ ] Leeftijdsclassificatie vragenlijst ingevuld
- [ ] Privacy labels geconfigureerd (alle 4 data types + tracking = No)
- [ ] App Review Notes ingevuld met demo credentials en testinstructies
- [ ] Contact information ingevuld voor Review team
- [ ] Sign-in Required = Yes aangevinkt
- [ ] Export Compliance beantwoord (HTTPS exemption)
- [ ] EAS Build gemaakt en geüpload naar App Store Connect
- [ ] Versienummer en buildnummer correct
- [ ] App description, subtitle, keywords ingevuld
- [ ] Promotional text ingevuld
