"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { CONTACT } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";

function useNavLinks() {
  const { t } = useI18n();
  return [
    { href: "/", label: t.nav.home },
    { href: "/play/daily", label: t.home.entryDaily },
    { href: "/play", label: t.nav.play },
    { href: "/news", label: t.nav.news },
    { href: "/wiki", label: t.nav.wiki },
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/play") {
    return (
      pathname === "/play" ||
      (pathname.startsWith("/play/") && !pathname.startsWith("/play/daily"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const { t, locale, toggle } = useI18n();
  const pathname = usePathname();
  const links = useNavLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="logo" aria-label={CONTACT.brand}>
          <Image
            src="/logo-poker01-256.png"
            alt={`${CONTACT.brand} logo`}
            width={256}
            height={256}
            className="logo-img"
            sizes="(max-width: 860px) 180px, 240px"
            priority
          />
        </Link>
        <nav className="nav" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(pathname, link.href) ? "nav-link active" : "nav-link"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button type="button" className="lang-toggle" onClick={toggle}>
            {locale === "zh" ? "EN" : "中文"}
          </button>
          <a
            className="btn btn-gold btn-sm header-join"
            href={CONTACT.clubJoinLink}
            target="_blank"
            rel="noreferrer"
          >
            {t.nav.join}
          </a>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls={panelId}
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="nav-toggle-bars" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      <div
        className={`mobile-nav-backdrop${menuOpen ? " open" : ""}`}
        hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />
      <div
        id={panelId}
        className={`mobile-nav-panel${menuOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={t.nav.openMenu}
        hidden={!menuOpen}
      >
        <nav className="mobile-nav" aria-label="Mobile">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(pathname, link.href)
                  ? "mobile-nav-link active"
                  : "mobile-nav-link"
              }
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <a
          className="btn btn-gold"
          href={CONTACT.clubJoinLink}
          target="_blank"
          rel="noreferrer"
          onClick={() => setMenuOpen(false)}
        >
          {t.nav.join}
        </a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div>
          <p className="footer-brand">
            <Image
              src="/logo-poker01-256.png"
              alt={`${CONTACT.brand} logo`}
              width={256}
              height={256}
              className="footer-logo"
              sizes="180px"
            />
          </p>
          <p className="muted">{t.footer.rights}</p>
        </div>
        <div className="footer-contact">
          <p className="footer-label">{t.footer.contact}</p>
          <a href={CONTACT.clubJoinLink} target="_blank" rel="noreferrer">
            {t.footer.club}
          </a>
          <a href={CONTACT.whatsappLink} target="_blank" rel="noreferrer">
            WhatsApp {CONTACT.whatsapp}
          </a>
          <a href={CONTACT.telegramLink} target="_blank" rel="noreferrer">
            Telegram {CONTACT.telegram}
          </a>
        </div>
      </div>
    </footer>
  );
}

export function StickyClubCta() {
  const { t } = useI18n();
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <div className="sticky-cta">
      <div className="shell sticky-cta-inner">
        <span>{t.cta.sticky}</span>
        <div className="sticky-cta-actions">
          <a
            className="btn btn-gold btn-sm"
            href={CONTACT.clubJoinLink}
            target="_blank"
            rel="noreferrer"
          >
            {t.cta.action}
          </a>
          <a
            className="btn btn-ghost btn-sm"
            href={CONTACT.whatsappLink}
            target="_blank"
            rel="noreferrer"
          >
            {t.cta.whatsapp}
          </a>
        </div>
      </div>
    </div>
  );
}
