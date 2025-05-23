import { ItemCategory } from "../types";

/**
 * Normalize a category string to match one of the predefined ItemCategory types
 * @param categoryInput The input category string to normalize
 * @returns A normalized category that matches one of the ItemCategory types
 */
export const normalizeCategory = (
  categoryInput: string | undefined
): ItemCategory => {
  // Default to "other" if no category is provided
  let category = categoryInput || "other";

  // For debugging
  const originalCategory = category;

  // Convert to lowercase and remove special characters
  category = category.toLowerCase().trim();

  // Log the original and normalized category for debugging
  console.debug(
    `Category normalization: "${originalCategory}" -> processing...`
  );

  // Create a more robust mapping system
  const categoryMapping: Record<string, ItemCategory> = {
    // Electronics variations
    electronics: "electronics",
    electronic: "electronics",
    "electronic devices": "electronics",
    devices: "electronics",
    gadgets: "electronics",
    tech: "electronics",
    technology: "electronics",

    // Office supplies variations
    "office supplies": "office-supplies",
    "office-supplies": "office-supplies",
    officesupplies: "office-supplies",
    office: "office-supplies",
    supplies: "office-supplies",
    stationery: "office-supplies",
    stationary: "office-supplies",
    "office items": "office-supplies",
    "office materials": "office-supplies",

    // Cleaning materials as its own category
    "cleaning materials": "cleaning-materials",
    cleaning: "cleaning-materials",
    cleaner: "cleaning-materials",
    cleaners: "cleaning-materials",

    // Furniture variations
    furniture: "furniture",
    furnishing: "furniture",
    furnishings: "furniture",
    "office furniture": "furniture",

    // Software variations
    software: "software",
    programs: "software",
    applications: "software",
    apps: "software",
    digital: "software",
  };

  // Check if the category or a similar variation exists in our mapping
  if (categoryMapping[category]) {
    const result = categoryMapping[category];
    console.debug(
      `Category normalization: "${originalCategory}" -> "${result}" (direct mapping)`
    );
    return result;
  }

  // If not in the mapping, try to find partial matches
  if (category.includes("clean") || category.includes("kanebo")) {
    const result = "cleaning-materials";
    console.debug(
      `Category normalization: "${originalCategory}" -> "${result}" (partial match: cleaning)`
    );
    return result;
  }

  if (
    category.includes("office") ||
    category.includes("supply") ||
    category.includes("supplies") ||
    category.includes("stationery")
  ) {
    const result = "office-supplies";
    console.debug(
      `Category normalization: "${originalCategory}" -> "${result}" (partial match: office/supplies)`
    );
    return result;
  }

  if (
    category.includes("electronic") ||
    category.includes("device") ||
    category.includes("tech") ||
    category.includes("gadget")
  ) {
    const result = "electronics";
    console.debug(
      `Category normalization: "${originalCategory}" -> "${result}" (partial match: electronics)`
    );
    return result;
  }

  if (
    category.includes("furniture") ||
    category.includes("furnish") ||
    category.includes("chair") ||
    category.includes("table") ||
    category.includes("desk")
  ) {
    const result = "furniture";
    console.debug(
      `Category normalization: "${originalCategory}" -> "${result}" (partial match: furniture)`
    );
    return result;
  }

  if (
    category.includes("software") ||
    category.includes("program") ||
    category.includes("app") ||
    category.includes("digital")
  ) {
    const result = "software";
    console.debug(
      `Category normalization: "${originalCategory}" -> "${result}" (partial match: software)`
    );
    return result;
  }

  // Default to "other" if no match found
  const result = "other";

  // Log the final normalized category for debugging
  console.debug(`Category normalization: "${originalCategory}" -> "${result}"`);

  return result;
};

/**
 * Compare two categories for equality, ignoring case and variations
 * @param category1 First category to compare
 * @param category2 Second category to compare
 * @returns True if the categories are equivalent after normalization
 */
export const categoriesAreEqual = (
  category1: string,
  category2: string
): boolean => {
  if (category1 === "all" || category2 === "all") {
    return category1 === category2;
  }

  const normalized1 = normalizeCategory(category1);
  const normalized2 = normalizeCategory(category2);
  const areEqual = normalized1 === normalized2;

  // Log comparison results for debugging
  console.debug(
    `Category comparison: "${category1}" vs "${category2}" -> normalized: "${normalized1}" vs "${normalized2}" -> equal: ${areEqual}`
  );

  return areEqual;
};
