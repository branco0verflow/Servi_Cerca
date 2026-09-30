"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import {
  Armchair,
  CakeSlice,
  Camera,
  Candy,
  Flower2,
  Gift,
  Mail,
  Martini,
  Music2,
  PartyPopper,
  Scissors,
  Smile,
  Sparkles,
  Utensils,
  Video,
  type LucideIcon,
} from "lucide-react";

type ServiceCategory = {
  name: string;
  icon: LucideIcon;
};

const serviceCategories: ServiceCategory[] = [
  { name: "Fotografía", icon: Camera },
  { name: "Pastelería", icon: CakeSlice },
  { name: "Desayunos personalizados", icon: Gift },
  { name: "Decoración de eventos", icon: PartyPopper },
  { name: "Catering", icon: Utensils },
  { name: "Mesas dulces", icon: Candy },
  { name: "Bartender", icon: Martini },
  { name: "DJ y sonido", icon: Music2 },
  { name: "Filmación", icon: Video },
  { name: "Maquillaje", icon: Sparkles },
  { name: "Peinados", icon: Scissors },
  { name: "Florería", icon: Flower2 },
  { name: "Animación infantil", icon: Smile },
  { name: "Alquiler de mobiliario", icon: Armchair },
  { name: "Invitaciones personalizadas", icon: Mail },
];

export const eventServiceNames = serviceCategories.map(({ name }) => name);

type ServiceCarouselProps = {
  onSelect?: (service: string) => void;
};

function CategoryGroup({
  duplicated = false,
  onSelect,
}: {
  duplicated?: boolean;
  onSelect?: (service: string) => void;
}) {
  return (
    <div
      className="flex shrink-0 gap-2 pr-2"
      aria-hidden={duplicated || undefined}
    >
      {serviceCategories.map(({ name, icon: Icon }) => (
        <button
          key={`${duplicated ? "copy" : "original"}-${name}`}
          type="button"
          tabIndex={duplicated ? -1 : 0}
          className="group flex h-11 shrink-0 items-center gap-2 rounded-full border border-border/70 bg-card/65 px-4 text-sm font-medium text-foreground/80 shadow-sm backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => onSelect?.(name)}
          aria-label={`Buscar ${name}`}
        >
          <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </span>
          {name}
        </button>
      ))}
    </div>
  );
}

export function ServiceCarousel({ onSelect }: ServiceCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const group = groupRef.current;
    if (!viewport || !track || !group) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (prefersReducedMotion.matches) {
      viewport.style.overflowX = "auto";
      return;
    }

    let tween: gsap.core.Tween;

    const createTween = () => {
      tween?.kill();
      gsap.set(track, { x: 0 });
      tween = gsap.to(track, {
        x: -group.offsetWidth,
        duration: Math.max(26, group.offsetWidth / 48),
        ease: "none",
        repeat: -1,
      });
    };

    const pause = () => tween?.pause();
    const resume = () => tween?.resume();
    const handleFocusOut = (event: FocusEvent) => {
      if (!viewport.contains(event.relatedTarget as Node | null)) resume();
    };

    createTween();
    const resizeObserver = new ResizeObserver(createTween);
    resizeObserver.observe(group);

    viewport.addEventListener("pointerenter", pause);
    viewport.addEventListener("pointerleave", resume);
    viewport.addEventListener("focusin", pause);
    viewport.addEventListener("focusout", handleFocusOut);

    return () => {
      tween?.kill();
      resizeObserver.disconnect();
      viewport.removeEventListener("pointerenter", pause);
      viewport.removeEventListener("pointerleave", resume);
      viewport.removeEventListener("focusin", pause);
      viewport.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return (
    <section className="relative py-4 sm:py-6" aria-labelledby="service-carousel-title">
      <div className="container-shell">
        <div className="mb-3 flex items-end justify-between gap-4 px-1">
          <div>
            <span className="section-kicker">Ideas para buscar</span>
            <h2
              id="service-carousel-title"
              className="mt-1 text-base font-semibold tracking-[-0.02em] text-foreground sm:text-lg"
            >
              Todo para tu próximo evento
            </h2>
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Tocá un rubro para buscar
          </p>
        </div>

        <div
          ref={viewportRef}
          className="overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
        >
          <div ref={trackRef} className="flex w-max will-change-transform">
            <div ref={groupRef} className="flex shrink-0 gap-2 pr-2">
              {serviceCategories.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  className="group flex h-11 shrink-0 items-center gap-2 rounded-full border border-border/70 bg-card/65 px-4 text-sm font-medium text-foreground/80 shadow-sm backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  onClick={() => onSelect?.(name)}
                  aria-label={`Buscar ${name}`}
                >
                  <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
                  </span>
                  {name}
                </button>
              ))}
            </div>
            <CategoryGroup duplicated onSelect={onSelect} />
          </div>
        </div>
      </div>
    </section>
  );
}
