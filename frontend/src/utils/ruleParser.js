// The backend stores each rule as one long text block such as:
//   RULE TITLE: ...
//   LEGAL REFERENCE: ...
//   LEGAL REQUIREMENT: ...
// This splits it into sections, using the same pattern as the PDF generator in main.py.
const SECTION_PATTERN = /^([A-Z][A-Z &/-]{2,}):\s*(.*)$/;

export function parseRule(rawText) {
  const sections = {};
  let current = null;

  for (const rawLine of (rawText || "").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(SECTION_PATTERN);
    if (match) {
      current = match[1];
      sections[current] = match[2].trim();
    } else if (current) {
      sections[current] = `${sections[current]} ${line}`.trim();
    } else if (!sections["RULE TITLE"]) {
      sections["RULE TITLE"] = line;
    }
  }

  const { "RULE TITLE": title, "LEGAL REFERENCE": reference, ...others } = sections;
  return { title: title || "", reference: reference || "", sections: others };
}
