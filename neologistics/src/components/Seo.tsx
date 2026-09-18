import { Helmet } from "react-helmet-async";
import { site } from "../data/site.ts";

export function Seo({ title, description }: { title: string; description: string }) {
  const fullTitle = `${title} | ${site.name}`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={site.domain} />
      <meta property="og:type" content="website" />
      <link rel="canonical" href={site.domain} />
    </Helmet>
  );
}
