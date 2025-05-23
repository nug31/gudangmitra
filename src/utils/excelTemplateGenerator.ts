import * as XLSX from "xlsx";
import { ItemRequest } from "../types";

/**
 * Generates an Excel template file for importing inventory items
 * @returns Blob of the Excel file
 */
export const generateInventoryTemplate = (): Blob => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Sample data with column headers and example rows
  const data = [
    {
      name: "Laptop Dell XPS 13",
      description: "High-performance laptop with 16GB RAM and 512GB SSD",
      category: "electronics",
      quantity: 10,
      minQuantity: 2,
      location: "Main Storage",
    },
    {
      name: "Office Chair",
      description: "Ergonomic office chair with adjustable height",
      category: "furniture",
      quantity: 5,
      minQuantity: 1,
      location: "Office Room",
    },
    {
      name: "Stapler",
      description: "Standard desktop stapler with 20-sheet capacity",
      category: "office-supplies",
      quantity: 15,
      minQuantity: 3,
      location: "Supply Closet",
    },
  ];

  // Create a worksheet from the data
  const ws = XLSX.utils.json_to_sheet(data);

  // Add column width information
  const colWidths = [
    { wch: 20 }, // name
    { wch: 40 }, // description
    { wch: 15 }, // category
    { wch: 10 }, // quantity
    { wch: 12 }, // minQuantity
    { wch: 15 }, // location
  ];

  ws["!cols"] = colWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "Inventory Template");

  // Generate Excel file as a blob
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

/**
 * Triggers a download of the inventory template Excel file
 */
export const downloadInventoryTemplate = (): void => {
  const blob = generateInventoryTemplate();
  const url = URL.createObjectURL(blob);

  // Create a temporary link element and trigger download
  const link = document.createElement("a");
  link.href = url;
  link.download = "inventory_template.xlsx";
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports requests data to Excel file
 * @param requests Array of ItemRequest objects
 * @param filename Optional filename for the export
 * @returns Blob of the Excel file
 */
export const exportRequestsToExcel = (
  requests: ItemRequest[],
  filename: string = "requests_export.xlsx"
): Blob => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Format the requests data for Excel
  const excelData = requests.map((request, index) => ({
    "No.": index + 1,
    "Request ID": request.id,
    "Item Name": request.itemName,
    "Quantity": request.quantity,
    "Priority": request.priority.charAt(0).toUpperCase() + request.priority.slice(1),
    "Status": request.status.charAt(0).toUpperCase() + request.status.slice(1),
    "Requester": request.requesterName || `User ${request.userId}`,
    "Email": request.requesterEmail || "",
    "Project": request.projectName || "",
    "Description": request.description,
    "Requested Delivery": request.requestedDeliveryDate ?
      new Date(request.requestedDeliveryDate).toLocaleDateString() : "",
    "Created Date": request.createdAt ?
      new Date(request.createdAt).toLocaleDateString() : "",
    "Updated Date": request.updatedAt ?
      new Date(request.updatedAt).toLocaleDateString() : ""
  }));

  // Create a worksheet from the data
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Add column width information for better readability
  const colWidths = [
    { wch: 5 },  // No.
    { wch: 15 }, // Request ID
    { wch: 25 }, // Item Name
    { wch: 10 }, // Quantity
    { wch: 10 }, // Priority
    { wch: 12 }, // Status
    { wch: 20 }, // Requester
    { wch: 25 }, // Email
    { wch: 20 }, // Project
    { wch: 40 }, // Description
    { wch: 15 }, // Requested Delivery
    { wch: 15 }, // Created Date
    { wch: 15 }  // Updated Date
  ];

  ws["!cols"] = colWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "Requests");

  // Generate Excel file as a blob
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

/**
 * Triggers a download of the requests Excel file
 * @param requests Array of ItemRequest objects
 * @param filename Optional filename for the export
 */
export const downloadRequestsExcel = (
  requests: ItemRequest[],
  filename: string = "requests_export.xlsx"
): void => {
  const blob = exportRequestsToExcel(requests, filename);
  const url = URL.createObjectURL(blob);

  // Create a temporary link element and trigger download
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
