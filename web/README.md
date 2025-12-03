# Product Intelligence Engine - Web UI

Web interface for the Product Intelligence Engine that converts ZIP repositories into structured PRDs.

## Getting Started

### Prerequisites

- Node.js 18+ 
- OpenAI API key (set in parent directory `.env` file)

### Installation

Dependencies are already installed. Make sure the parent project is built:

```bash
cd ..
npm run build
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Usage

1. **Upload ZIP File**: Drag and drop or click to select a ZIP file containing your repository
2. **Add Brief** (Optional): Provide additional context about your product
3. **Generate PRD**: Click "Generate PRD" to start the process
4. **Track Progress**: Watch the progress as the system:
   - Unzips the repository
   - Extracts technical data (Tier 1)
   - Runs AI analysis (Tier 2)
   - Generates the PRD documents
5. **Download Results**: Once complete, download:
   - `prd-structured.json` - Complete PRD in JSON format
   - `PRD_<projectName>.md` - Markdown PRD document
   - `questions-for-client.json` - Follow-up questions

## Architecture

- **Frontend**: Next.js 14+ with React and Tailwind CSS
- **API Routes**: Next.js API routes that call the core PIE modules
- **Progress Tracking**: In-memory job store with polling
- **File Handling**: Multipart form uploads with temporary file storage

## Environment Variables

The web app reads environment variables from the parent directory `.env` file:
- `OPENAI_API_KEY` - Required for Tier 2 AI analysis
- `OPENAI_MODEL` - Optional, defaults to `gpt-4o-mini`
