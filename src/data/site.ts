export type Language = "en" | "ru";
export type LocalizedString = { en: string; ru: string };
export type PortfolioCategory = "Cover" | "Editorial" | "Campaign" | "Studio" | "Fashion";
export type PortfolioImageSize = "Small" | "Medium" | "Large";
export type ServiceGroup = "Personal Styling" | "Commercial Styling";

export type PortfolioImage = {
  id: string;
  url: string;
  alt: string;
  order: number;
  isCover: boolean;
  hidden: boolean;
  size: PortfolioImageSize;
};

export type PortfolioItem = {
  id: string;
  title: LocalizedString;
  category: PortfolioCategory;
  description: LocalizedString;
  images: PortfolioImage[];
  order: number;
  published: boolean;
  featured: boolean;
};

export type Service = {
  id: string;
  title: LocalizedString;
  eyebrow: LocalizedString;
  description: LocalizedString;
  deliverables: LocalizedString[];
  group: ServiceGroup;
  price?: LocalizedString;
  note?: LocalizedString;
  image: string;
  order: number;
  published: boolean;
};

export type Publication = {
  id: string;
  title: LocalizedString;
  image: string;
  order: number;
  published: boolean;
};

export type SiteContent = {
  homepage: {
    positioning: LocalizedString;
    heroNote: LocalizedString;
    heroImage: string;
  };
  about: {
    headline: LocalizedString;
    body: LocalizedString;
    note: LocalizedString;
  };
  contact: {
    headline: LocalizedString;
    body: LocalizedString;
  };
};

export type StudioData = {
  siteCopy: {
    stylistName: string;
    brandName: string;
  };
  content: SiteContent;
  services: Service[];
  portfolioItems: PortfolioItem[];
  publications: Publication[];
};

export const l = (en: string, ru: string): LocalizedString => ({ en, ru });

const image = (id: string, url: string, order: number, isCover = false, size: PortfolioImageSize = "Medium"): PortfolioImage => ({
  id,
  url,
  alt: "",
  order,
  isCover,
  hidden: false,
  size,
});

export const categoryLabels: Record<PortfolioCategory, LocalizedString> = {
  Cover: l("Cover", "Обложка"),
  Editorial: l("Editorial", "Эдиториал"),
  Campaign: l("Campaign", "Кампания"),
  Studio: l("Studio", "Студия"),
  Fashion: l("Fashion", "Мода"),
};

