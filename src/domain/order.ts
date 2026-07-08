/**
 * Domain types for checkout workflow and order persistence.
 */

/**
 * Input payload for POST /checkout endpoint.
 * All fields are required and must be non-empty strings after trimming.
 */
export interface CheckoutRequest {
  shippingName: string;
  email: string;
  address: string;
  cardNumber: string;
}

/**
 * A single line item in an order (product purchased).
 */
export interface OrderItem {
  duckId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

/**
 * Persisted order record stored in local JSON file.
 * Includes transaction summary, items purchased, and timestamps.
 */
export interface OrderRecord {
  orderId: string;
  createdAt: string; // ISO 8601 timestamp
  shippingName: string;
  email: string;
  address: string;
  items: OrderItem[];
  total: number;
}

/**
 * Confirmation payload returned to client on successful checkout (201).
 */
export interface CheckoutConfirmation {
  orderId: string;
  createdAt: string;
  items: OrderItem[];
  total: number;
}

/**
 * Field-level validation error details.
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Validation error result (400).
 * Either a general error message, or specific field errors.
 */
export interface ValidationError {
  error: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Conflict error result (409, e.g., insufficient stock).
 */
export interface ConflictError {
  error: string;
}

/**
 * Checkout result union: success (201), validation failure (400), or conflict (409).
 * Use type guards to discriminate between branches.
 */
export type CheckoutResult =
  | { status: 201; data: CheckoutConfirmation }
  | { status: 400; data: ValidationError }
  | { status: 409; data: ConflictError };

/**
 * Type guard: is this result a success (201)?
 */
export function isCheckoutSuccess(
  result: CheckoutResult
): result is { status: 201; data: CheckoutConfirmation } {
  return result.status === 201;
}

/**
 * Type guard: is this result a validation error (400)?
 */
export function isCheckoutValidationError(
  result: CheckoutResult
): result is { status: 400; data: ValidationError } {
  return result.status === 400;
}

/**
 * Type guard: is this result a conflict error (409)?
 */
export function isCheckoutConflict(
  result: CheckoutResult
): result is { status: 409; data: ConflictError } {
  return result.status === 409;
}

/**
 * Validation predicates for CheckoutRequest fields.
 */

/**
 * Strong email validation regex.
 * Allows typical email formats; rejects obviously invalid patterns.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  // Max length 254 per RFC 5321; min 3 for a@b
  return trimmed.length >= 3 && trimmed.length <= 254 && EMAIL_REGEX.test(trimmed);
}

/**
 * Validate shipping name: required, min 2 chars, max 100 chars (after trim).
 */
export function isValidShippingName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

/**
 * Validate address: required, min 5 chars, max 250 chars (after trim).
 */
export function isValidAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed.length >= 5 && trimmed.length <= 250;
}

/**
 * Validate card number: required, non-empty after trim (mocked; no real validation).
 */
export function isValidCardNumber(cardNumber: string): boolean {
  const trimmed = cardNumber.trim();
  return trimmed.length > 0;
}

/**
 * Validate entire CheckoutRequest payload.
 * Returns field-level errors if validation fails.
 */
export function validateCheckoutRequest(
  payload: unknown
): { valid: true } | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, errors: { _general: 'Payload must be a JSON object' } };
  }

  const req = payload as Record<string, unknown>;

  // Validate shippingName
  if (typeof req.shippingName !== 'string') {
    errors.shippingName = 'shippingName is required and must be a string';
  } else if (!isValidShippingName(req.shippingName)) {
    errors.shippingName = 'shippingName must be 2-100 characters (after trim)';
  }

  // Validate email
  if (typeof req.email !== 'string') {
    errors.email = 'email is required and must be a string';
  } else if (!isValidEmail(req.email)) {
    errors.email = 'email must be a valid email format (3-254 characters)';
  }

  // Validate address
  if (typeof req.address !== 'string') {
    errors.address = 'address is required and must be a string';
  } else if (!isValidAddress(req.address)) {
    errors.address = 'address must be 5-250 characters (after trim)';
  }

  // Validate cardNumber
  if (typeof req.cardNumber !== 'string') {
    errors.cardNumber = 'cardNumber is required and must be a string';
  } else if (!isValidCardNumber(req.cardNumber)) {
    errors.cardNumber = 'cardNumber must be non-empty (after trim)';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Generate a unique order ID.
 * Format: "ord_" + timestamp + random 8-char hex string.
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(16).substring(2, 10);
  return `ord_${timestamp}_${random}`;
}

/**
 * Get current timestamp as ISO 8601 string.
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Type guard: check if object matches OrderRecord shape (runtime validation).
 */
export function isOrderRecord(obj: unknown): obj is OrderRecord {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.orderId === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.shippingName === 'string' &&
    typeof o.email === 'string' &&
    typeof o.address === 'string' &&
    Array.isArray(o.items) &&
    o.items.every(isOrderItem) &&
    typeof o.total === 'number'
  );
}

/**
 * Type guard: check if object matches OrderItem shape (runtime validation).
 */
export function isOrderItem(obj: unknown): obj is OrderItem {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.duckId === 'string' &&
    typeof o.name === 'string' &&
    typeof o.unitPrice === 'number' &&
    typeof o.quantity === 'number' &&
    typeof o.lineTotal === 'number'
  );
}
