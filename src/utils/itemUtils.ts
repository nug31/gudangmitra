/**
 * Utility functions for working with items
 */

/**
 * Validates and normalizes an item ID
 * @param itemId The item ID to validate
 * @returns A valid numeric item ID or null if invalid
 */
export const validateItemId = (itemId: string | number | undefined): number | null => {
  if (itemId === undefined || itemId === null) {
    console.warn('validateItemId: itemId is undefined or null');
    return null;
  }

  // If it's already a number, return it
  if (typeof itemId === 'number') {
    return itemId;
  }

  // If it's a string, try to parse it
  if (typeof itemId === 'string') {
    const parsed = parseInt(itemId);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  console.warn(`validateItemId: Could not parse itemId "${itemId}" as a number`);
  return null;
};

/**
 * Checks if an item ID is valid
 * @param itemId The item ID to check
 * @returns True if the item ID is valid, false otherwise
 */
export const isValidItemId = (itemId: string | number | undefined): boolean => {
  return validateItemId(itemId) !== null;
};
