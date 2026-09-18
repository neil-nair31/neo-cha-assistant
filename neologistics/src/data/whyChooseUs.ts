export type WhyUsItem = {
  title: string;
  body: string;
  icon: "transparency" | "team" | "delivery" | "expertise";
};

export const whyChooseUs: WhyUsItem[] = [
  {
    title: "Transparency",
    icon: "transparency",
    body: "Honest and Open communication with the customers about matters related to the business.",
  },
  {
    title: "Dedicated team",
    icon: "team",
    body: "A well focused and adaptable working team monitoring the customer services.",
  },
  {
    title: "On-time delivery",
    icon: "delivery",
    body: "We work for companies which needs special care for the Cargo and in time receipt of raw materials at their factory and also six sigma for their logistics.",
  },
  {
    title: "Strong expertise",
    icon: "expertise",
    body: "All kinds of Logistics skills are incorporated with high quality expertise. Greater delivery productivity and efficiency.",
  },
];
