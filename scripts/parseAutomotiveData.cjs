const fs = require('fs');
const path = require('path');

async function main() {
  const sqlPath = path.join(__dirname, '../temp_auto_data/data.sql');
  const outPath = path.join(__dirname, '../src/data/automotiveData.json');

  if (!fs.existsSync(sqlPath)) {
    process.stderr.write("SQL file not found at: " + sqlPath + "\n");
    process.exit(1);
  }

  const content = fs.readFileSync(sqlPath, 'utf8');
  // Regular expression to match each row (e.g. (1909, 'Ford', 'Model T'))
  const regex = /\(\s*(\d{4})\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)/g;
  
  const data = {};
  let count = 0;

  for (const match of content.matchAll(regex)) {
    const year = parseInt(match[1], 10);
    const make = match[2].trim();
    const model = match[3].trim();

    if (!data[year]) {
      data[year] = {};
    }
    if (!data[year][make]) {
      data[year][make] = [];
    }
    // Prevent duplicate models for the same year and make
    if (!data[year][make].includes(model)) {
      data[year][make].push(model);
    }
    count++;
  }

  // Sort makes and models alphabetically
  const sortedData = {};
  const sortedYears = Object.keys(data).sort((a, b) => b - a); // descending order (newest first)
  for (const year of sortedYears) {
    sortedData[year] = {};
    const sortedMakes = Object.keys(data[year]).sort();
    for (const make of sortedMakes) {
      sortedData[year][make] = data[year][make].sort();
    }
  }

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(sortedData, null, 2), 'utf8');
  process.stdout.write(`Successfully parsed ${count} vehicle records into ${outPath}\n`);
}

main().catch(err => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});
