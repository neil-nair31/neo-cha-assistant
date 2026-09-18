export type Service = {
  id: string;
  title: string;
  description: string;
  iconSrc: string;
};

export const services: Service[] = [
  {
    id: "customs",
    title: "Licensed Customs Broker",
    description:
      "All imported and exported items meet regulations, packing standards, laws, and statutory requirements.",
    iconSrc: "/images/Licensed Customs Broker.png",
  },
  {
    id: "aeo",
    title: "AEO–LO Authorization",
    description:
      "Benefits offered by AEO as our entity meets compliance criteria and supply chain security standards.",
    iconSrc: "/images/AEO icon.png",
  },
  {
    id: "transport",
    title: "Transportation",
    description:
      "Effective, well-organised shipment options tailor-made from end to end.",
    iconSrc: "/images/Transportation-icon.png",
  },
  {
    id: "steamer",
    title: "Steamer Agent",
    description:
      "Services in connection with the ship's husbandry or dispatch performed effectively.",
    iconSrc: "/images/steamer-icon.png",
  },
  {
    id: "stevedore",
    title: "Stevedore Agent",
    description:
      "Cargo operations performed with top-notch care and professional expertise.",
    iconSrc: "/images/Stevedore-icon.png",
  },
  {
    id: "freight",
    title: "Freight Forwarding",
    description:
      "Shipment of goods from the seller's premises to the buyer's specified location, fully coordinated.",
    iconSrc: "/images/freight-forwarding.png",
  },
  {
    id: "warehouse",
    title: "Warehousing",
    description:
      "Goods stored in a scientific, organised manner to maintain their value and quality.",
    iconSrc: "/images/Warehousing.png",
  },
  {
    id: "multimodal",
    title: "Multimodal Transport Operator",
    description:
      "Multimodal transport contracts taken in charge with full responsibility and liability.",
    iconSrc: "/images/Multimodal.png",
  },
  {
    id: "console",
    title: "Console Agent",
    description:
      "Cargo consigned to respective overseas counterparts at the destination of consignee.",
    iconSrc: "/images/console.png",
  },
  {
    id: "shipping",
    title: "Shipping Line",
    description:
      "Shipping operations from load port to discharge port managed competently.",
    iconSrc: "/images/shipping.png",
  },
];

export const shippingSteps = [
  {
    step: "01",
    title: "Register with us",
    body: "Fill the contact form, and our client onboarding team will contact you",
    image: "/images/regi.png",
  },
  {
    step: "02",
    title: "Service contract",
    body: "Read and agree to the terms of service to sign the contract",
    image: "/images/service.png",
  },
  {
    step: "03",
    title: "Start shipping",
    body: "Simply hand over the products from your preferred location and we will take care",
    image: "/images/start shipping.png",
  },
];

export const marqueeItems = [
  "Licensed Customs Broker",
  "AEO–LO Authorized",
  "Cochin & Chennai Ports",
  "Freight Forwarding",
  "Warehousing",
  "Multimodal Transport",
  "24/7 Operations",
  "Mining Logistics",
  "Extending the Limits",
  "Since 2007",
  "Neo Group Flagship",
  "JSW Steel · NGS · Solange",
];
