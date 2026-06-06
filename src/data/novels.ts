import { Novel } from '../types';

export const INITIAL_NOVELS_DATA: Novel[] = [
  {
    id: "red-sunset",
    title: "Adventure at the Edge of the Red Sunset",
    alternativeTitle: "Akagure no Hate de Hajimeru Bouken",
    originalTitle: "赤暮の果てで始める冒険",
    japaneseTitle: "赤暮の果てで始める冒険",
    romajiTitle: "Akagure no Hate de Hajimeru Bouken",
    author: "Kenji Takahashi",
    illustrator: "Shirabii",
    translator: "Alex Mercer",
    publisher: "Dengeki Bunko",
    synopsis: "When the eastern horizon becomes an eternal sea of fire due to an ancient magical disaster, the remaining dragon knights must choose between sacrificing their civilization or befriending the darkness to survive. Following the story of Kenji, a failed cadet who inherits a soul-devouring black sword.",
    status: "ONGOING",
    releaseSchedule: "Every Saturday",
    addedDate: "2026-05-10",
    rating: "4.9",
    views: "12,400",
    genres: ["Fantasy", "Action", "Drama"],
    tags: ["Swordplay", "Dragon", "Magic", "Tragedy"],
    coverImage: "",
    isRecommended: true,
    volumes: [
      {
        volumeNumber: 1,
        title: "Volume 01: Remaining Ashes of the Horizon",
        chapters: [
          {
            id: "rs-v1-c1",
            title: "Chapter 1: The Burning World",
            publishDate: "2026-06-05T12:00:00Z",
            content: `The night wind in the red desert blew across the gaps of the ruins of the ancient temple pillars. Under the glow of two moons hanging low in the horizon, Kenji tightened his wolf-fur coat. The metal of the ancestral sword strapped to his back felt cold against the skin of his neck.\n\n"We don't have much time before dawn," Shina whispered, looking anxiously toward the valley where a thick purple fog began to creep up. "If that fog covers the portal gate, we'll be trapped in this dead dimension forever."\n\nKenji didn't reply immediately. He knelt down, touching the red sand which still felt warm from the day's residual radiation. He felt a strange pulse of energy flowing from the depths of this planet. Something that had been sleeping for thousands of years was now beginning to awaken.\n\n[ILLUSTRATION:rs-v1-c1-illus]\n\n"Wait," Kenji interrupted softly. His eyes narrowed, piercing the darkness. At the end of the valley, a giant silhouette with torn wings slowly rose from the pile of volcanic dust.`
          },
          {
            id: "rs-v1-c2",
            title: "Chapter 2: Shard of the Black Dragon Soul",
            publishDate: "2026-05-28T09:00:00Z",
            content: `The roar of the creature's breath shook the ground beneath their feet. Something that should have been destroyed five hundred years ago was now standing tall again.\n\n"Kenji... that... is the star-devouring dragon," Shina's voice trembled violently. Her legs felt weak, losing the strength to support her body.\n\nKenji drew the sword on his back. The black metal began to emit hot vermillion steam. The soul of the black dragon inside the sword whispered directly into his head: 'Give me your blood, boy, and I will crush that giant.'`
          }
        ]
      }
    ]
  },
  {
    id: "empty-signal",
    title: "False Signals from the Void Dimension",
    alternativeTitle: "Void Signal Overdrive",
    originalTitle: "空虚な次元からの偽の信号",
    japaneseTitle: "空虚な次元からの偽 of 信号",
    romajiTitle: "Kuu Kyo na Jigen kara no Nise no Shingou",
    author: "Tsukasa Satou",
    illustrator: "Hanamori",
    translator: "Alex Mercer",
    publisher: "Kadokawa Sneaker Bunko",
    synopsis: "The space station's observation sector recorded the exact same radio signal anomaly 42 times. Using ancient binary mathematical calculations, researchers realized that the signal was sent by humans from an alternate future that has been completely destroyed.",
    status: "COMPLETED",
    releaseSchedule: "Completed",
    addedDate: "2026-06-01",
    rating: "4.8",
    views: "9,120",
    genres: ["Sci-Fi", "Mystery", "Psychological"],
    tags: ["Space", "Future", "Artificial Intelligence", "Time Travel"],
    coverImage: "",
    isRecommended: false,
    volumes: [
      {
        volumeNumber: 1,
        title: "Volume 01: Dead Frequency",
        chapters: [
          {
            id: "es-v1-c1",
            title: "Chapter 1: Sector 09 Anomaly",
            publishDate: "2026-06-03T15:00:00Z",
            content: `Observation sector 09 recorded the exact same anomaly for the 42nd time in the last 24 hour cycles. The signal was not ordinary pulsar star radiation. It was structured, oddly rhythmic, and used a prime binary mathematical basis.\n\n"Whoever the sender is, they are not on our current galactic map," Dr. Aris muttered while adjusting the magnetic field refraction filter lens on his quantum screen.\n\n[ILLUSTRATION:es-v1-c1-illus]\n\nBehind the glass of the giant observation deck, the vortex of the unnamed wormhole reflected strange silvery-blue holographic light. They realized this exploration exceeded the limits of conventional human physics.`
          }
        ]
      }
    ]
  },
  {
    id: "midnight-cafe",
    title: "The Midnight Cafe Detective Club",
    alternativeTitle: "Midnight Espresso Deductions",
    originalTitle: "深夜カフェ探偵部",
    japaneseTitle: "深夜カフェ探偵部",
    romajiTitle: "Shinya Cafe Tantei-bu",
    author: "Shunji Iwai",
    illustrator: "TNSK",
    translator: "Rina Wijaya",
    publisher: "Media Factory",
    synopsis: "In a hidden corner of Kyoto, an old cafe only serves a cup of strong black espresso to customers who bring mystery puzzles that cannot be solved by the regular police force.",
    status: "ONGOING",
    releaseSchedule: "Every Wednesday",
    addedDate: "2026-04-20",
    rating: "4.7",
    views: "18,900",
    genres: ["Mystery", "Drama", "Slice of Life"],
    tags: ["Kyoto", "Detective", "Coffee", "Cozy"],
    coverImage: "",
    isRecommended: true,
    volumes: [
      {
        volumeNumber: 1,
        title: "Volume 01: The Bitter Taste of Truth",
        chapters: [
          {
            id: "mc-v1-c1",
            title: "Chapter 1: Espresso and the Brown Envelope",
            publishDate: "2026-05-27T10:00:00Z",
            content: `The small bell above the entrance rang softly as the antique wall clock struck twelve times. The aroma of strong roasted Mandheling coffee beans rose, blending with the cold draft from the snow outside the cafe.\n\n"A man sent a brown envelope without a sender's address," the cafe owner said, handing a cup of strong espresso to Ren. "He said you would know where the contents should be addressed."`
          }
        ]
      }
    ]
  }
];
