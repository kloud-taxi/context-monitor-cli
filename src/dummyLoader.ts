/**
 * Utility for loading and normalising dummy data used in the project.
 *
 * The function reads a JSON file, validates each entry against a schema and
 * returns a normalised representation that can be safely consumed by the
 * rest of the code‑base.
 *
 * The implementation is deliberately generic – you can adapt the `Dummy`
 * interface and the `normalise` function to match the shape of your dummy
 * data.  It uses the built‑in `fs/promises` API so it works in both Node and
 * the bundled Electron environment used by the CLI.
 */

import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

/**
 * Define the expected shape of a single dummy record.
 * Adjust the fields to match your actual dummy JSON structure.
 */
const DummySchema = z.object({
  // Example fields – replace with real ones
  id: z.number(),
  name: z.string(),
  // Optional fields can be marked as such
  description: z.string().optional(),
  // Normalise timestamps to Date objects
  // Explicitly type the input to avoid implicit any errors
  createdAt: z.string().transform((s: string) => new Date(s)),
});

/**
 * TypeScript type inferred from the Zod schema – this is the *raw* shape
 * read from the JSON file.
 */
export type RawDummy = z.infer<typeof DummySchema>;

/**
 * Normalised representation used by the application.  In this simple example
 * we keep the same fields but you could rename, combine or compute additional
 * properties here.
 */
export interface NormalisedDummy {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
}

/**
 * Convert a raw dummy record into the normalised form.
 */
function normalise(raw: RawDummy): NormalisedDummy {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? null,
    createdAt: raw.createdAt,
  };
}

/**
 * Load a JSON file containing an array of dummy objects, validate each entry
 * and return the normalised array.
 *
 * @param relativePath Path relative to the project root (e.g. "data/dummy.json")
 * @returns Promise that resolves with an array of NormalisedDummy objects
 */
export async function loadDummyData(
  relativePath: string,
): Promise<NormalisedDummy[]> {
  // Resolve the absolute path – this works regardless of where the CLI is run
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const fileContent = await fs.readFile(absolutePath, { encoding: "utf-8" });
  const parsed = JSON.parse(fileContent);

  if (!Array.isArray(parsed)) {
    throw new Error("Dummy data JSON must be an array of objects");
  }

  // Validate each entry against the Zod schema and normalise it
  const result: NormalisedDummy[] = [];
  for (const item of parsed) {
    const raw = DummySchema.parse(item); // throws if invalid
    result.push(normalise(raw));
  }
  return result;
}

/**
 * Example usage (uncomment for quick manual testing):
 *
 * (async () => {
 *   const data = await loadDummyData("data/dummy.json");
 *   console.log(data);
 * })();
 */
