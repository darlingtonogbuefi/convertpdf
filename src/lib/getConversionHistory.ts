//  src\lib\getConversionHistory.ts


export function getConversionHistory() {
  try {
    const raw = localStorage.getItem("conversionHistory");
    if (!raw) return [];

    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse history", err);
    return [];
  }
}