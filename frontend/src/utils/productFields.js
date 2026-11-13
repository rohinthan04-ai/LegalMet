// The fields of the backend's ProductExtraction schema, in the order they are shown on the review page.
export const TEXT_FIELDS = [
  { key: "product_name", label: "Product name" },
  { key: "mrp", label: "MRP", hint: "Include currency and tax wording if printed, e.g. Rs. 120 (incl. of all taxes)" },
  { key: "net_quantity", label: "Net quantity", hint: "Weight, volume or count with its unit, e.g. 30 g" },
  { key: "manufacturer_or_packer", label: "Manufacturer / packer / importer", multiline: true },
  { key: "manufacturing_or_packing_date", label: "Manufacturing / packing date" },
  { key: "expiry_or_best_before", label: "Expiry / best before" },
  { key: "batch_or_lot_number", label: "Batch / lot number" },
  { key: "country_of_origin", label: "Country of origin" },
  { key: "consumer_care_details", label: "Consumer care details", multiline: true },
];

// Backend JSON (null for missing values) -> form values (always strings, so inputs stay controlled).
export function toFormValues(extracted) {
  const values = {};
  for (const { key } of TEXT_FIELDS) {
    values[key] = extracted?.[key] ?? "";
  }
  values.other_visible_declarations = [...(extracted?.other_visible_declarations ?? [])];
  return values;
}

// Form values -> exactly what the backend's ProductExtraction expects. Empty text becomes null.
export function toPayload(values) {
  const payload = {};
  for (const { key } of TEXT_FIELDS) {
    const text = (values[key] ?? "").trim();
    payload[key] = text === "" ? null : text;
  }
  payload.other_visible_declarations = values.other_visible_declarations
    .map((item) => item.trim())
    .filter(Boolean);
  return payload;
}

export function valuesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
