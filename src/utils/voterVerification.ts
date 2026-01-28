import Papa from 'papaparse';

export const verifyVoter = (epicNumber: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        Papa.parse('/voter_list_final.csv', {
            download: true,
            header: true,
            skipEmptyLines: true, // Ignore empty rows
            complete: (results: any) => {
                // Debug log
                console.log(`Parsed ${results.data.length} voters.`);

                // Safe column finding
                const keys = results.data.length > 0 ? Object.keys(results.data[0]) : [];
                const epicKey = keys.find(k => k.trim().toUpperCase().includes('EPIC'));
                const nameKey = keys.find(k => k.trim().toUpperCase().includes('NAME') && !k.trim().toUpperCase().includes('FATHER'));

                if (!epicKey) {
                    console.error("CSV Error: Could not find 'EPIC_Number' column.");
                    resolve(null);
                    return;
                }

                const targetEpic = epicNumber.trim().toUpperCase().replace(/\s+/g, '');

                const voter = results.data.find((v: any) => {
                    if (!v[epicKey]) return false;
                    const recordEpic = v[epicKey].trim().toUpperCase().replace(/\s+/g, '');
                    return recordEpic === targetEpic;
                });

                if (voter) {
                    let rawName = nameKey ? (voter[nameKey] || "Unknown Voter") : "Unknown Voter";
                    // Remove ZWNJ (u200C), colons, leading/trailing spaces, and commas
                    let name = rawName.replace(/[\u200C\u200B]/g, '').replace(/^[\s,:]+/, '').replace(/[\s,:]+$/, '').trim();
                    console.log(`Voter Verified: ${name} (${targetEpic})`);
                    resolve(name);
                } else {
                    console.warn(`EPIC ${targetEpic} NOT FOUND in ${results.data.length} records.`);
                    resolve(null);
                }
            },
            error: (err: any) => {
                console.error("CSV Parse Error:", err);
                reject(err);
            }
        });
    });
};
