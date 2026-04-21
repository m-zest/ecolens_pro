import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer data-testid="main-footer" className="border-t border-forest/10 mt-32">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="display-serif text-4xl text-forest leading-none">
            Packaging, <em className="text-terracotta not-italic italic">honestly.</em>
          </div>
          <p className="mt-5 text-forest/70 max-w-md text-[15px] leading-relaxed">
            EcoLens translates opaque LCA data into narratives shoppers can actually act on. Built on the
            D4PACK methodology for the Central European food sector.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-4">Explore</div>
          <ul className="space-y-2 text-[15px]">
            <li><Link to="/catalog" className="link-underline">Catalogue</Link></li>
            <li><Link to="/compare" className="link-underline">Compare</Link></li>
            <li><Link to="/submit" className="link-underline">Submit packaging</Link></li>
            <li><Link to="/about" className="link-underline">Method & data</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4">Provenance</div>
          <ul className="space-y-2 text-[15px] text-forest/75">
            <li>D4PACK EU programme</li>
            <li>Ecoinvent v3.9 reference</li>
            <li>EU PEF guidance</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-forest/10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-xs text-forest/55 font-mono">
            © {new Date().getFullYear()} EcoLens — a D4PACK Hackathon project
          </div>
          <div className="text-xs text-forest/55">
            Figures are illustrative. Not for regulatory labelling.
          </div>
        </div>
      </div>
    </footer>
  );
}
