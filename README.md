# Product Intelligence Engine (PIE)

A tool that converts a ZIP repository (prototype code) + optional brief into a structured JSON PRD + a final Markdown PRD.

## Features

- **Tier 1 Extraction**: Automatically extracts technical information from code (screens, API endpoints, data models, etc.)
- **Tier 2 AI Analysis**: Uses OpenAI to fill strategic business fields (brand foundations, target audience, positioning, etc.)
- **PRD Generation**: Produces structured JSON and Markdown PRD documents
- **Web UI**: User-friendly web interface for easy PRD generation
- **CLI**: Command-line interface for automation and integration

## Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

```bash
npm install
npm run build
```

### Environment Setup

Create a `.env` file in the root directory:

```
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

## Usage

### Web UI (Recommended)

Start the web interface:

```bash
npm run web:dev
```

Then open `http://localhost:3000` in your browser.

1. Upload a ZIP file containing your repository
2. Optionally add a brief with additional context
3. Click "Generate PRD"
4. Download the generated PRD files

### CLI

```bash
# Basic usage
npm run dev generate-prd <path-to-repo.zip>

# With options
npm run dev generate-prd <path-to-repo.zip> \
  --brief <brief-file.txt> \
  --output ./out \
  --max-questions 10
```

## Output Files

The system generates three files:

1. **prd-structured.json** - Complete PRD in JSON format with all Tier 1 and Tier 2 data
2. **PRD_<projectName>.md** - Human-readable Markdown PRD document
3. **questions-for-client.json** - Follow-up questions for missing or low-confidence fields

## Architecture

### Tier 1 Module (Code → Technical JSON)
- Extracts technical data from code structure
- No business assumptions
- Fields: project name, screens, navigation, API endpoints, data models, state patterns, events

### Tier 2 Module (Strategy Agent - LLM)
- Fills business and strategic fields using OpenAI
- Wraps outputs in `StrategicText` with confidence tracking
- Generates follow-up questions for missing information

### PRD Generator
- Converts structured JSON to Markdown PRD
- Uses template-based generation
- Adds TODO markers for missing fields

## Project Structure

```
product-intelligence-engine/
├── src/              # Core CLI implementation
│   ├── core/        # Core modules (Tier 1, Tier 2, PRD generation)
│   ├── cli/         # CLI commands
│   └── models/      # TypeScript schemas
├── web/             # Next.js web application
│   ├── app/         # Next.js app router (pages & API routes)
│   └── components/  # React components
├── templates/       # PRD template files
└── dist/            # Compiled JavaScript
```

## Development

### Build

```bash
# Build CLI
npm run build

# Build Web UI
npm run web:build
```

### Run Tests

```bash
npm test
```

## License

MIT

