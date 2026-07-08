import { describe, it, expect } from 'vitest';
import type {
  CheckoutRequest,
  OrderItem,
  OrderRecord,
  CheckoutConfirmation,
  CheckoutResult,
} from './order.js';
import {
  isCheckoutSuccess,
  isCheckoutValidationError,
  isCheckoutConflict,
  isValidEmail,
  isValidShippingName,
  isValidAddress,
  isValidCardNumber,
  validateCheckoutRequest,
  generateOrderId,
  getCurrentTimestamp,
  isOrderRecord,
  isOrderItem,
} from './order.js';

describe('order domain', () => {
  describe('email validation', () => {
    it('accepts valid email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('a@b.c')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user space@example.com')).toBe(false);
    });

    it('trims email before validation', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true);
    });

    it('enforces max length of 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@ab.c'; // 250 + 5 = 255 > 254
      expect(isValidEmail(longEmail)).toBe(false);
    });

    it('enforces min length of 3 characters', () => {
      expect(isValidEmail('a@')).toBe(false);
    });
  });

  describe('shipping name validation', () => {
    it('accepts valid shipping names', () => {
      expect(isValidShippingName('John Doe')).toBe(true);
      expect(isValidShippingName('Maria')).toBe(true);
      expect(isValidShippingName('A'.repeat(100))).toBe(true);
    });

    it('rejects names shorter than 2 characters', () => {
      expect(isValidShippingName('A')).toBe(false);
      expect(isValidShippingName('')).toBe(false);
    });

    it('rejects names longer than 100 characters', () => {
      expect(isValidShippingName('A'.repeat(101))).toBe(false);
    });

    it('trims before validation', () => {
      expect(isValidShippingName('  John Doe  ')).toBe(true);
    });
  });

  describe('address validation', () => {
    it('accepts valid addresses', () => {
      expect(isValidAddress('123 Main St')).toBe(true);
      expect(isValidAddress('Street address, City, State, ZIP')).toBe(true);
      expect(isValidAddress('A'.repeat(250))).toBe(true);
    });

    it('rejects addresses shorter than 5 characters', () => {
      expect(isValidAddress('1234')).toBe(false);
      expect(isValidAddress('12')).toBe(false);
    });

    it('rejects addresses longer than 250 characters', () => {
      expect(isValidAddress('A'.repeat(251))).toBe(false);
    });

    it('trims before validation', () => {
      expect(isValidAddress('  123 Main St  ')).toBe(true);
    });
  });

  describe('card number validation', () => {
    it('accepts non-empty card numbers', () => {
      expect(isValidCardNumber('4111-1111-1111-1111')).toBe(true);
      expect(isValidCardNumber('1234567890')).toBe(true);
    });

    it('rejects empty card numbers', () => {
      expect(isValidCardNumber('')).toBe(false);
      expect(isValidCardNumber('   ')).toBe(false);
    });
  });

  describe('validateCheckoutRequest', () => {
    it('accepts valid checkout request', () => {
      const payload = {
        shippingName: 'John Doe',
        email: 'john@example.com',
        address: '123 Main Street',
        cardNumber: '4111111111111111',
      };
      const result = validateCheckoutRequest(payload);
      expect(result.valid).toBe(true);
    });

    it('reports field errors for missing required fields', () => {
      const payload = {
        shippingName: '',
        email: '',
        address: '',
        cardNumber: '',
      };
      const result = validateCheckoutRequest(payload);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(Object.keys(result.errors).length).toBeGreaterThan(0);
        expect(result.errors.shippingName).toBeDefined();
        expect(result.errors.email).toBeDefined();
        expect(result.errors.address).toBeDefined();
        expect(result.errors.cardNumber).toBeDefined();
      }
    });

    it('reports field errors for invalid email', () => {
      const payload = {
        shippingName: 'John Doe',
        email: 'invalid-email',
        address: '123 Main Street',
        cardNumber: '4111111111111111',
      };
      const result = validateCheckoutRequest(payload);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors.email).toBeDefined();
      }
    });

    it('reports field errors for shipping name too short', () => {
      const payload = {
        shippingName: 'J',
        email: 'john@example.com',
        address: '123 Main Street',
        cardNumber: '4111111111111111',
      };
      const result = validateCheckoutRequest(payload);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors.shippingName).toBeDefined();
      }
    });

    it('reports field errors for address too short', () => {
      const payload = {
        shippingName: 'John Doe',
        email: 'john@example.com',
        address: '123',
        cardNumber: '4111111111111111',
      };
      const result = validateCheckoutRequest(payload);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors.address).toBeDefined();
      }
    });

    it('rejects non-object payload', () => {
      const result = validateCheckoutRequest(null);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors._general).toBeDefined();
      }
    });

    it('reports errors for wrong types', () => {
      const payload = {
        shippingName: 123,
        email: true,
        address: null,
        cardNumber: undefined,
      };
      const result = validateCheckoutRequest(payload);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateOrderId', () => {
    it('generates unique order IDs', () => {
      const id1 = generateOrderId();
      const id2 = generateOrderId();
      expect(id1).not.toBe(id2);
    });

    it('prefixes IDs with "ord_"', () => {
      const id = generateOrderId();
      expect(id).toMatch(/^ord_/);
    });

    it('generates deterministic format', () => {
      const id = generateOrderId();
      const parts = id.split('_');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('ord');
    });
  });

  describe('getCurrentTimestamp', () => {
    it('returns ISO 8601 formatted timestamp', () => {
      const ts = getCurrentTimestamp();
      expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      // Should be parseable as valid date
      expect(new Date(ts).getTime()).toBeGreaterThan(0);
    });
  });

  describe('isOrderItem', () => {
    it('validates correct OrderItem', () => {
      const item: OrderItem = {
        duckId: 'duck-1',
        name: 'Lucky Duck',
        unitPrice: 25.99,
        quantity: 2,
        lineTotal: 51.98,
      };
      expect(isOrderItem(item)).toBe(true);
    });

    it('rejects invalid OrderItem', () => {
      expect(isOrderItem(null)).toBe(false);
      expect(isOrderItem({ duckId: 'duck-1' })).toBe(false);
      expect(
        isOrderItem({
          duckId: 'duck-1',
          name: 'Lucky Duck',
          unitPrice: '25.99',
          quantity: 2,
          lineTotal: 51.98,
        })
      ).toBe(false);
    });
  });

  describe('isOrderRecord', () => {
    it('validates correct OrderRecord', () => {
      const record: OrderRecord = {
        orderId: 'ord_123',
        createdAt: '2026-01-01T12:00:00.000Z',
        shippingName: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        items: [
          {
            duckId: 'duck-1',
            name: 'Lucky Duck',
            unitPrice: 25.99,
            quantity: 2,
            lineTotal: 51.98,
          },
        ],
        total: 51.98,
      };
      expect(isOrderRecord(record)).toBe(true);
    });

    it('rejects invalid OrderRecord', () => {
      expect(isOrderRecord(null)).toBe(false);
      expect(
        isOrderRecord({
          orderId: 'ord_123',
          createdAt: '2026-01-01T12:00:00.000Z',
          items: 'not-an-array',
        })
      ).toBe(false);
    });

    it('validates nested items', () => {
      const record = {
        orderId: 'ord_123',
        createdAt: '2026-01-01T12:00:00.000Z',
        shippingName: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        items: [
          {
            duckId: 'duck-1',
            name: 'Lucky Duck',
            unitPrice: 25.99,
            quantity: 2,
            lineTotal: 51.98,
          },
          {
            duckId: 'duck-2',
            name: 'Swift Duck',
            unitPrice: 15.0,
            quantity: 'not-a-number',
            lineTotal: 15.0,
          },
        ],
        total: 66.98,
      };
      expect(isOrderRecord(record)).toBe(false);
    });
  });

  describe('CheckoutResult type guards', () => {
    it('isCheckoutSuccess identifies 201 results', () => {
      const result: CheckoutResult = {
        status: 201,
        data: {
          orderId: 'ord_123',
          createdAt: '2026-01-01T12:00:00.000Z',
          items: [],
          total: 0,
        },
      };
      expect(isCheckoutSuccess(result)).toBe(true);
      expect(isCheckoutValidationError(result)).toBe(false);
      expect(isCheckoutConflict(result)).toBe(false);
    });

    it('isCheckoutValidationError identifies 400 results', () => {
      const result: CheckoutResult = {
        status: 400,
        data: {
          error: 'Validation failed',
          fieldErrors: { email: 'Invalid email' },
        },
      };
      expect(isCheckoutValidationError(result)).toBe(true);
      expect(isCheckoutSuccess(result)).toBe(false);
      expect(isCheckoutConflict(result)).toBe(false);
    });

    it('isCheckoutConflict identifies 409 results', () => {
      const result: CheckoutResult = {
        status: 409,
        data: { error: 'Insufficient stock' },
      };
      expect(isCheckoutConflict(result)).toBe(true);
      expect(isCheckoutSuccess(result)).toBe(false);
      expect(isCheckoutValidationError(result)).toBe(false);
    });
  });
});
