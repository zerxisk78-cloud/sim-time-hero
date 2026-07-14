I inspected `071426.xlsx`. It contains both FTD blocks correctly:

- Z-FTD: `AH-1Z FTD 2F197-1`, 12 rows from `0530` through `2200`
- Y-FTD: `UH-1Y FTD 2F196B-2`, 11 rows from `0530` through `2030`
- No skipped simulator descriptions in this workbook

Plan:

1. Fix repeated header handling in the finished-report importer
   - The workbook repeats the header row (`Description / Status / ETD / ...`) before each simulator block.
   - The importer should explicitly skip those repeated header rows before treating `Description` as a simulator description.
   - This prevents the importer from briefly setting the active simulator block to `null` on repeated headers.

2. Normalize finished-report values before saving
   - Strip trailing commas from status/unit/crew values.
   - Treat `OPEN,` as `OPEN` and `UnOPEN,` as `CLOSED` consistently.
   - Keep scheduled/reserved rows populated with their unit and crew values.

3. Add a regression test for the uploaded workbook shape
   - Verify a finished-report workbook with repeated headers imports:
     - `ah1z-ftd` with 12 rows including `0530` and `2200`
     - `uh1y-ftd` with 11 rows including `0530`, `1900`, and `2030`
   - Verify repeated header rows are not reported as skipped simulator descriptions.

4. Verify after implementation
   - Run the focused import test.
   - Confirm the Admin import report should show both FTDs populated, not missing due to extended Z-FTD hours.