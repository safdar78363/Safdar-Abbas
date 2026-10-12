import { LanguageOption, TonePreset, VoiceOption } from '../types';

export const GEMINI_VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Feminine',
    tone: 'Calm & Soothing',
    description: 'Gentle, serene pacing with crystal clarity. Excellent for bedtime stories, meditation, and thoughtful essays.',
    previewSample: 'Welcome to this journey of discovery. Take a deep breath as we explore the wonders of our world.',
    bestFor: 'Storytelling, Meditation, Essays',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Masculine',
    tone: 'Energetic & Upbeat',
    description: 'Dynamic, snappy, punchy YouTube creator delivery. Keeps audience retention high in fast-paced videos.',
    previewSample: 'What is going on everyone! Today we are testing five insane gadgets you won\'t believe exist!',
    bestFor: 'Gaming, Vlogs, YouTube Shorts',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Masculine',
    tone: 'Deep & Cinematic',
    description: 'Authoritative, resonant baritone with dramatic gravity. The definitive voice for faceless documentary channels.',
    previewSample: 'Beneath the ancient ruins of the forgotten citadel, archaeologists made a discovery that baffled modern science.',
    bestFor: 'Documentaries, True Crime, History',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Masculine',
    tone: 'Bold & Intense',
    description: 'Gritty, powerful trailer voice with intense theatrical presence. Hits hard for movie recaps and suspense.',
    previewSample: 'In a world on the brink of total collapse, only one warrior dared to stand against the empire.',
    bestFor: 'Movie Recaps, Action, Trailers',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Neutral',
    tone: 'Warm & Conversational',
    description: 'Approachable, friendly, and natural. Sounds like your favorite tech reviewer explaining a complex topic simply.',
    previewSample: 'Here is everything you need to know about setting up your dream desk setup without breaking the bank.',
    bestFor: 'Tech Reviews, Tutorials, Podcasts',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Feminine',
    tone: 'Melodic & Expressive',
    description: 'Rich, emotionally captivating voice with theatrical inflection. Keeps listeners hooked on narrative fiction.',
    previewSample: 'The whispers had started long before the autumn leaves fell, but nobody listened until the clock struck midnight.',
    bestFor: 'Fiction Audiobooks, Drama, Video Essays',
  },
  {
    id: 'Leda',
    name: 'Leda',
    gender: 'Feminine',
    tone: 'Crisp & Informative',
    description: 'Sharp, objective broadcast cadence. Delivers rapid facts and news summaries with supreme confidence.',
    previewSample: 'Breaking developments today as tech leaders convene to announce sweeping changes to global AI standards.',
    bestFor: 'Daily News, Finance, Explainers',
  },
  {
    id: 'Orus',
    name: 'Orus',
    gender: 'Masculine',
    tone: 'Grounded & Wise',
    description: 'Mature, warm, seasoned narrator. Ideal for philosophy, historical retrospectives, and nature chronicles.',
    previewSample: 'For millions of years, the river carved its path through stone, a quiet testament to the patient power of time.',
    bestFor: 'Nature Docs, Philosophy, History',
  },
];

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', name: 'Auto-detect', promptName: 'Auto-detect', nativeName: 'Auto Detect', flag: '✨' },
  { code: 'ur', name: 'Urdu', promptName: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', isRTL: true },
  { code: 'hi', name: 'Hindi', promptName: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'en-US', name: 'English (US)', promptName: 'American English', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', promptName: 'British English', nativeName: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-IN', name: 'English (Indian)', promptName: 'Indian English', nativeName: 'English (India)', flag: '🇮🇳' },
  { code: 'ar', name: 'Arabic', promptName: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRTL: true },
  { code: 'es', name: 'Spanish', promptName: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', promptName: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', promptName: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', promptName: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', promptName: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', promptName: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'tr', name: 'Turkish', promptName: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ja', name: 'Japanese', promptName: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', promptName: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese (Mandarin)', promptName: 'Mandarin Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'bn', name: 'Bengali', promptName: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'ta', name: 'Tamil', promptName: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', promptName: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', promptName: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'id', name: 'Indonesian', promptName: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi', name: 'Vietnamese', promptName: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', promptName: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'pl', name: 'Polish', promptName: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', promptName: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'uk', name: 'Ukrainian', promptName: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'ro', name: 'Romanian', promptName: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
];

export const TONE_PRESETS: TonePreset[] = [
  {
    id: 'documentary',
    label: 'Documentary',
    instruction: 'Say in a deep, cinematic documentary tone with measured pacing, serious pauses, and narrative gravitas',
    iconName: 'Film',
    badge: 'Deep & Cinematic',
  },
  {
    id: 'storytelling',
    label: 'Storytelling',
    instruction: 'Say in an immersive narrative storytelling voice full of emotional expression, vivid cadence, and drama',
    iconName: 'BookOpen',
    badge: 'Emotional & Vivid',
  },
  {
    id: 'energetic',
    label: 'Energetic YouTuber',
    instruction: 'Say in an upbeat, high-energy, dynamic YouTube creator style with snappy excitement and crisp enunciation',
    iconName: 'Zap',
    badge: 'Upbeat & Fast',
  },
  {
    id: 'calm',
    label: 'Calm Narrator',
    instruction: 'Say in a calm, soothing, relaxed and reassuring voice with smooth, rhythmic cadence',
    iconName: 'Feather',
    badge: 'Gentle & Relaxing',
  },
  {
    id: 'news',
    label: 'News Anchor',
    instruction: 'Say in a crisp, objective, professional news anchor broadcast tone with urgent clarity',
    iconName: 'Radio',
    badge: 'Crisp & Professional',
  },
];

export const SAMPLE_SCRIPTS = {
  documentary: `Deep beneath the Marianas Trench, sunlight has not touched the ocean floor in four billion years. 

Here, under unimaginable atmospheric pressure, robotic probes detected rhythmic acoustic pulses that defied every geological model. At first, researchers believed the sounds were tectonic vibrations. But spectral acoustic analysis soon revealed a repeating mathematical sequence. 

Something down there was not just enduring the crushing abyss. It was transmitting. And as the research vessel lowered its thermal imaging sensors into the hydrothermal fissure, the ocean fell dead silent.`,

  energetic: `What is up, tech enthusiasts! Today we are checking out the five weirdest gadgets you can actually buy right now on Amazon! 

Number one: this transparent mechanical keyboard that literally lights up with audio waveforms while you type. I tested it for seventy-two hours straight, and honestly? The typing feel is absurdly addictive. 

Drop a comment below: would you buy this for your setup, or is it completely over the top? Don't forget to hit that subscribe button, because what's coming up at number three will blow your mind!`,

  multispeaker: `Speaker 1: Welcome back to The Creator Forge podcast! Today we are dissecting the secret psychology behind YouTube's biggest video hooks.
Speaker 2: Most creators think the first five seconds are just about flashy editing, but that's actually where ninety percent of viewers decide whether to stay or swipe away.
Speaker 1: Exactly! If your opening statement doesn't trigger an immediate question in their mind, retention craters instantly.
Speaker 2: That's why top documentary channels always start with a mystery or a high-stakes question before showing any intro titles.
Speaker 1: So how do you craft that irresistible hook without resorting to cheap clickbait? Let's break down the exact three-part formula right now.`,

  longScript: `Chapter One: The Golden Age of Discovery.

In the late seventeenth century, astronomer Gian Domenico Cassini turned his early telescope toward the ringed jewel of our solar system. What he witnessed was not a uniform disk, but a dark gap splitting the ivory rings into distinct concentric bands—a cosmic void now immortalized as the Cassini Division.

For centuries, astronomers debated what held these celestial rings together. Were they solid crystalline sheets, or vast swirling oceans of liquid frozen in the perpetual night of deep space? It was not until mathematical physics advanced that James Clerk Maxwell proved mathematically that only an ocean of billions of independent orbiting ice boulders could remain stable without tearing apart under tidal gravitational forces.

Fast forward three hundred years. In October nineteen ninety-seven, humanity launched a robotic emissary: the Cassini-Huygens spacecraft. Traveling over two billion miles across the solar void, through gravity-assist slingshots around Venus, Earth, and Jupiter, Cassini arrived at Saturn in July two thousand four.

The images transmitted back shattered our understanding of the outer solar system. Saturn was not a lonely gas giant surrounded by static rings of inert ice. It was a thriving, turbulent mini-solar system. Titan, the giant moon, possessed dense nitrogen clouds, liquid methane rivers, and shorelines sculpted by alien rainstorms. Enceladus, a tiny moon encased in pure white ice, shot geysers of liquid saltwater hundreds of miles into the void from a hidden global ocean beneath its crust.

When scientists analyzed the vapor plumes of Enceladus, they found hydrothermal minerals, carbon molecules, and hydrogen gas—the foundational building blocks of prebiotic chemistry. Life, it turned out, might not require the warm light of our sun to ignite. It might be flourishing right now inside the dark, thermal-warmed depths of an icy moon nearly a billion miles away.

As Cassini's propellant dwindled after thirteen years of relentless exploration, mission controllers faced a critical dilemma. If the spacecraft ran out of fuel, it might accidentally collide with and contaminate Enceladus or Titan with lingering terrestrial microbes. The decision was made: the Grand Finale. In September two thousand seventeen, Cassini plunged deliberately into the dense hydrogen-helium atmosphere of Saturn, sending scientific data until its thrusters could no longer fight the atmospheric drag, vaporizing into the very planet it spent a lifetime studying.`,
};
