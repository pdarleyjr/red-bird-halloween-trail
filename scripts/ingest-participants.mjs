import fs from "node:fs/promises";
import Papa from "papaparse";

const input = "C:/Users/Peter Darley/Downloads/Red_Bird_Trick-or-Treat_Trail_2025-10-24_07_59_03(1).csv";
const output = "data/participants.csv";

console.log("Reading CSV file...");
const raw = await fs.readFile(input, "utf8");
const { data } = Papa.parse(raw, { header: true, skipEmptyLines: true });

console.log(`Parsed ${data.length} rows from source CSV`);

// Normalize header keys and pick fields
const rows = data.map(r => {
  // Find the theme column dynamically to be resilient to header changes
  const themeKey = Object.keys(r).find(k => /Trick-?or-?Treat Name/i.test(k)) || "Theme";
  const addressKey = Object.keys(r).find(k => /^Address\s*$/i.test(k)) || "Address";
  const householdKey = Object.keys(r).find(k => /Household Name/i.test(k)) || "Name";
  
  return {
    "Trick-or-Treat Name": (r[themeKey] || "").trim(),
    "Address": (r[addressKey] || r["Address "] || "").trim(),
    "Household Name": (r[householdKey] || "").trim()
  };
}).filter(x => x["Trick-or-Treat Name"]); // Only include rows with a theme name

console.log(`Filtered to ${rows.length} valid participants`);

const csv = Papa.unparse(rows, { columns: ["Trick-or-Treat Name","Address","Household Name"] });
await fs.writeFile(output, csv, "utf8");
console.log(`✅ Wrote ${rows.length} rows → ${output}`);
console.log("\nSample of first 3 entries:");
rows.slice(0, 3).forEach((row, i) => {
  console.log(`${i + 1}. ${row["Trick-or-Treat Name"]} - ${row["Address"]}`);
});