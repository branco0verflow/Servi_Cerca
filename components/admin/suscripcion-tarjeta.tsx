"use client";

import { FormEvent, useState } from "react";
import { CalendarClock, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { useAdminError } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Suscripcion, definirVencimiento, registrarAvisoSuscripcion } from "@/lib/admin-api";

/** Fecha AAAA-MM-DD → "5 oct 2027", sin que la zona horaria la corra un día. */
export function fechaCorta(iso: string) {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-UY", { dateStyle: "medium" }).format(new Date(anio, mes - 1, dia));
}

function aIso(dia: Date) {
  const mes = String(dia.getMonth() + 1).padStart(2, "0");
  return `${dia.getFullYear()}-${mes}-${String(dia.getDate()).padStart(2, "0")}`;
}

function deIso(iso: string) {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

export function SuscripcionBadge({ suscripcion }: { suscripcion: Suscripcion }) {
  if (suscripcion.estado === "PENDIENTE") return <Badge variant="outline">Sin definir</Badge>;
  if (suscripcion.estado === "VENCIDA") return <Badge variant="destructive">Vencida</Badge>;
  if (suscripcion.porVencer) return <Badge className="bg-amber-500 text-black">Por vencer</Badge>;
  return <Badge variant="secondary">Vigente</Badge>;
}

/** "vence en 12 días", "vence mañana", "venció hace 3 días"… */
export function plazoSuscripcion(suscripcion: Suscripcion) {
  const dias = suscripcion.diasRestantes;
  if (dias === null) return "";
  if (dias > 1) return `faltan ${dias} días`;
  if (dias === 1) return "vence mañana";
  if (dias === 0) return "venció hoy";
  return dias === -1 ? "venció ayer" : `venció hace ${-dias} días`;
}

export function mensajeAvisoSuscripcion(nombre: string, suscripcion: Suscripcion) {
  const dia = suscripcion.fechaVencimiento ? fechaCorta(suscripcion.fechaVencimiento) : "";
  return suscripcion.estado === "VENCIDA"
    ? `Hola ${nombre}, te escribimos de Servi Cerca. Tu suscripción venció el ${dia} y tu perfil dejó de mostrarse en el sitio. Si querés renovarla, respondé este mensaje y lo coordinamos.`
    : `Hola ${nombre}, te escribimos de Servi Cerca. Tu suscripción vence el ${dia}. Para que tu perfil siga visible, respondé este mensaje y coordinamos la renovación.`;
}

/**
 * Enlace de WhatsApp para avisar del vencimiento. Al tocarlo se abre el chat y queda constancia del aviso.
 */
export function BotonAvisoSuscripcion({
  operadorId,
  nombre,
  whatsapp,
  suscripcion,
  onAvisado,
  compacto = false,
}: {
  operadorId: number;
  nombre: string;
  whatsapp: string;
  suscripcion: Suscripcion;
  onAvisado: () => void;
  compacto?: boolean;
}) {
  const manejarError = useAdminError();
  return (
    <Button asChild size={compacto ? "sm" : "default"} variant={suscripcion.fechaAvisoEnviado ? "outline" : "default"}>
      <a
        href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeAvisoSuscripcion(nombre, suscripcion))}`}
        target="_blank"
        rel="noreferrer"
        onClick={() => {
          registrarAvisoSuscripcion(operadorId).then(onAvisado).catch(manejarError);
        }}
      >
        <MessageCircle /> {suscripcion.fechaAvisoEnviado ? "Volver a avisar" : "Avisar por WhatsApp"}
      </a>
    </Button>
  );
}

type Props = {
  operadorId: number;
  suscripcion: Suscripcion;
  nombre: string;
  /** WhatsApp ya aprobado del operador; null si todavía no tiene un perfil publicado. */
  whatsapp: string | null;
  /** El operador ya fue aprobado alguna vez (activo o suspendido). */
  aprobado: boolean;
  onCambio: () => void | Promise<void>;
};

export function SuscripcionTarjeta({ operadorId, suscripcion, nombre, whatsapp, aprobado, onCambio }: Props) {
  const manejarError = useAdminError();
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Se calcula una sola vez: el mínimo elegible es mañana.
  const [minimo] = useState(() => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return aIso(manana);
  });

  // Al renovar una suscripción vigente se suma desde su vencimiento, para no perder los días que le quedan.
  function sumarMeses(meses: number) {
    const base =
      suscripcion.estado === "ACTIVA" && suscripcion.fechaVencimiento ? deIso(suscripcion.fechaVencimiento) : new Date();
    base.setMonth(base.getMonth() + meses);
    setNuevaFecha(aIso(base));
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nuevaFecha) return;
    setGuardando(true);
    try {
      await definirVencimiento(operadorId, nuevaFecha);
      toast.success(`Suscripción vigente hasta el ${fechaCorta(nuevaFecha)}.`);
      setNuevaFecha("");
      await onCambio();
    } catch (e) {
      manejarError(e);
    } finally {
      setGuardando(false);
    }
  }

  const necesitaAviso = aprobado && whatsapp && (suscripcion.porVencer || suscripcion.estado === "VENCIDA");

  return (
    <div
      className={`mb-6 rounded-(--radius) border bg-card p-5 ${suscripcion.estado === "VENCIDA" ? "border-destructive/50" : suscripcion.porVencer ? "border-amber-500/50" : "border-border"}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <CalendarClock className="size-5 text-muted-foreground" />
        <h2 className="font-semibold">Suscripción</h2>
        <SuscripcionBadge suscripcion={suscripcion} />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {suscripcion.estado === "PENDIENTE" &&
          (aprobado
            ? "No tiene vencimiento definido: su perfil no se muestra en el sitio hasta que lo cargues."
            : "Elegí hasta qué fecha es la suscripción. Es necesario para poder aprobar el registro.")}
        {suscripcion.estado === "ACTIVA" && suscripcion.fechaVencimiento && (
          <>
            Vence el <strong className="text-foreground">{fechaCorta(suscripcion.fechaVencimiento)}</strong> (
            {plazoSuscripcion(suscripcion)}).
          </>
        )}
        {suscripcion.estado === "VENCIDA" && suscripcion.fechaVencimiento && (
          <>
            Venció el <strong className="text-foreground">{fechaCorta(suscripcion.fechaVencimiento)}</strong> (
            {plazoSuscripcion(suscripcion)}). <strong className="text-foreground">Su perfil no se muestra en el sitio</strong>{" "}
            hasta que la renueves.
          </>
        )}
      </p>

      <form onSubmit={guardar} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="suscripcion-fecha" className="mb-1.5 block text-sm font-medium">
            {suscripcion.estado === "PENDIENTE" ? "Vencimiento" : "Nuevo vencimiento"}
          </label>
          <Input
            id="suscripcion-fecha"
            type="date"
            className="w-44"
            min={minimo}
            value={nuevaFecha}
            onChange={(e) => setNuevaFecha(e.target.value)}
            disabled={guardando}
            required
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { meses: 1, etiqueta: "+1 mes" },
            { meses: 6, etiqueta: "+6 meses" },
            { meses: 12, etiqueta: "+1 año" },
          ].map((opcion) => (
            <Button key={opcion.meses} type="button" variant="outline" size="sm" onClick={() => sumarMeses(opcion.meses)} disabled={guardando}>
              {opcion.etiqueta}
            </Button>
          ))}
        </div>
        <Button type="submit" disabled={guardando || !nuevaFecha}>
          {guardando && <Spinner />} {suscripcion.estado === "PENDIENTE" ? "Guardar" : "Renovar"}
        </Button>
      </form>

      {necesitaAviso && (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <BotonAvisoSuscripcion
            operadorId={operadorId}
            nombre={nombre}
            whatsapp={whatsapp}
            suscripcion={suscripcion}
            onAvisado={onCambio}
          />
          <span className="text-sm text-muted-foreground">
            {suscripcion.fechaAvisoEnviado
              ? `Le avisaste el ${new Intl.DateTimeFormat("es-UY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(suscripcion.fechaAvisoEnviado))}.`
              : "Todavía no le avisaste. Se abre el chat con el mensaje ya escrito."}
          </span>
        </div>
      )}
    </div>
  );
}