export const initialStudioData: StudioData = {
  siteCopy: {
    stylistName: "Anastasia",
    brandName: "Ana Styling",
  },
  content: {
    homepage: {
      positioning: l(
        "A personal and commercial styling studio in Miami creating refined wardrobes, fashion stories, and imagery with intention.",
        "Студия персонального и коммерческого стайлинга в Майами: продуманные гардеробы, модные съёмки и визуальные истории.",
      ),
      heroNote: l("Wardrobe edits / event styling / image direction", "Разбор гардероба / образы для событий / имидж-направление"),
      heroImage: "/ana-photos/hero.jpg",
    },
    about: {
      headline: l("My name is Ana", "Меня зовут Ana"),
      body: l(
        "My name is Ana\n\nI believe true style isn’t about following trends — it’s about defining your own. The kind that empowers your confidence, enhances your natural beauty, and tells your story without words. My philosophy is simple: great style is a form of self-expression that transforms how you feel, not just how you look.\n\nAs a personal and fashion stylist, I’ve had the privilege of transforming the style — and often the lives — of my clients. From personal wardrobe evolutions to high-profile editorials and celebrity collaborations, I help people see themselves in a new light — confident, elegant, and authentically them.\n\nWith a Bachelor’s degree in Marketing from NYU and Personal Stylist Certifications from institutions globally, I’ve developed a deep understanding of how to merge individuality with contemporary fashion. Beyond aesthetics, I know how to present and style products in a way that captivates attention and drives results — creating looks that not only inspire, but also translate into strong brand storytelling and measurable sales impact. My approach blends timeless sophistication with modern trends, resulting in visuals and experiences that feel elevated, intentional, and commercially successful.\n\nOver the years, I’ve collaborated with luxury brands, influencers, and entrepreneurs who value excellence, refinement, and authenticity. Whether it’s styling for a brand campaign, a red-carpet appearance, or a personal transformation, my goal is always the same — to create a lasting impact through the power of style.\n\nI offer a range of services including personal shopping, wardrobe consultations, corporate styling, and editorial work.\n\nLet’s create something extraordinary together — style that inspires confidence, celebrates individuality, and leaves a timeless impression.",
        "Меня зовут Ana\n\nЯ верю, что настоящий стиль — это не следование трендам, а умение определить свой собственный. Такой стиль усиливает уверенность, подчеркивает естественную красоту и рассказывает вашу историю без слов. Моя философия проста: сильный стиль — это форма самовыражения, которая меняет не только то, как вы выглядите, но и то, как вы себя чувствуете.\n\nКак персональный и модный стилист, я имела возможность менять стиль — а часто и жизнь — своих клиентов. От персональных трансформаций гардероба до заметных съёмок и сотрудничества с публичными людьми, я помогаю увидеть себя по-новому — уверенно, элегантно и честно.\n\nСтепень бакалавра по маркетингу в NYU и международные сертификации персонального стилиста помогли мне глубоко понять, как соединять индивидуальность с современной модой. Помимо эстетики, я знаю, как представить и стилизовать продукты так, чтобы они привлекали внимание и давали результат — создавая образы, которые вдохновляют, усиливают историю бренда и работают коммерчески. Мой подход сочетает вневременную утонченность с современными трендами, создавая визуальные решения и опыт, которые выглядят продуманно, дорого и эффективно.\n\nЗа годы работы я сотрудничала с премиальными брендами, инфлюенсерами и предпринимателями, которые ценят качество, точность и подлинность. Будь то съёмка для бренда, выход на красную дорожку или личная трансформация, моя цель всегда одна — создать долгосрочное впечатление через силу стиля.\n\nЯ предлагаю персональный шопинг, консультации по гардеробу, корпоративный стайлинг и направление съёмок.\n\nДавайте создадим что-то особенное вместе — стиль, который вдохновляет уверенность, раскрывает индивидуальность и оставляет вневременное впечатление.",
      ),
      note: l(
        "Every edit is built around proportion, climate, occasion, and the small emotional details that make clothes feel personal.",
        "Каждый образ строится вокруг пропорций, климата, повода и маленьких деталей, которые делают одежду личной.",
      ),
    },
    contact: {
      headline: l("Leave me a message and I’ll get back to you.", "Оставьте мне сообщение, и я свяжусь с вами."),
      body: l(
        "Share what you are dressing for. WhatsApp opens with your note prepared, so the conversation begins cleanly.",
        "Расскажите, для чего нужен образ. WhatsApp откроется с готовым сообщением, останется только нажать отправку.",
      ),
    },
  },
  services: [
    {
      id: "event-styling",
      title: l("Event Styling", "Стайлинг для события"),
      eyebrow: l("Personal Styling", "Персональный стайлинг"),
      description: l("Complete looks for dinners, launches, weddings, and high-visibility moments.", "Полные образы для ужинов, запусков, свадеб и важных выходов."),
      deliverables: [],
      group: "Personal Styling",
      price: l("$250", "$250"),
      image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=86",
      order: 1,
      published: true,
    },
    {
      id: "personal-shopping",
      title: l("Personal Shopping", "Персональный шопинг"),
      eyebrow: l("Personal Styling", "Персональный стайлинг"),
      description: l("Curated shopping for polished everyday dressing, travel, events, and seasonal refreshes.", "Кураторский подбор вещей для повседневности, путешествий, событий и сезонного обновления."),
      deliverables: [],
      group: "Personal Styling",
      price: l("$300/hour (min 2 hours)", "$300/час (минимум 2 часа)"),
      note: l("Personal shopping can be done in-person or online, depending on your preference.", "Персональный шопинг можно провести офлайн или онлайн, в зависимости от ваших предпочтений."),
      image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=900&q=86",
      order: 2,
      published: true,
    },
    {
      id: "photoshoot-styling",
      title: l("Photoshoot Styling", "Стайлинг для фотосессии"),
      eyebrow: l("Personal Styling", "Персональный стайлинг"),
      description: l("Outfit direction and styling support for personal shoots, portraits, and content days.", "Подбор образов и сопровождение для персональных съёмок, портретов и контент-дней."),
      deliverables: [],
      group: "Personal Styling",
      price: l("2 looks — $599 · 4 looks — $999 · Day on set (up to 10 looks) — $1499", "2 образа — $599 · 4 образа — $999 · День на съёмке (до 10 образов) — $1499"),
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=86",
      order: 3,
      published: true,
    },
    {
      id: "style-dna-online",
      title: l("Your Style DNA Online", "ДНК вашего стиля онлайн"),
      eyebrow: l("Personal Styling", "Персональный стайлинг"),
      description: l("A remote style direction package to clarify your silhouettes, palette, lifestyle needs, and next wardrobe decisions.", "Онлайн-пакет, который помогает определить силуэты, палитру, задачи образа жизни и следующие решения для гардероба."),
      deliverables: [],
      group: "Personal Styling",
      price: l("$499", "$499"),
      image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=86",
      order: 4,
      published: true,
    },
    {
      id: "travel-capsule",
      title: l("Travel Capsule", "Капсула для путешествия"),
      eyebrow: l("Personal Styling", "Персональный стайлинг"),
      description: l("A compact travel wardrobe planned around destination, climate, itinerary, and personal style.", "Компактный гардероб для поездки с учётом направления, климата, маршрута и личного стиля."),
      deliverables: [],
      group: "Personal Styling",
      price: l("$799", "$799"),
      image: "https://images.unsplash.com/photo-1520006403909-838d6b92c22e?auto=format&fit=crop&w=900&q=86",
      order: 5,
      published: true,
    },
    {
      id: "capsule-wardrobe-online",
      title: l("Capsule Wardrobe Online", "Капсульный гардероб онлайн"),
      eyebrow: l("Personal Styling", "Персональный стайлинг"),
      description: l("A complete online capsule built around versatile pieces, outfit combinations, and your everyday rhythm.", "Полная онлайн-капсула из универсальных вещей, готовых сочетаний и вашего повседневного ритма."),
      deliverables: [],
      group: "Personal Styling",
      price: l("$999", "$999"),
      note: l("Capsule size can be discussed.", "Размер капсулы можно обсудить."),
      image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=86",
      order: 6,
      published: true,
    },
    {
      id: "wardrobe-styling",
      title: l("Wardrobe Styling", "Стилизация гардероба"),
      eyebrow: l("Personal Styling", "Персональный стайлинг"),
      description: l("A styling session that turns your existing wardrobe into polished outfits for real life.", "Сессия, которая превращает существующий гардероб в продуманные образы для жизни."),
      deliverables: [],
      group: "Personal Styling",
      price: l("$799 (up to 4 hours)", "$799 (до 4 часов)"),
      image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=86",
      order: 7,
      published: true,
    },
    {
      id: "wardrobe-detox",
      title: l("Wardrobe Detox", "Детокс гардероба"),
      eyebrow: l("Personal Styling", "Персональный стайлинг"),
      description: l("A deeper wardrobe reset to edit, organize, style, and define what belongs in your next chapter.", "Глубокая перезагрузка гардероба: отбор, организация, стилизация и понимание, что нужно для нового этапа."),
      deliverables: [],
      group: "Personal Styling",
      price: l("$1499 (up to 6 hours)", "$1499 (до 6 часов)"),
      image: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=900&q=86",
      order: 8,
      published: true,
    },
    {
      id: "editorial-fashion-styling",
      title: l("Editorial and Fashion Styling", "Стайлинг для съёмок и модных проектов"),
      eyebrow: l("Commercial Styling", "Коммерческий стайлинг"),
      description: l("Fashion styling for editorials, campaigns, and visual stories where clothing, mood, and image direction need to work as one.", "Стайлинг для съёмок, кампаний и визуальных историй, где одежда, настроение и имидж-направление должны работать вместе."),
      deliverables: [],
      group: "Commercial Styling",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=86",
      order: 9,
      published: true,
    },
    {
      id: "lookbook-styling",
      title: l("Lookbook Styling", "Стайлинг лукбука"),
      eyebrow: l("Commercial Styling", "Коммерческий стайлинг"),
      description: l("Bring your brand’s vision to life with curated lookbooks that tell a visual story, highlighting key pieces and signature styles. From concept development to outfit selection and styling, to photoshoot direction, this service ensures each look is thoughtfully crafted to showcase your brand identity and engage your audience.", "Воплотите видение бренда через продуманный лукбук, который рассказывает визуальную историю, подчёркивает ключевые вещи и фирменный стиль. От концепции и подбора образов до направления съёмки — каждый образ создаётся так, чтобы раскрыть идентичность бренда и вовлечь аудиторию."),
      deliverables: [],
      group: "Commercial Styling",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=86",
      order: 10,
      published: true,
    },
    {
      id: "brand-campaign-styling",
      title: l("Brand Campaign Styling", "Стайлинг бренд-кампании"),
      eyebrow: l("Commercial Styling", "Коммерческий стайлинг"),
      description: l("Bring your brand’s story to life through every image with styling that speaks louder than words. From concept development to outfit curation and on-set direction, each look is carefully crafted to convey your brand’s narrative, highlight key pieces, and create visuals that captivate, inspire, and leave a lasting impression.", "Раскройте историю бренда в каждом кадре через стайлинг, который говорит сильнее слов. От разработки концепции и подбора образов до направления на площадке — каждый образ создаётся, чтобы передать нарратив бренда, выделить ключевые вещи и создать визуалы, которые привлекают, вдохновляют и запоминаются."),
      deliverables: [],
      group: "Commercial Styling",
      image: "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=900&q=86",
      order: 11,
      published: true,
    },
  ],
  portfolioItems: [
    {
      id: "portfolio-cover",
      title: l("Cover", "Обложка"),
      category: "Cover",
      description: l("Magazine cover styling with a clean, graphic fashion direction.", "Стайлинг обложки с чистым графичным модным направлением."),
      images: [image("cover-1", "/ana-photos/cover.png", 1, true, "Large")],
      order: 1,
      published: true,
      featured: true,
    },
    {
      id: "portfolio-editorial",
      title: l("Editorial", "Эдиториал"),
      category: "Editorial",
      description: l("Editorial styling built around mood, proportion, and a precise visual story.", "Эдиториал-стайлинг вокруг настроения, пропорций и точной визуальной истории."),
      images: [image("editorial-1", "/ana-photos/editorial.jpg", 1, true, "Large")],
      order: 2,
      published: true,
      featured: false,
    },
    {
      id: "portfolio-campaign",
      title: l("Campaign", "Кампания"),
      category: "Campaign",
      description: l("Campaign imagery with expressive color, beauty, and commercial impact.", "Кампейн-визуал с выразительным цветом, beauty-настроением и коммерческим эффектом."),
      images: [image("campaign-1", "/ana-photos/campaign.jpg", 1, true, "Medium")],
      order: 3,
      published: true,
      featured: false,
    },
    {
      id: "portfolio-studio",
      title: l("Studio", "Студия"),
      category: "Studio",
      description: l("Studio fashion styling with strong silhouette, hair, and attitude.", "Студийный модный стайлинг с сильным силуэтом, волосами и характером."),
      images: [image("studio-1", "/ana-photos/studio.jpg", 1, true, "Medium")],
      order: 4,
      published: true,
      featured: false,
    },
    {
      id: "portfolio-fashion",
      title: l("Fashion", "Мода"),
      category: "Fashion",
      description: l("Polished fashion styling with a refined Miami mood.", "Премиальный модный стайлинг с утончённым настроением Майами."),
      images: [image("fashion-1", "/ana-photos/fashion.jpg", 1, true, "Large")],
      order: 5,
      published: true,
      featured: false,
    },
  ],
  publications: [
    {
      id: "publication-noir",
      title: l("NOIR Cover", "Обложка NOIR"),
      image: "/ana-photos/publication-noir.png",
      order: 1,
      published: true,
    },
    {
      id: "publication-marie-claire",
      title: l("Marie Claire Cover", "Обложка Marie Claire"),
      image: "/ana-photos/publication-marie-claire.png",
      order: 2,
      published: true,
    },
  ],
};

export const siteCopy = {
  stylistName: initialStudioData.siteCopy.stylistName,
  brandName: initialStudioData.siteCopy.brandName,
  positioning: initialStudioData.content.homepage.positioning.en,
  about: initialStudioData.content.about.body.en,
};

export const services = initialStudioData.services;
export const portfolioItems = initialStudioData.portfolioItems;
