import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import "@/App.css";
import { I18nProvider } from "@/i18n/I18nContext";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Landing from "@/pages/Landing";
import Catalog from "@/pages/Catalog";
import PackagingDetail from "@/pages/PackagingDetail";
import Compare from "@/pages/Compare";
import Submit from "@/pages/Submit";
import About from "@/pages/About";
import Gallery from "@/pages/Gallery";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="App paper-grain" data-testid="app-root">
      <HelmetProvider>
        <I18nProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Nav />
            <main className="relative z-[2]">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/packaging/:id" element={<PackagingDetail />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/submit" element={<Submit />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </main>
            <Footer />
          </BrowserRouter>
        </I18nProvider>
      </HelmetProvider>
    </div>
  );
}
