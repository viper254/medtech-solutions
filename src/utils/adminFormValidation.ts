/**
 * Standalone validation logic for the admin product form.
 * Extracted so it can be unit- and property-tested independently of the React component.
 */

export interface ProductFormValues {
  name: string;
  category: string;
  description: string;
  original_price: string;
  discounted_price: string;
  stock_quantity: string;
}

export interface ProductFormErrors {
  name?: string;
  category?: string;
  description?: string;
  original_price?: string;
  discounted_price?: string;
  stock_quantity?: string;
  media?: string;
}

/**
 * Validates the admin product form.
 *
 * @param values     - Raw string values from the form fields.
 * @param hasImage   - Whether at least one image exists (existing or newly uploaded).
 * @returns An object whose keys are field names and values are error messages.
 *          An empty object means the form is valid.
 */
export function validateProductForm(
  values: ProductFormValues,
  hasImage: boolean,
): ProductFormErrors {
  const errs: ProductFormErrors = {};
  const origPrice = parseFloat(values.original_price);
  const discPrice = values.discounted_price !== '' ? parseFloat(values.discounted_price) : null;

  if (!values.name.trim()) errs.name = 'Name is required.';
  if (!values.category) errs.category = 'Category is required.';
  if (!values.description.trim()) errs.description = 'Description is required.';

  if (!values.original_price) {
    errs.original_price = 'Original price is required.';
  } else if (isNaN(origPrice) || origPrice <= 0) {
    errs.original_price = 'Original price must be greater than 0.';
  }

  if (values.discounted_price !== '') {
    if (isNaN(discPrice!) || discPrice! <= 0) {
      errs.discounted_price = 'Discounted price must be greater than 0.';
    } else if (!isNaN(origPrice) && discPrice! >= origPrice) {
      errs.discounted_price = 'Discounted price must be less than original price.';
    }
  }

  if (values.stock_quantity === '') {
    errs.stock_quantity = 'Stock quantity is required.';
  } else {
    const qty = parseInt(values.stock_quantity, 10);
    if (isNaN(qty) || qty < 0) errs.stock_quantity = 'Stock quantity must be 0 or more.';
  }

  if (!hasImage) {
    errs.media = 'At least one image is required.';
  }

  return errs;
}
