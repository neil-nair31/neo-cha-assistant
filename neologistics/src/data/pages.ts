export type NavItem =
  | { label: string; to: string }
  | { label: string; children: { label: string; to: string }[] };

export const navLinks: NavItem[] = [
  { label: "Home", to: "/" },
  {
    label: "About us",
    children: [{ label: "Who we are", to: "/about-us" }],
  },
  { label: "Industries", to: "/core-industries" },
  { label: "Our Expertise", to: "/our-expertise" },
  { label: "Know your customer", to: "/know-your-customer" },
  {
    label: "Media center",
    children: [
      { label: "News", to: "/news" },
      { label: "Blogs", to: "/blogs" },
      { label: "Customs Notifications", to: "/customs-notification" },
    ],
  },
  { label: "India HS / CTH Finder", to: "/hs-code-finder" },
  { label: "Client Portal", to: "/client-portal" },
  { label: "Career", to: "/career-list" },
  { label: "Financials", to: "/financials" },
  { label: "Contact us", to: "/contact-us" },
];

export const aboutContent = {
  title: "About us",
  sections: [
    {
      heading: "Who we are",
      paragraphs: [
        "Neo Logistics, a private partnership Licensed Customs Broker formed in the year 2007 have been involved providing Logistics support in the field of shipping, Freight Forwarding, Transportation, Warehousing, Console agent, Steamer agent and stevedoring of wide range of products of core Industries viz Steel, Cement, Textiles, Chemicals etc, agro products like Cashew, aquatic products like shrimps and prawns and Automobiles like Light Commercial Vehicles etc. Over 15 years since its inception, Neo Logistics have grown in its stature over a period of time and have become one of the leading Licensed Customs Broker in Port Cochin. The sustained success of Neo Logistics is largely attributable to expertise of work force, deliverables commitment to customers and thereby their satisfaction, knowledge on the dynamics of logistic functions and most importantly upholding of business ethics.",
        "The attributes cited have kept Neo Logistics in good stead and over the years have become a robust entity poised to grow in terms of increased customer base, volume of cargo, enhanced product portfolio and visible presence at different Indian and foreign ports. Neo Logistics as it stands today handles around 8000 to 10000 containers annually with the transactional value of the cargo running in to millions. This is in addition to break bulk cargo and inland transportation of materials including over dimensional cargo.",
        "We are into mining transportation of Iron ore from mines to various locations around India. Various works include handling of rakes involving loading and unloading from them.",
        "In 15 long years of service to Trade, Neo Logistics have performed many demanding tasks and notable among them which is worthy of special mention and academically relevant case study in Logistics curriculum was its handling of multi-mode transportation a 5 PL logistics successfully carried out for JSW Steel Ltd, Salem involving Road-Rail-Sea-Rail and Road modes. Movement flow being 1. By road from Salem to ICD, Coimbatore which is 200 kms away. 2 From ICD Coimbatore to Port Cochin by Rail. 3. From Port Cochin to Port Mundra, Gujarat by Sea. 4 from Port Mundra to nearest rail head to destination by Rail. 5. Move by road for last mile reach. Multiple handling at during different stages of movement were also part of this operation. Notwithstanding a few days of delay of extended sailing due to rough weather, an act of God finally it was all is well that ends well. It was trial by fire for Neo Logistics. Yet it scripted a successful movement and all because Neo Logistics trusted it's potential.",
      ],
    },
    {
      heading: "Vision",
      body: "Neo logistics focus on the growth through sustained logistics by providing a service with excellence to our esteemed clients. We always strive to ensure quality in every aspects of our role as a logistics service provider with end to end supply chain solutions. Always upgrading ourselves in all logistics challenges and ensuring total quality control in supply chain.",
    },
    {
      heading: "Mission",
      body: "We are fully committed to serve unique and innovative supply chain solutions to all our customers ensuring timely delivery of service and materials. Through our professional expertise, we achieved a high standard of performance excellence and are deeply aware of environmental and safety conditions. We endure for sustainable and long term relationship for mutual benefit.",
    },
  ],
  certifications: ["FFI", "AEO", "MSME", "MTO"],
  membership: ["ICC", "CCBA"],
};

export const industriesContent = {
  title: "Industries",
  intro:
    "With almost 20 years of experience in the transportation industry, Neo logistics have developed shipping, storage, distribution and value added solutions customized to the needs of a variety of industries.",
  items: [
    { title: "Industrial raw materials", body: "Neo logistics help manufacturers reduce inventory and streamline the transport of industrial raw materials." },
    { title: "Chemical", body: "Special initiatives are taken in handling and storing complex and myriad chemical products to prevent safety hazards." },
    { title: "Automobiles", body: "A well designed supply chain management is specifically engaged for the automobiles industry." },
    { title: "Mining", body: "Depending on the mine location and the supply chain complexity, intricate logistics and transport needs are provided." },
    { title: "Textiles", body: "We provide high expertise in all stages of transportation in textile industry within the perfect time frame and brings you delighters in the business circles." },
    { title: "Agro products", body: "An effective storage and material flow is provided from the origin sources of agricultural production to the required destination." },
    { title: "Sanitary wares", body: "Sanitaryware industry includes a wide array of products like washbasins, water closets, bath tubs etc. which is dealed with high care and efficiency." },
  ],
};

export const expertiseContent = {
  title: "Our Expertise",
  intro:
    "Neo logistics is an entity that designs, controls, and manages your company's supply chain with Professional expertise. We ensure that we provide fast, accurate, and quality service on your end to end needs.",
  services: [
    { title: "Customs Brokerage", body: "All the imported and exported items meet all the regulations, packing, laws and other requirements." },
    { title: "Warehouse facilities", body: "Storing goods in a scientific and organised manner to maintain their value and quality." },
    { title: "Transportation", body: "Effective and well organised shipment options tailor-made from end to end" },
    { title: "Freight forwarding", body: "The shipment of goods from the seller's space to the buyer's specified location is fulfilled with coordination." },
    { title: "Vessel Agent", body: "Services in connection with the ship's husbandry or dispatch is performed effectively" },
    { title: "Stevedore", body: "The cargo operations are performed with top-notch care and professional expertise." },
    { title: "Console Agent", body: "The cargo is consigned to the respective overseas counterpart at the destination of consignee" },
  ],
  transportation:
    "Neo logistics has been thoughtful in understanding the requirement of strong alliances throughout and hence we have been successful in establishing a very strong network all around for any of your transportation needs via sea, road or rail.",
};

export const financialsContent = {
  title: "Financials",
  intro:
    "Over 15 years since its inception, Neo Logistics have grown in its stature over a period of time and have become one of the leading Licensed Customs Broker in Port Cochin. Understand our financial performance better through detailed performance reports and presentations",
  reports: [
    { title: "ITR 2021-22", href: "https://www.neologistics.org/financial-details/3/" },
    { title: "ITR 2020-21", href: "https://www.neologistics.org/financial-details/4/" },
    { title: "ITR 2019-20", href: "https://www.neologistics.org/financial-details/5/" },
  ],
};

export const customsNotifications = [
  { title: "CBIC NOTIFICATION NO.47/2015-2020", href: "https://www.neologistics.org/notification-detail/5/" },
  { title: "AUSTRALIAN FUMIGATION", excerpt: "AUSTRALIAN FUMIGATION", href: "https://www.neologistics.org/notification-detail/3/" },
  { title: "CERTIFICATE OF ORIGIN", excerpt: "CERTIFICATE OF ORIGIN", href: "https://www.neologistics.org/notification-detail/4/" },
];
