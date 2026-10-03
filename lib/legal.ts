// Datos de los documentos legales. La versión debe coincidir con app.legal.terminos-version del backend,
// que es la que queda guardada como aceptada cuando un profesional se registra.

export const VERSION_LEGAL = "1.0";
export const VIGENCIA_LEGAL = "2 de octubre de 2026";

/**
 * Mientras sea true, los documentos muestran un aviso de borrador. Pasar a false cuando un abogado
 * revise los textos y se completen los datos marcados entre corchetes.
 */
export const LEGAL_EN_BORRADOR = true;

export const RUTA_TERMINOS = "/terminos";
export const RUTA_PRIVACIDAD = "/privacidad";
