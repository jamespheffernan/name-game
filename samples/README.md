# Sample PDFs

This directory is for storing sample student roster PDFs for testing the import functionality.

## How to Use

1. Place your student roster PDFs in this directory
2. Use the CLI tool to import them:

```bash
npm run cli parse-pdf samples/your-roster.pdf
```

## PDF Format Requirements

The current PDF parser is fairly simple and expects:
- Each student to be on a separate line in the PDF
- Names to be in the format "FirstName LastName" 
- No complex tables or layouts

For more complex PDFs, you may need to customize the parser in `src/services/pdfParser.js`.

## Examples

Until you have real PDFs to work with, you can create simple text files and convert them to PDFs for testing:

1. Create a text file (`students.txt`):
```
John Smith
Jane Doe
Alex Johnson
Sarah Williams
Michael Brown
```

2. Convert it to PDF using an online converter or a tool like `pandoc`:
```bash
pandoc students.txt -o students.pdf
```

3. Import the sample PDF:
```bash
npm run cli parse-pdf samples/students.pdf
```