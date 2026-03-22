// Feature: medtech-solutions-website, Property 11: Product form validation rejects any missing required field

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { validateProductForm, type ProductFormValues } from '../utils/adminFormValidation';

/**
 * Validates: Requirements 9.2, 9.9
 *
 * Property 11: For any combination of form values where at least one required
 * field is empty/invalid, validateProductForm must return at least one error.
 *
 * Required fields: name, category, description, original_price, stock_quantity
 * Image: at least one image must be present (hasImage = true)
 */

/** A valid base set of form values that passes all validation rules. */
const validValues: ProductFormValues = {
  name: 'Samsung Galaxy A55',
  category: 'Phones',
  description: 'A great smartphone.',
  original_price: '45000',
  discounted_price: '',
  stock_quantity: '10',
};

/** Arbitrary that produces a valid original_price string (positive number). */
const validPriceArb = fc
  .integer({ min: 1, max: 1_000_000 })
  .map((n) => String(n));

/** Arbitrary that produces a valid stock_quantity string (non-negative integer). */
const validQtyArb = fc.nat({ max: 9999 }).map((n) => String(n));

/** Arbitrary that produces a non-empty trimmed string (valid text field). */
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0);

const categoryArb = fc.constantFrom('Phones', 'Laptops', 'Desktops', 'Accessories');

describe('validateProductForm — Property 11: rejects any missing required field', () => {
  it('returns an error when name is empty', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\t', '\n'),
        (emptyName) => {
          const errs = validateProductForm({ ...validValues, name: emptyName }, true);
          return errs.name !== undefined;
        },
      ),
      { numRuns: 25 },
    );
  });

  it('returns an error when category is empty', () => {
    fc.assert(
      fc.property(
        fc.constant(''),
        (emptyCategory) => {
          const errs = validateProductForm({ ...validValues, category: emptyCategory }, true);
          return errs.category !== undefined;
        },
      ),
      { numRuns: 25 },
    );
  });

  it('returns an error when description is empty', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\t'),
        (emptyDesc) => {
          const errs = validateProductForm({ ...validValues, description: emptyDesc }, true);
          return errs.description !== undefined;
        },
      ),
      { numRuns: 25 },
    );
  });

  it('returns an error when original_price is empty', () => {
    fc.assert(
      fc.property(
        fc.constant(''),
        (emptyPrice) => {
          const errs = validateProductForm({ ...validValues, original_price: emptyPrice }, true);
          return errs.original_price !== undefined;
        },
      ),
      { numRuns: 25 },
    );
  });

  it('returns an error when original_price is zero or negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10_000, max: 0 }).map((n) => String(n)),
        (badPrice) => {
          const errs = validateProductForm({ ...validValues, original_price: badPrice }, true);
          return errs.original_price !== undefined;
        },
      ),
      { numRuns: 25 },
    );
  });

  it('returns an error when stock_quantity is empty', () => {
    fc.assert(
      fc.property(
        fc.constant(''),
        (emptyQty) => {
          const errs = validateProductForm({ ...validValues, stock_quantity: emptyQty }, true);
          return errs.stock_quantity !== undefined;
        },
      ),
      { numRuns: 25 },
    );
  });

  it('returns an error when no image is provided', () => {
    fc.assert(
      fc.property(
        fc.constant(false),
        (hasImage) => {
          const errs = validateProductForm(validValues, hasImage);
          return errs.media !== undefined;
        },
      ),
      { numRuns: 25 },
    );
  });

  it('returns at least one error for any combination with one required field missing', () => {
    /**
     * Generate a form where exactly one required field is blanked out at a time,
     * chosen randomly. The rest are valid. hasImage is also randomly toggled.
     */
    const requiredFieldArb = fc.constantFrom(
      'name' as const,
      'category' as const,
      'description' as const,
      'original_price' as const,
      'stock_quantity' as const,
      'image' as const,
    );

    fc.assert(
      fc.property(
        nonEmptyStringArb,
        categoryArb,
        nonEmptyStringArb,
        validPriceArb,
        validQtyArb,
        requiredFieldArb,
        (name, category, description, original_price, stock_quantity, missingField) => {
          const base: ProductFormValues = {
            name,
            category,
            description,
            original_price,
            discounted_price: '',
            stock_quantity,
          };

          let hasImage = true;
          const values = { ...base };

          switch (missingField) {
            case 'name':
              values.name = '';
              break;
            case 'category':
              values.category = '';
              break;
            case 'description':
              values.description = '';
              break;
            case 'original_price':
              values.original_price = '';
              break;
            case 'stock_quantity':
              values.stock_quantity = '';
              break;
            case 'image':
              hasImage = false;
              break;
          }

          const errs = validateProductForm(values, hasImage);
          return Object.keys(errs).length > 0;
        },
      ),
      { numRuns: 25 },
    );
  });

  it('returns no errors when all required fields are valid and an image is present', () => {
    fc.assert(
      fc.property(
        nonEmptyStringArb,
        categoryArb,
        nonEmptyStringArb,
        validPriceArb,
        validQtyArb,
        (name, category, description, original_price, stock_quantity) => {
          const values: ProductFormValues = {
            name,
            category,
            description,
            original_price,
            discounted_price: '',
            stock_quantity,
          };
          const errs = validateProductForm(values, true);
          return Object.keys(errs).length === 0;
        },
      ),
      { numRuns: 25 },
    );
  });
});
