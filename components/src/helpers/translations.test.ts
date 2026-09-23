import { translations } from "./translations";

describe("translations", () => {
  const esKeys = Object.keys(translations.es).sort();
  const enKeys = Object.keys(translations.en).sort();

  it("has no Spanish key missing in English", () => {
    expect(esKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
  });

  it("has no English key missing in Spanish", () => {
    expect(enKeys.filter((k) => !esKeys.includes(k))).toEqual([]);
  });

  it("has no empty strings", () => {
    for (const lang of ["es", "en"] as const) {
      const empty = Object.entries(translations[lang]).filter(([, v]) => !String(v).trim());
      expect(empty, `empty values in ${lang}`).toEqual([]);
    }
  });

  it("keeps the same {placeholders} in both languages", () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    const es = translations.es as Record<string, string>;
    const en = translations.en as Record<string, string>;
    const mismatched = Object.keys(es).filter(
      (k) => k in en && placeholders(es[k]).join() !== placeholders(en[k]).join(),
    );
    expect(mismatched).toEqual([]);
  });
});
