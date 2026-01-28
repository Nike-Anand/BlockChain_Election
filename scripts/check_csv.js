
import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';

const csvPath = path.join(process.cwd(), 'public', 'voter_list_final.csv');
const fileContent = fs.readFileSync(csvPath, 'utf8');

Papa.parse(fileContent, {
    header: true,
    complete: (results) => {
        console.log(`Total Rows Parsed: ${results.data.length}`);

        if (results.data.length > 0) {
            const keys = Object.keys(results.data[0]);
            console.log("Raw Header Keys:", keys.map(k => `'${k}'`)); // wrapped in quotes to see whitespace

            const epicKey = keys.find(k => k.trim().toUpperCase().includes('EPIC'));
            console.log(`Detected EPIC Key: '${epicKey}'`);

            if (!epicKey) {
                console.error("CRITICAL: Could not find column with 'EPIC' in header.");
                process.exit(1);
            }

            let validCount = 0;
            let emptyCount = 0;
            let sample = [];

            results.data.forEach((row, index) => {
                const epic = row[epicKey];
                if (epic && epic.trim().length > 0) {
                    validCount++;
                    if (index < 5) sample.push(epic.trim());
                } else {
                    emptyCount++;
                    // console.log(`Row ${index} has empty EPIC:`, row);
                }
            });

            console.log(`Valid EPICs found: ${validCount}`);
            console.log(`Empty/Invalid Rows: ${emptyCount}`);
            console.log("First 5 Valid EPICs:", sample);
        }
    },
    error: (err) => {
        console.error("Parse Error:", err);
    }
});
