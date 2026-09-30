"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  MessageCircle,
  Moon,
  Search,
  ShieldCheck,
  Star,
  Sun,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  eventServiceNames,
  ServiceCarousel,
} from "@/components/ui/service-carousel";

const locations = [
  "Colonia del Sacramento",
  "Rosario",
  "Nueva Helvecia",
  "Nueva Palmira",
  "Carmelo",
  "Conchillas",
  "Miguelete",
  "Juan Lacaze",
];

const services = [
  "Albañil",
  "Carpintero",
  "Cerrajero",
  "Cortador de pasto",
  "Electricista",
  "Escribano",
  "Instalador de aire acondicionado",
  "Jardinero",
  "Pintor",
  "Plomero",
  "Podador",
  "Técnico de electrodomésticos",
  ...eventServiceNames,
].sort((a, b) => a.localeCompare(b, "es"));

type Professional = {
  name: string;
  initials: string;
  rating: string;
  reviews: number;
  services: string[];
  description: string;
  response: string;
  phone: string;
  tone: string;
};

type WebMcpContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

const professionals: Professional[] = [
  {
    name: "Martín Silva",
    initials: "MS",
    rating: "4.9",
    reviews: 38,
    services: ["Carpintero", "Cerrajero", "Albañil"],
    description:
      "Soluciones prolijas para el hogar, muebles a medida y reparaciones generales.",
    response: "Responde en menos de 20 min",
    phone: "59899123456",
    tone: "from-blue-500 to-blue-800",
  },
  {
    name: "Lucía Fernández",
    initials: "LF",
    rating: "5.0",
    reviews: 24,
    services: [
      "Carpintero",
      "Electricista",
      "Instalador de aire acondicionado",
      "Técnico de electrodomésticos",
    ],
    description:
      "Instalaciones seguras, diagnósticos claros y presupuesto antes de comenzar.",
    response: "Disponible hoy",
    phone: "59898765432",
    tone: "from-emerald-400 to-emerald-800",
  },
  {
    name: "Diego Pereira",
    initials: "DP",
    rating: "4.8",
    reviews: 51,
    services: ["Carpintero", "Podador", "Cortador de pasto", "Jardinero"],
    description:
      "Cuidado de jardines, poda responsable y mantenimiento de terrenos.",
    response: "Responde en menos de 1 hora",
    phone: "59895678901",
    tone: "from-cyan-500 to-teal-800",
  },
];

function Brand({ theme }: { theme: "dark" | "light" }) {
  return (
    <a href="#inicio" className="brand" aria-label="Servi Cerca, inicio">
      <Image
        src={theme === "light" ? "/images/logo_white.png" : "/images/logo_black.png"}
        alt="Servi Cerca"
        width={2172}
        height={724}
        priority
        className="h-9 w-auto"
      />
    </a>
  );
}

function ProfessionalCard({
  professional,
  selectedService,
  location,
}: {
  professional: Professional;
  selectedService: string;
  location: string;
}) {
  const message = encodeURIComponent(
    `Hola ${professional.name}, te encontré en Servi Cerca. Necesito ${selectedService.toLowerCase()} en ${location}. ¿Podemos coordinar?`,
  );

  return (
    <article className="professional-card">
      <div className="flex items-start gap-4">
        <div
          className={`avatar bg-gradient-to-br ${professional.tone}`}
          role="img"
          aria-label={`Foto de perfil de ${professional.name}`}
        >
          <span>{professional.initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.02em]">
                {professional.name}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <strong className="text-foreground">{professional.rating}</strong>
                <span>({professional.reviews} reseñas)</span>
              </div>
            </div>
            <span className="verified-badge">
              <ShieldCheck className="size-3.5" /> Verificado
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {professional.services.map((service) => (
          <span
            className={
              service === selectedService ? "service-tag active" : "service-tag"
            }
            key={service}
          >
            {service}
          </span>
        ))}
      </div>

      <p className="mt-4 min-h-[48px] text-[0.95rem] leading-6 text-muted-foreground">
        {professional.description}
      </p>

      <div className="mt-5 flex flex-col gap-3 border-t border-border/80 pt-5">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 className="size-4 text-emerald-400" />
          {professional.response}
        </span>
        <a
          className="contact-button"
          href={`https://wa.me/${professional.phone}?text=${message}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Contactar a ${professional.name} por WhatsApp`}
        >
          <MessageCircle className="size-4" />
          Contactar a {professional.name.split(" ")[0]}
        </a>
      </div>
    </article>
  );
}

