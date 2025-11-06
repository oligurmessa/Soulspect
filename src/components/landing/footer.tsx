"use client"
import { FC } from "react";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

const montserrat = Montserrat({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
});

const socialLinks = [
  {
    href: "https://twitter.com/getsoulspect",
    label: "Twitter",
    icon: <Twitter className="h-5 w-5" />,
  },
  {
    href: "https://github.com/OliGurMessa/soulspect",
    label: "GitHub",
    icon: <Github className="h-5 w-5" />,
  },
];

const mainLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const legalLinks = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
];

const Footer: FC = () => {
  return (
    <footer className="bg-gray-100 dark:bg-[#0e0f11] border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-start">
            <Link href="/" className="flex items-center gap-x-2" aria-label="Soulspect">
              <span className={`font-bold text-2xl ${montserrat.className}`}>
                soulspect
              </span>
            </Link>
            <p className="text-muted-foreground mt-4 text-sm max-w-xs">
            your personal intelligence.
            </p>
          </div>
          <div className="grid grid-cols-2 md:col-span-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg">Navigate</h3>
              <ul className="mt-4 space-y-2">
                {mainLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Legal</h3>
              <ul className="mt-4 space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Soulspect. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
