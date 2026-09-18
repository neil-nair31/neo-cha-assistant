import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.tsx";
import { Home } from "./pages/Home.tsx";
import { About } from "./pages/About.tsx";
import { Industries } from "./pages/Industries.tsx";
import { Expertise } from "./pages/Expertise.tsx";
import { KnowYourCustomer } from "./pages/KnowYourCustomer.tsx";
import { News } from "./pages/News.tsx";
import { Blogs } from "./pages/Blogs.tsx";
import { CustomsNotifications } from "./pages/CustomsNotifications.tsx";
import { Careers } from "./pages/Careers.tsx";
import { Financials } from "./pages/Financials.tsx";
import { Contact } from "./pages/Contact.tsx";
import { HsFinder } from "./pages/HsFinder.tsx";
import { ClientPortal } from "./pages/ClientPortal.tsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about-us" element={<About />} />
        <Route path="core-industries" element={<Industries />} />
        <Route path="our-expertise" element={<Expertise />} />
        <Route path="know-your-customer" element={<KnowYourCustomer />} />
        <Route path="news" element={<News />} />
        <Route path="blogs" element={<Blogs />} />
        <Route path="customs-notification" element={<CustomsNotifications />} />
        <Route path="hs-code-finder" element={<HsFinder />} />
        <Route path="client-portal" element={<ClientPortal />} />
        <Route path="career-list" element={<Careers />} />
        <Route path="financials" element={<Financials />} />
        <Route path="contact-us" element={<Contact />} />
        <Route path="contact" element={<Navigate to="/contact-us" replace />} />
      </Route>
    </Routes>
  );
}
