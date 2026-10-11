// Datos de los documentos legales. La versión debe coincidir con app.legal.terminos-version del backend,
// que es la que queda guardada como aceptada cuando un profesional se registra.

export const VERSION_LEGAL = "1.0";
export const VIGENCIA_LEGAL = "11 de octubre de 2026";

/**
 * Mientras sea true, los documentos muestran un aviso de borrador. La versión 1.0 se dio por
 * definitiva; volver a true solo si se publica un texto todavía en revisión.
 */
export const LEGAL_EN_BORRADOR = false;

export const RUTA_TERMINOS = "/terminos";
export const RUTA_PRIVACIDAD = "/privacidad";
