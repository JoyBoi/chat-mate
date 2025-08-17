import { describe, it, expect } from 'vitest';

// Simple validation utilities for testing
const isEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, '');
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

describe('validation utilities', () => {
  describe('isEmail', () => {
    it('validates correct email addresses', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('user.name@domain.co.uk')).toBe(true);
      expect(isEmail('user+tag@example.org')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(isEmail('invalid-email')).toBe(false);
      expect(isEmail('@example.com')).toBe(false);
      expect(isEmail('user@')).toBe(false);
      expect(isEmail('user@domain')).toBe(false);
      expect(isEmail('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('validates passwords with minimum length', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('12345678')).toBe(true);
    });

    it('rejects passwords that are too short', () => {
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('1234567')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('removes dangerous characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
        'scriptalert(xss)/script'
      );
      expect(sanitizeInput('Hello "World"')).toBe('Hello World');
      expect(sanitizeInput("It's a 'test' & more")).toBe('Its a test  more');
    });

    it('trims whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
      expect(sanitizeInput('\n\ttest\n')).toBe('test');
    });

    it('handles empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });
  });

  describe('formatCurrency', () => {
    it('formats positive amounts correctly', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('formats negative amounts correctly', () => {
      expect(formatCurrency(-100)).toBe('-$100.00');
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('handles zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('handles large numbers correctly', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(999999.99)).toBe('$999,999.99');
    });
  });
});
