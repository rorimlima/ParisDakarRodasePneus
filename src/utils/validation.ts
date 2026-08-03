/**
 * Formats a CPF string into XXX.XXX.XXX-XX
 */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Validates basic CPF format (11 digits)
 */
export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;
  return true;
}

/**
 * Formats a CNPJ (supports both standard numeric and new alphanumeric Receita Federal format)
 * Examples:
 * - Numeric: 12.345.678/0001-90
 * - Alphanumeric: 12.ABC.345/0001-89
 */
export function formatCNPJ(value: string): string {
  // Allow letters A-Z, numbers 0-9
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14);
  
  if (raw.length <= 2) return raw;
  if (raw.length <= 5) return `${raw.slice(0, 2)}.${raw.slice(2)}`;
  if (raw.length <= 8) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
  if (raw.length <= 12) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
  return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12, 14)}`;
}

/**
 * Validates CNPJ length and format (14 characters numeric or alphanumeric)
 */
export function validateCNPJ(cnpj: string): boolean {
  const clean = cnpj.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 14) return false;
  
  // Basic check: must contain letters/digits and reasonable structure
  // Check that last 2 characters are digits or valid alphanumeric check digits
  const checkDigits = clean.slice(12, 14);
  if (!/^[0-9]{2}$/.test(checkDigits) && !/^[A-Z0-9]{2}$/.test(checkDigits)) {
    return false;
  }
  
  return true;
}

/**
 * Checks if CNPJ contains alphanumeric characters (non-digits)
 */
export function isAlphanumericCNPJ(cnpj: string): boolean {
  const clean = cnpj.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /[A-Z]/.test(clean);
}
