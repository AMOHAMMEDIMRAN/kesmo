import * as fs from "fs";
import * as path from "path";

const promptsDir = path.join(__dirname, "prompts");
const outputFile = path.join(__dirname, "prompts.json");

function extractName(content: string, filename: string): string {
  const nameMatch = content.match(/^# (.+)$/m);
  return nameMatch ? nameMatch[1].trim() : path.basename(filename, ".md");
}

function determineCategory(name: string): string {
  const lowerName = name.toLowerCase();
  if (/security|cyber|risk/.test(lowerName)) return "security";
  if (/verification/.test(lowerName)) return "verification";
  if (/explore/.test(lowerName)) return "exploration";
  if (/memory|remember/.test(lowerName)) return "memory";
  if (/agent|coordinator|teammate/.test(lowerName)) return "agent";
  if (/tool/.test(lowerName)) return "tools";
  if (/skill/.test(lowerName)) return "skills";
  if (/session/.test(lowerName)) return "session";
  if (/mode|auto/.test(lowerName)) return "modes";
  if (/system|prompt/.test(lowerName)) return "system";
  return "general";
}

try {
  // Read all markdown files
  const files = fs
    .readdirSync(promptsDir)
    .filter((file) => file.endsWith(".md"))
    .sort();

  const prompts = files.map((file) => {
    const filePath = path.join(promptsDir, file);
    const content = fs.readFileSync(filePath, "utf8");

    const name = extractName(content, file);
    const category = determineCategory(name);
    const prompt = content.trim();

    return { name, category, prompt };
  });

  // Write to JSON file
  fs.writeFileSync(outputFile, JSON.stringify(prompts, null, 2), "utf8");

  console.log(`✓ Converted ${prompts.length} markdown files to JSON`);
  console.log(`✓ Saved to: ${outputFile}`);
  console.log("\nPreview of first 3 items:");
  prompts.slice(0, 3).forEach((p) => {
    console.log(`  - Name: ${p.name}`);
    console.log(`    Category: ${p.category}`);
    console.log(`    Prompt length: ${p.prompt.length} chars\n`);
  });
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
