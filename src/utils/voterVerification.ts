import Papa from 'papaparse';

export const verifyVoter = (epicNumber: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        Papa.parse('/voter_list_final.csv', {
            download: true,
            header: true,
            complete: (results: any) => {
                // Debug log to check parsed data
                console.log("Parsed CSV Data (First 5):", results.data.slice(0, 5));

                // The new CSV headers seem to be EPIC_Number, Voter_Name, Father_Name based on view_file
                // Note: The Voter_Name column in the file seemed to have weird characters like '‌ : ஐரெட்‌ ஜோசப்‌'
                // We will try to parse it as best as possible.
                // Trimming whitespace is crucial.

                const voter = results.data.find((v: any) =>
                    v.EPIC_Number && v.EPIC_Number.trim().toUpperCase() === epicNumber.trim().toUpperCase()
                );

                if (voter) {
                    // Clean up the name if it has the ' : ' prefix seen in the file
                    let name = voter.Voter_Name || voter.Name || "Unknown Voter";
                    name = name.replace(/^‌ : /, '').replace(/,$/, '').trim(); // Remove leading ' : ' and trailing comma if present
                    resolve(name);
                } else {
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
