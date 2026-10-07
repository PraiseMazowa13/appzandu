import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Zap, Heart, Target } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — Zandu" },
      { name: "description", content: "L'histoire et la mission de Zandu, votre boutique express en RDC." },
      { property: "og:title", content: "À propos — Zandu" },
      { property: "og:description", content: "L'histoire et la mission de Zandu, votre boutique express en RDC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          <Zap className="h-3.5 w-3.5" /> Notre histoire
        </span>
        <h1 className="mt-4 font-display text-4xl font-black md:text-5xl">
          Zandu, la rapidité au service de vos essentiels
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          Zandu est née d'une idée simple : permettre à chacun, partout en République Démocratique
          du Congo, d'accéder rapidement aux produits du quotidien sans tracas et sans
          intermédiaire.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-soft">
              <Heart className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-xl font-black">Notre histoire</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Fondée à Kinshasa, Zandu rassemble une petite équipe passionnée par le commerce
              digital. Nous croyons qu'un service local de qualité, doublé d'une livraison
              express, peut transformer la manière de consommer en RDC.
            </p>
          </article>
          <article className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-soft">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-xl font-black">Notre mission</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Offrir une sélection rigoureuse de produits, un paiement Mobile Money sécurisé et
              une livraison fiable — pour rendre chaque achat aussi simple qu'un message
              WhatsApp.
            </p>
          </article>
        </div>

        <div className="mt-12 rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-float md:p-10">
          <h2 className="font-display text-2xl font-black md:text-3xl">Nous contacter</h2>
          <p className="mt-2 opacity-90">Une question ? Nous sommes là pour vous.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <a
              href="tel:+243895975170"
              className="flex items-center gap-3 rounded-2xl bg-background/15 p-4 backdrop-blur-md hover:bg-background/25"
            >
              <Phone className="h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs opacity-75">Téléphone</p>
                <p className="truncate font-bold">0895 975 170</p>
              </div>
            </a>
            <a
              href="https://wa.me/243895975170"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-background/15 p-4 backdrop-blur-md hover:bg-background/25"
            >
              <Mail className="h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs opacity-75">WhatsApp</p>
                <p className="truncate font-bold">+243 895 975 170</p>
              </div>
            </a>
            <div className="flex items-center gap-3 rounded-2xl bg-background/15 p-4 backdrop-blur-md">
              <MapPin className="h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs opacity-75">Localisation</p>
                <p className="truncate font-bold">Kinshasa, RDC</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Link
              to="/catalogue"
              className="inline-flex rounded-full bg-background px-6 py-3 text-sm font-bold text-foreground shadow-soft hover:bg-card"
            >
              Découvrir nos produits
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
