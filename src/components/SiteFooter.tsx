import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-2/40 mt-12">
      <div className="max-w-[1200px] mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Practice</h2>
          <ul className="space-y-2">
            <li><Link to="/practice" className="hover:text-primary">SQL Practice</Link></li>
            <li><Link to="/python" className="hover:text-primary">Python Coding</Link></li>
            <li><Link to="/java" className="hover:text-primary">Java Coding</Link></li>
            <li><Link to="/pyspark" className="hover:text-primary">PySpark</Link></li>
            <li><Link to="/cpp" className="hover:text-primary">C / C++ Coding</Link></li>
            <li><Link to="/gcp" className="hover:text-primary">GCP Data Engineer</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Learn</h2>
          <ul className="space-y-2">
            <li><Link to="/tutorial" className="hover:text-primary">MySQL Tutorial</Link></li>
            <li><Link to="/engine" className="hover:text-primary">Interview Engine</Link></li>
            <li><Link to="/chat" className="hover:text-primary">AI Chat Mentor</Link></li>
            <li><Link to="/interview" className="hover:text-primary">Live AI Interview</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Company</h2>
          <ul className="space-y-2">
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
            <li><Link to="/feedback" className="hover:text-primary">Send feedback</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Legal</h2>
          <ul className="space-y-2">
            <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-primary">Terms of Use</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-[11px] font-mono text-muted-foreground">
        © {new Date().getFullYear()} Smart AI Code Playground
      </div>
    </footer>
  );
}