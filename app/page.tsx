"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  Laptop,
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
import { ServiceCarousel } from "@/components/ui/service-carousel";
import {
  Localidad,
  Oficio,
  OperadorResumen,
  buscarOperadores,
  listarLocalidades,
  listarOficios,
} from "@/lib/public-api";

const LOCALIDAD_PREDETERMINADA = "Colonia del Sacramento";

// Colores del avatar con iniciales, para operadores sin foto de perfil.
const AVATAR_TONES = ["from-blue-500 to-blue-800", "from-emerald-400 to-emerald-800", "from-cyan-500 to-teal-800"];

type Busqueda = { clave: string; operadores: OperadorResumen[]; total: number; pagina: number; error: boolean };

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

const BUSQUEDA_KEY = "servi-cerca-busqueda";

function leerBusquedaGuardada(): { localidadId: number | null; servicio: string } | null {
  try {
    const guardada = JSON.parse(window.sessionStorage.getItem(BUSQUEDA_KEY) ?? "null");
    if (!guardada || typeof guardada.servicio !== "string") return null;
    return {
      localidadId: typeof guardada.localidadId === "number" ? guardada.localidadId : null,
      servicio: guardada.servicio,
    };
  } catch {
    return null;
  }
}

/** Para comparar nombres sin distinguir mayúsculas ni tildes. */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

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
  location,
}: {
  professional: OperadorResumen;
  location: string;
}) {
  const { oficio } = professional;
  const message = encodeURIComponent(
    // A quien trabaja de forma remota no se le nombra la localidad: no hace falta que esté ahí.
    `Hola ${professional.nombre}, te encontré en Servi Cerca. Necesito ${oficio.nombre.toLowerCase()}${professional.trabajoRemoto ? "" : ` en ${location}`}. ¿Podemos coordinar?`,
  );
  const descripcion = oficio.descripcionServicio || professional.descripcionBreve;
  const [fotoRota, setFotoRota] = useState(false);

  return (
    <article className="professional-card">
      <div className="flex items-start gap-4">
        <div
          className={`avatar bg-gradient-to-br ${AVATAR_TONES[professional.id % AVATAR_TONES.length]}`}
          role="img"
          aria-label={`Foto de perfil de ${professional.nombre} ${professional.apellido}`}
        >
          {professional.fotoPerfilUrl && !fotoRota ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL firmada de S3 con vencimiento, no pasa por next/image
            <img
              src={professional.fotoPerfilUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
              onError={() => setFotoRota(true)}
            />
          ) : (
            <span>
              {professional.nombre.charAt(0)}
              {professional.apellido.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.02em]">
                {professional.nombre} {professional.apellido}
              </h3>
              {professional.nombreComercial && (
                <p className="text-sm text-muted-foreground">{professional.nombreComercial}</p>
              )}
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                {professional.cantidadCalificaciones > 0 && professional.calificacionPromedio !== null ? (
                  <>
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    <strong className="text-foreground">{professional.calificacionPromedio.toFixed(1)}</strong>
                    <span>
                      ({professional.cantidadCalificaciones}{" "}
                      {professional.cantidadCalificaciones === 1 ? "reseña" : "reseñas"})
                    </span>
                  </>
                ) : (
                  <span>Sin reseñas todavía</span>
                )}
              </div>
              {professional.trabajoRemoto && (
                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Laptop className="size-4" /> Trabajo remoto
                </div>
              )}
            </div>
            <span className="verified-badge">
              <ShieldCheck className="size-3.5" /> Verificado
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="service-tag active">{oficio.nombre}</span>
        {oficio.precioDesde !== null && (
          <span className="service-tag">
            Desde {oficio.moneda === "USD" ? "US$" : "$U"} {new Intl.NumberFormat("es-UY").format(oficio.precioDesde)}
          </span>
        )}
      </div>

      <p className="mt-4 min-h-[48px] text-[0.95rem] leading-6 text-muted-foreground">{descripcion}</p>

      <div className="mt-5 flex gap-2 border-t border-border/80 pt-5">
        <a
          className="contact-button min-w-0 flex-1 px-3"
          href={`https://wa.me/${professional.whatsapp}?text=${message}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Contactar a ${professional.nombre} por WhatsApp`}
        >
          <MessageCircle className="size-4" />
          Contactar a {professional.nombre}
        </a>
        <Link
          className="more-button"
          href={`/profesional/${professional.id}?servicio=${encodeURIComponent(oficio.nombre)}&localidad=${encodeURIComponent(location)}`}
          aria-label={`Ver más sobre ${professional.nombre} ${professional.apellido}`}
        >
          Ver más
        </Link>
      </div>
    </article>
  );
}

type Tema = "dark" | "light";
const TEMA_KEY = "servi-cerca-theme";
const TEMA_EVENTO = "servi-cerca-theme-change";

// El tema elegido vive en localStorage; el componente lo lee como un dato externo (sin estado propio).
function suscribirTema(avisar: () => void) {
  window.addEventListener(TEMA_EVENTO, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(TEMA_EVENTO, avisar);
    window.removeEventListener("storage", avisar);
  };
}

function temaGuardado(): Tema {
  try {
    return window.localStorage.getItem(TEMA_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export default function Home() {
  // En el servidor (y en el primer render) siempre es el tema oscuro, igual que el HTML inicial.
  const theme = useSyncExternalStore<Tema>(suscribirTema, temaGuardado, () => "dark");
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [oficios, setOficios] = useState<Oficio[] | null>(null);
  const [localidadElegida, setLocalidadElegida] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState("");
  const [busqueda, setBusqueda] = useState<Busqueda | null>(null);
  const [cargandoMas, setCargandoMas] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  // Desplazamiento a los resultados que falta completar cuando terminen de cargar.
  const scrollPendiente = useRef<ScrollBehavior | null>(null);

  const services = useMemo(
    () => (oficios ?? []).map((oficio) => oficio.nombre).sort((a, b) => a.localeCompare(b, "es")),
    [oficios],
  );
  const localidad =
    localidades.find((l) => l.id === localidadElegida) ??
    localidades.find((l) => l.nombre === LOCALIDAD_PREDETERMINADA) ??
    localidades[0] ??
    null;
  // El carrusel puede sugerir un servicio que todavía no existe como trabajo: en ese caso no hay resultados.
  const oficio = useMemo(
    () => (oficios ?? []).find((o) => normalizar(o.nombre) === normalizar(selectedService)) ?? null,
    [oficios, selectedService],
  );
  const localidadId = localidad?.id ?? null;
  const oficioId = oficio?.id ?? null;
  const clave = localidadId !== null && oficioId !== null ? `${localidadId}-${oficioId}` : null;
  const resultado = busqueda && busqueda.clave === clave ? busqueda : null;
  const claveResultado = resultado?.clave ?? null;
  const buscando = selectedService !== "" && (oficios === null || (clave !== null && resultado === null));
  const location = localidad?.nombre ?? "";

  useEffect(() => {
    Promise.all([listarLocalidades().catch(() => []), listarOficios().catch(() => [])]).then(
      ([listaLocalidades, listaOficios]) => {
        setLocalidades(listaLocalidades);
        setOficios(listaOficios);

        // Al volver de la ficha de un profesional se retoma la última búsqueda y se vuelve a los resultados.
        const guardada = leerBusquedaGuardada();
        if (!guardada?.servicio) return;
        if (guardada.localidadId !== null) setLocalidadElegida(guardada.localidadId);
        setSelectedService(guardada.servicio);
        scrollPendiente.current = "instant";
        window.setTimeout(() => resultsRef.current?.scrollIntoView({ block: "start" }), 50);
      },
    );
  }, []);

  // Se guarda solo en esta pestaña (sessionStorage): al cerrar el navegador la búsqueda no queda.
  useEffect(() => {
    if (oficios === null) return;
    try {
      window.sessionStorage.setItem(BUSQUEDA_KEY, JSON.stringify({ localidadId, servicio: selectedService }));
    } catch {
      // Sin acceso al almacenamiento: la búsqueda simplemente no se recuerda.
    }
  }, [oficios, localidadId, selectedService]);

  useEffect(() => {
    if (localidadId === null || oficioId === null) return;
    const claveBuscada = `${localidadId}-${oficioId}`;
    let vigente = true;
    buscarOperadores(localidadId, oficioId)
      .then(
        (r) =>
          vigente &&
          setBusqueda({ clave: claveBuscada, operadores: r.content, total: r.totalElements, pagina: 0, error: false }),
      )
      .catch(() => vigente && setBusqueda({ clave: claveBuscada, operadores: [], total: 0, pagina: 0, error: true }));
    return () => {
      vigente = false;
    };
  }, [localidadId, oficioId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
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
    if (!modelContext?.registerTool || localidades.length === 0 || !oficios || oficios.length === 0) return;

    const lifecycle = new AbortController();
    const tool = {
      name: "stage_professional_search",
      title: "Buscar profesionales",
      description:
        "Selecciona una localidad y un servicio en Servi Cerca, y muestra los profesionales disponibles.",
      inputSchema: {
        type: "object",
        properties: {
          location: { type: "string", enum: localidades.map((l) => l.nombre) },
          service: { type: "string", enum: oficios.map((o) => o.nombre) },
        },
        required: ["location", "service"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: unknown) {
        if (!input || typeof input !== "object") {
          throw new Error("La búsqueda debe incluir localidad y servicio.");
        }
        const { location: nextLocation, service } = input as {
          location?: string;
          service?: string;
        };
        const nuevaLocalidad = localidades.find((l) => l.nombre === nextLocation);
        if (!nuevaLocalidad) {
          throw new Error("La localidad seleccionada no está disponible.");
        }
        const nuevoOficio = oficios.find((o) => o.nombre === service);
        if (!nuevoOficio) {
          throw new Error("El servicio seleccionado no está disponible.");
        }
        setLocalidadElegida(nuevaLocalidad.id);
        setSelectedService(nuevoOficio.nombre);
        const encontrados = await buscarOperadores(nuevaLocalidad.id, nuevoOficio.id);
        return {
          location: nuevaLocalidad.nombre,
          service: nuevoOficio.nombre,
          professionalsFound: encontrados.totalElements,
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
  }, [localidades, oficios]);

  useEffect(() => {
    // Solo al cambiar de búsqueda: al agregar más tarjetas con "Ver más" no se vuelve a animar ni a desplazar.
    if (!claveResultado || !resultsRef.current) return;
    gsap.fromTo(
      resultsRef.current.querySelectorAll(".professional-card, .empty-result"),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power3.out" },
    );
    // Cuando llegan las tarjetas la página crece: se repite el desplazamiento para quedar justo en los resultados.
    if (scrollPendiente.current) {
      resultsRef.current.scrollIntoView({ behavior: scrollPendiente.current, block: "start" });
      scrollPendiente.current = null;
    }
  }, [claveResultado]);

  // Pide la página siguiente de la misma búsqueda y la agrega a las tarjetas ya mostradas.
  async function verMas() {
    if (!resultado || localidadId === null || oficioId === null || cargandoMas) return;
    const claveActual = resultado.clave;
    const siguiente = resultado.pagina + 1;
    setCargandoMas(true);
    try {
      const r = await buscarOperadores(localidadId, oficioId, siguiente);
      // Si mientras tanto se cambió de búsqueda, este resultado ya no corresponde.
      setBusqueda((actual) =>
        actual && actual.clave === claveActual
          ? { ...actual, operadores: [...actual.operadores, ...r.content], total: r.totalElements, pagina: siguiente }
          : actual,
      );
    } catch {
      // Si falla, el botón queda disponible para reintentar.
    } finally {
      setCargandoMas(false);
    }
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(TEMA_KEY, nextTheme);
    } catch {
      // Sin almacenamiento (modo privado estricto): el cambio no se puede recordar.
    }
    window.dispatchEvent(new Event(TEMA_EVENTO));
  }

  // Los resultados quedan debajo del buscador: al elegir se lleva al usuario hasta ellos.
  function irAResultados() {
    // Espera a que el buscador se cierre; en el celular además oculta el teclado, que si no tapa los resultados.
    scrollPendiente.current = "smooth";
    window.setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function selectSuggestedService(service: string) {
    setSelectedService(service);
    if (service) irAResultados();
  }

  function selectLocation(id: number) {
    setLocalidadElegida(id);
    if (selectedService) irAResultados();
  }

  return (
    <main id="inicio" className="relative min-h-screen overflow-hidden">
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
          <div className="mx-auto max-w-195 text-center">
            <span data-animate="intro" className="eyebrow">
              <Image
                src={theme === "light" ? "/images/logo_white.png" : "/images/logo_black.png"}
                alt="Servi Cerca"
                width={2172}
                height={724}
                className="h-20 w-auto"
              />
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
                  value={localidad?.id ?? ""}
                  onChange={(event) => selectLocation(Number(event.target.value))}
                  disabled={localidades.length === 0}
                >
                  {localidades.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
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
                onValueChange={(value) => selectSuggestedService(value ?? "")}
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
                {resultado && !resultado.error && (
                  <p>
                    {resultado.total} {resultado.total === 1 ? "profesional" : "profesionales"}
                  </p>
                )}
              </div>

              {buscando ? (
                <div className="results-placeholder">
                  <Search className="size-5" />
                  Buscando profesionales…
                </div>
              ) : resultado?.error ? (
                <div className="empty-result">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Search className="size-5" />
                  </span>
                  <div>
                    <h3>No pudimos cargar los profesionales</h3>
                    <p>Revisá tu conexión y volvé a intentar en un momento.</p>
                  </div>
                </div>
              ) : resultado && resultado.operadores.length > 0 ? (
                <>
                  <div className="professionals-grid">
                    {resultado.operadores.map((professional) => (
                      <ProfessionalCard key={professional.id} professional={professional} location={location} />
                    ))}
                  </div>
                  {resultado.operadores.length < resultado.total && (
                    <div className="mt-8 flex flex-col items-center gap-2">
                      <Button variant="outline" className="h-11 rounded-xl px-6" onClick={verMas} disabled={cargandoMas}>
                        {cargandoMas ? "Cargando…" : "Ver más profesionales"}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Mostrando {resultado.operadores.length} de {resultado.total}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-result">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Search className="size-5" />
                  </span>
                  <div>
                    <h3>
                      Todavía no hay profesionales de {selectedService.toLowerCase()} en {location}
                    </h3>
                    <p>Probá con otra localidad o con otro servicio.</p>
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
            <Button asChild className="provider-button">
              <Link href="/registro">
                Registrarme para ofrecer mis servicios
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer>
        <div className="container-shell flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <Brand theme={theme} />
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <nav aria-label="Documentos legales" className="flex gap-5">
              <Link href="/terminos" className="hover:text-foreground hover:underline">
                Términos y condiciones
              </Link>
              <Link href="/privacidad" className="hover:text-foreground hover:underline">
                Política de privacidad
              </Link>
            </nav>
            <p>© 2026 Servi Cerca · Todos los derechos reservados.</p>
          </div>
        </div>
        <div className="container-shell pb-8">
          <a
            href="https://www.brandercloud.com"
            target="_blank"
            rel="noopener noreferrer"
            className="developer-credit"
            aria-label="Desarrollado por Brander Cloud (se abre en una pestaña nueva)"
          >
            <span>Desarrollado por</span>
            <Image src="/images/brander.png" alt="Brander Cloud" width={1200} height={630} sizes="224px" />
          </a>
        </div>
      </footer>
    </main>
  );
}
