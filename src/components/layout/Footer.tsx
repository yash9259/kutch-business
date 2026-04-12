import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-surface">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <img
              src="/logo.png"
              alt="kutchh business"
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg object-cover"
            />
            <span className="text-base font-bold text-foreground">kutchh business</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Helping people connect with trusted local opportunities.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">For Candidates</h4>
          <ul className="space-y-2">
            <li><Link to="/jobs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Browse Jobs</Link></li>
            <li><Link to="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Register</Link></li>
            <li><Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">For Employers</h4>
          <ul className="space-y-2">
            <li><Link to="/post-job" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Post a Job</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Contact Us</h4>
          <div className="space-y-2.5">
            <p className="text-sm text-muted-foreground">
              Phone:{" "}
              <a
                href="tel:+918780254591"
                className="hover:text-foreground transition-colors"
              >
                87802 54591
              </a>
            </p>

            <p className="text-sm text-muted-foreground break-all">
              Email:{" "}
              <a
                href="mailto:suppoert@kutchbusiness.com"
                className="hover:text-foreground transition-colors"
              >
                suppoert@kutchbusiness.com
              </a>
            </p>

            <p className="text-sm text-muted-foreground">
              Address:{" "}
              <a
                href="https://www.google.com/maps?q=Shop+4,+Harikrishna+Plaza,+Raghuvanshi+Rd,+near+Sarah's+Academy,+Char+Raasta,+Ravalvadi,+Bhuj,+Gujarat+370001"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Shop 4, Harikrishna Plaza, Bhuj, Gujarat 370001
              </a>
            </p>

            <div className="flex items-center gap-4 pt-1">
              <a
                href="https://www.facebook.com/share/16GoJDMm55/"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
                title="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/harekrishnajobplacement?utm_source=qr&igsh=MTUwYTZhbjRzYm1jbQ=="
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
                title="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/hare-krishna-job-placement-a2066435a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} kutchh business. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