function RegistrationForm() {
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
        <span className="mb-5 grid size-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <Check className="size-8" />
        </span>
        <h3 className="text-2xl font-semibold tracking-[-0.03em]">
          ¡Recibimos tus datos!
        </h3>
        <p className="mt-3 max-w-sm leading-6 text-muted-foreground">
          Esta es una confirmación demo. Cuando conectemos el backend, el registro
          quedará guardado para su revisión.
        </p>
        <Button className="mt-7" variant="outline" onClick={() => setSent(false)}>
          Volver al formulario
        </Button>
      </div>
    );
  }

  return (
    <form className="registration-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Nombre completo
          <input required placeholder="Ej. Ana Rodríguez" />
        </label>
        <label>
          WhatsApp
          <input required inputMode="tel" placeholder="Ej. 099 123 456" />
        </label>
      </div>
      <label>
        Localidad
        <select defaultValue="Colonia del Sacramento">
          {locations.map((location) => (
            <option key={location}>{location}</option>
          ))}
        </select>
      </label>
      <label>
        Servicios que ofrecés
        <input required placeholder="Ej. Carpintería, reparaciones, muebles" />
      </label>
      <label>
        Contanos brevemente sobre tu trabajo
        <textarea
          rows={3}
          placeholder="Experiencia, horarios y zona en la que trabajás..."
        />
      </label>
      <Button type="submit" className="h-12 w-full rounded-xl">
        Enviar solicitud <ArrowRight className="size-4" />
      </Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        Al enviar aceptás que Servi Cerca revise la información antes de publicar
        tu perfil.
      </p>
    </form>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [location, setLocation] = useState("Colonia del Sacramento");
  const [selectedService, setSelectedService] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const matches = useMemo(
    () =>
      selectedService
        ? professionals.filter((professional) =>
            professional.services.includes(selectedService),
          )
        : [],
    [selectedService],
  );

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("servi-cerca-theme");
    const initialTheme = savedTheme === "light" ? "light" : "dark";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;

    const context = gsap.context(() => {
      gsap.from("[data-animate='intro']", {
        y: 24,
        opacity: 0,
        duration: 0.75,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, heroRef);

    return () => context.revert();
  }, []);

  useEffect(() => {
    const modelContext = (
      document as Document & { modelContext?: WebMcpContext }
    ).modelContext;
    if (!modelContext?.registerTool) return;

    const lifecycle = new AbortController();
    const tool = {
      name: "stage_professional_search",
      title: "Buscar profesionales",
      description:
        "Selecciona una localidad y un servicio en Servi Cerca, y muestra los profesionales demo disponibles.",
      inputSchema: {
        type: "object",
        properties: {
          location: { type: "string", enum: locations },
          service: { type: "string", enum: services },
        },
        required: ["location", "service"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        if (!input || typeof input !== "object") {
          throw new Error("La búsqueda debe incluir localidad y servicio.");
        }
        const { location: nextLocation, service } = input as {
          location?: string;
          service?: string;
        };
        if (!nextLocation || !locations.includes(nextLocation)) {
          throw new Error("La localidad seleccionada no está disponible.");
        }
        if (!service || !services.includes(service)) {
          throw new Error("El servicio seleccionado no está disponible.");
        }
        setLocation(nextLocation);
        setSelectedService(service);
        return {
          location: nextLocation,
          service,
          professionalsFound: professionals.filter((professional) =>
            professional.services.includes(service),
          ).length,
        };
      },
    };

    try {
      void Promise.resolve(
        modelContext.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => undefined);
    } catch {
      // WebMCP is optional and not available in every browser yet.
    }

    return () => lifecycle.abort();
  }, []);

  useEffect(() => {
    if (!selectedService || !resultsRef.current) return;
    gsap.fromTo(
      resultsRef.current.querySelectorAll(".professional-card, .empty-result"),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power3.out" },
    );
  }, [selectedService, location]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("servi-cerca-theme", nextTheme);
  }

  function selectSuggestedService(service: string) {
    setSelectedService(service);

    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <main id="inicio" className="min-h-screen overflow-hidden">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="site-header">
        <div className="container-shell flex h-[74px] items-center justify-between">
          <Brand theme={theme} />
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span className="hidden sm:inline">
              {theme === "dark" ? "Tema claro" : "Tema oscuro"}
            </span>
          </button>
        </div>
      </header>

      <section ref={heroRef} className="hero-section">
        <div className="container-shell relative z-10">
          <div className="mx-auto max-w-[780px] text-center">
            <span data-animate="intro" className="eyebrow">
              <Image
                src={theme === "light" ? "/images/logo_white.png" : "/images/logo_black.png"}
                alt="Servi Cerca"
                width={2172}
                height={724}
                className="h-5 w-auto"
              />
              Profesionales de tu zona
            </span>
            <h1 data-animate="intro" className="hero-title">
              Encontrá a quien lo hace <em>cerca.</em>
            </h1>
            <p data-animate="intro" className="hero-copy">
              Contactá directamente
              por WhatsApp, sin vueltas.
            </p>
          </div>

          <div data-animate="intro" className="search-panel">
            <div className="search-field">
              <label htmlFor="location">
                <MapPin className="size-4" /> Ubicación
              </label>
              <div className="select-wrap">
                <select
                  id="location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                >
                  {locations.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown className="size-4" aria-hidden="true" />
              </div>
            </div>

            <div className="search-divider" aria-hidden="true" />

            <div className="search-field service-field">
              <label>
                <BriefcaseBusiness className="size-4" /> Trabajo a realizar
              </label>
              <Combobox
                items={services}
                value={selectedService}
                onValueChange={(value) => setSelectedService(value ?? "")}
              >
                <ComboboxInput
                  className="service-combobox"
                  placeholder="Escribí un servicio..."
                  showClear
                  aria-label="Buscar trabajo o servicio"
                />
                <ComboboxContent className="service-options">
                  <ComboboxEmpty>No encontramos ese servicio.</ComboboxEmpty>
                  <ComboboxList>
                    {(service: string) => (
                      <ComboboxItem key={service} value={service}>
                        <Search className="size-4 text-muted-foreground" />
                        {service}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>

          
        </div>
      </section>

      <ServiceCarousel onSelect={selectSuggestedService} />

      <section ref={resultsRef} className="results-section" aria-live="polite">
        <div className="container-shell">
          {selectedService ? (
            <>
              <div className="results-heading">
                <div>
                  <span className="section-kicker">Resultados en {location}</span>
                  <h2>
                    {selectedService} <span>cerca tuyo</span>
                  </h2>
                </div>
                <p>
                  {matches.length} {matches.length === 1 ? "profesional" : "profesionales"}
                </p>
              </div>

              {matches.length > 0 ? (
                <div className="professionals-grid">
                  {matches.map((professional) => (
                    <ProfessionalCard
                      key={professional.name}
                      professional={professional}
                      selectedService={selectedService}
                      location={location}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-result">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Search className="size-5" />
                  </span>
                  <div>
                    <h3>Todavía no hay perfiles demo para este servicio</h3>
                    <p>
                      Probá con Carpintero, Electricista, Cerrajero, Podador o
                      Cortador de pasto.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="results-placeholder">
              <Search className="size-5" />
              Seleccioná un servicio para ver profesionales disponibles.
            </div>
          )}
        </div>
      </section>

      <section className="provider-section">
        <div className="container-shell">
          <div className="provider-card">
            <div className="provider-icon" aria-hidden="true">
              <Wrench className="size-6" />
            </div>
            <div className="flex-1">
              <span className="section-kicker">Para trabajadores independientes</span>
              <h2>¿Querés ofrecer tus servicios?</h2>
              <p>
                Creá tu perfil y conectá con personas de tu zona que necesitan lo
                que sabés hacer.
              </p>
            </div>
            <Dialog open={registrationOpen} onOpenChange={setRegistrationOpen}>
              <DialogTrigger asChild>
                <Button className="provider-button">
                  Registrarme para ofrecer mis servicios
                  <ArrowRight className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="registration-dialog">
                <DialogHeader>
                  <DialogTitle>Sumate a Servi Cerca</DialogTitle>
                  <DialogDescription>
                    Completá tus datos para crear una solicitud de perfil profesional.
                  </DialogDescription>
                </DialogHeader>
                <RegistrationForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <footer>
        <div className="container-shell flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <Brand theme={theme} />
          <p>© 2026 Servi Cerca · Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
