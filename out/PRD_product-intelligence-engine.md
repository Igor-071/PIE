

## JSON Snapshot

```json
{
  "tier1": {
    "projectName": "Product Intelligence Engine",
    "screens": [],
    "navigation": [],
    "apiEndpoints": [],
    "dataModels": [
      {
        "name": "StrategicText",
        "type": "typescript-interface",
        "schema": {
          "value": "string | null",
          "confidence": "ConfidenceLevel",
          "sourceType": "SourceType",
          "sources": "string[]",
          "notes": "string"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "Screen",
        "type": "typescript-interface",
        "schema": {
          "name": "string",
          "path": "string",
          "component": "string",
          "framework": "string"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "NavigationItem",
        "type": "typescript-interface",
        "schema": {
          "label": "string",
          "path": "string",
          "children": "NavigationItem[]"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "ApiEndpoint",
        "type": "typescript-interface",
        "schema": {
          "method": "string",
          "path": "string",
          "handler": "string",
          "framework": "string"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "DataModel",
        "type": "typescript-interface",
        "schema": {
          "name": "string",
          "type": "string",
          "schema": "Record<string, unknown>",
          "location": "string"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "Event",
        "type": "typescript-interface",
        "schema": {
          "name": "string",
          "type": "string",
          "handler": "string",
          "location": "string"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "AiMetadata",
        "type": "typescript-interface",
        "schema": {
          "extractedAt": "string",
          "stackDetected": "string[]",
          "missingPieces": "string[]",
          "extractionNotes": "string[]",
          "tier1Confidence": "ConfidenceLevel"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "Tier1Data",
        "type": "typescript-interface",
        "schema": {
          "projectName": "string",
          "screens": "Screen[]",
          "navigation": "NavigationItem[]",
          "apiEndpoints": "ApiEndpoint[]",
          "dataModels": "DataModel[]",
          "statePatterns": "StatePattern[]",
          "events": "Event[]",
          "aiMetadata": "AiMetadata"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "BrandFoundations",
        "type": "typescript-interface",
        "schema": {
          "mission": "StrategicText",
          "vision": "StrategicText",
          "values": "StrategicText",
          "brandPersonality": "StrategicText"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "TargetAudience",
        "type": "typescript-interface",
        "schema": {
          "segment": "StrategicText",
          "demographics": "StrategicText",
          "psychographics": "StrategicText",
          "painPoints": "StrategicText",
          "goals": "StrategicText"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "PositioningAndMessaging",
        "type": "typescript-interface",
        "schema": {
          "positioning": "StrategicText",
          "keyMessages": "StrategicText",
          "toneOfVoice": "StrategicText",
          "uniqueSellingProposition": "StrategicText"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "Competitor",
        "type": "typescript-interface",
        "schema": {
          "name": "StrategicText",
          "strengths": "StrategicText",
          "weaknesses": "StrategicText",
          "differentiation": "StrategicText"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "CompetitiveAnalysis",
        "type": "typescript-interface",
        "schema": {
          "competitors": "Competitor[]",
          "marketPosition": "StrategicText",
          "competitiveAdvantages": "StrategicText"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "LeanCanvas",
        "type": "typescript-interface",
        "schema": {
          "problem": "StrategicText",
          "solution": "StrategicText",
          "keyMetrics": "StrategicText",
          "uniqueValueProposition": "StrategicText",
          "unfairAdvantage": "StrategicText",
          "channels": "StrategicText",
          "customerSegments": "StrategicText",
          "costStructure": "StrategicText",
          "revenueStreams": "StrategicText"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "CustomerProfile",
        "type": "typescript-interface",
        "schema": {
          "name": "StrategicText",
          "role": "StrategicText",
          "goals": "StrategicText",
          "challenges": "StrategicText",
          "behaviors": "StrategicText",
          "needs": "StrategicText"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "ProblemDefinition",
        "type": "typescript-interface",
        "schema": {
          "problemStatement": "StrategicText",
          "problemValidation": "StrategicText",
          "affectedUsers": "StrategicText",
          "impact": "StrategicText"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "SolutionOverview",
        "type": "typescript-interface",
        "schema": {
          "valueProposition": "StrategicText",
          "keyFeatures": "StrategicText",
          "benefits": "StrategicText",
          "successMetrics": "StrategicText"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "PrdJson",
        "type": "typescript-interface",
        "schema": {
          "tier1": "Tier1Data",
          "tier2": "{",
          "brandFoundations": "BrandFoundations",
          "targetAudience": "TargetAudience[]",
          "positioningAndMessaging": "PositioningAndMessaging",
          "competitiveAnalysis": "CompetitiveAnalysis",
          "leanCanvas": "LeanCanvas",
          "customerProfiles": "CustomerProfile[]",
          "problemDefinition": "ProblemDefinition",
          "solutionOverview": "SolutionOverview"
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "ClientQuestion",
        "type": "typescript-interface",
        "schema": {
          "field": "string",
          "question": "string",
          "reason": "string",
          "priority": "\"high\" | \"medium\" | \"low\""
        },
        "location": "src/models/schema.ts"
      },
      {
        "name": "QuestionsForClient",
        "type": "typescript-interface",
        "schema": {
          "questions": "ClientQuestion[]",
          "generatedAt": "string"
        },
        "location": "src/models/schema.ts"
      }
    ],
    "statePatterns": [],
    "events": [],
    "aiMetadata": {
      "extractedAt": "2025-12-04T08:32:13.722Z",
      "stackDetected": [
        "nodejs"
      ],
      "missingPieces": [],
      "extractionNotes": [
        "Scanned 47 files",
        "Found 0 screens/pages",
        "Found 0 API endpoints",
        "Found 20 data model files",
        "Found 0 navigation items",
        "Found 0 state management patterns",
        "Found 0 event handlers"
      ],
      "tier1Confidence": "medium"
    }
  },
  "tier2": {
    "brandFoundations": {
      "mission": {
        "value": "To convert ZIP repositories into structured PRDs, enhancing clarity and efficiency in product development.",
        "confidence": "high",
        "sourceType": "uploaded_brief",
        "sources": [
          "package-metadata"
        ],
        "notes": "Extracted directly from the project metadata."
      },
      "vision": {
        "value": "To be the leading tool in automating the creation of product requirement documents from codebases.",
        "confidence": "high",
        "sourceType": "uploaded_brief",
        "sources": [
          "package-metadata"
        ],
        "notes": "Extracted directly from the project metadata."
      },
      "values": {
        "value": "Innovation, Efficiency, Clarity",
        "confidence": "low",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from the purpose of automating PRD generation."
      },
      "brandPersonality": {
        "value": "Professional, Innovative, User-Friendly",
        "confidence": "low",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from the project's goals."
      }
    },
    "targetAudience": [
      {
        "segment": {
          "value": "Product Managers, Developers, Stakeholders",
          "confidence": "medium",
          "sourceType": "model_inference",
          "sources": [],
          "notes": "Inferred from the purpose of the tool."
        },
        "demographics": {
          "value": "Tech-savvy individuals, primarily in software development and product management roles.",
          "confidence": "medium",
          "sourceType": "model_inference",
          "sources": [],
          "notes": "Inferred based on typical users of product management tools."
        },
        "psychographics": {
          "value": "Value efficiency and clarity in product documentation.",
          "confidence": "medium",
          "sourceType": "model_inference",
          "sources": [],
          "notes": "Based on inferred goals of the audience."
        },
        "painPoints": {
          "value": "Difficulty in translating codebases into actionable product requirements, time-consuming documentation processes.",
          "confidence": "medium",
          "sourceType": "model_inference",
          "sources": [],
          "notes": "Inferred from the product's purpose."
        },
        "goals": {
          "value": "To streamline product development processes and improve documentation accuracy.",
          "confidence": "medium",
          "sourceType": "model_inference",
          "sources": [],
          "notes": "Inferred from the product's purpose."
        }
      }
    ],
    "positioningAndMessaging": {
      "positioning": {
        "value": "The essential tool for transforming codebases into clear and structured product requirements.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from the product description."
      },
      "keyMessages": {
        "value": "Transform your development process with automated PRD generation.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from product goals."
      },
      "toneOfVoice": {
        "value": "Professional and clear, with a focus on efficiency.",
        "confidence": "low",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred based on the product's nature."
      },
      "uniqueSellingProposition": {
        "value": "Automated PRD generation from ZIP repositories, saving time and enhancing clarity.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from product features."
      }
    },
    "competitiveAnalysis": {
      "competitors": [],
      "marketPosition": {
        "value": "Emerging tool in the product management software market.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from product context."
      },
      "competitiveAdvantages": {
        "value": "Unique focus on automating PRD generation from codebases.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred based on product functionality."
      }
    },
    "leanCanvas": {
      "problem": {
        "value": "Product teams struggle with creating comprehensive PRDs from codebases, leading to inefficiencies.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from the problem the product addresses."
      },
      "solution": {
        "value": "Automated generation of structured PRDs from ZIP repositories.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from the product description."
      },
      "keyMetrics": {
        "value": "Number of PRDs generated, user satisfaction scores, time saved in documentation.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred based on typical metrics for product management tools."
      },
      "uniqueValueProposition": {
        "value": "Transform ZIP repositories into actionable product requirements, enhancing team productivity.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from the product's goals."
      },
      "unfairAdvantage": {
        "value": "First-mover advantage in automating PRD generation from code.",
        "confidence": "low",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred but uncertain due to lack of competitors."
      },
      "channels": {
        "value": "Online marketing, partnerships with development tool providers.",
        "confidence": "low",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred based on typical channels for similar products."
      },
      "customerSegments": {
        "value": "Software development teams, product management professionals.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from the target audience."
      },
      "costStructure": {
        "value": "Development costs, marketing expenses, customer support.",
        "confidence": "low",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred based on standard business models."
      },
      "revenueStreams": {
        "value": "Subscription fees, one-time licensing fees.",
        "confidence": "low",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred based on common strategies in software products."
      }
    },
    "customerProfiles": [],
    "problemDefinition": {
      "problemStatement": {
        "value": "Manual PRD creation from codebases is inefficient and prone to errors.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from product goals."
      },
      "problemValidation": {
        "value": "Product teams report significant time spent on documentation.",
        "confidence": "low",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred based on industry feedback."
      },
      "affectedUsers": {
        "value": "Product managers, developers, and teams involved in creating product requirements.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from the target audience."
      },
      "impact": {
        "value": "Increased time to market and reduced product quality due to inefficient documentation processes.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred based on typical outcomes of poor documentation."
      }
    },
    "solutionOverview": {
      "valueProposition": {
        "value": "Automate the PRD generation process to save time and reduce errors.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from the product's primary function."
      },
      "keyFeatures": {
        "value": "Converts ZIP repositories into structured PRDs, user-friendly interface, integration with development tools.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred based on expected features."
      },
      "benefits": {
        "value": "Faster documentation processes, improved accuracy, enhanced collaboration among teams.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred from the product's objectives."
      },
      "successMetrics": {
        "value": "User adoption rates, reduction in time spent on documentation, positive user feedback.",
        "confidence": "medium",
        "sourceType": "model_inference",
        "sources": [],
        "notes": "Inferred based on common success metrics."
      }
    }
  },
  "metadata": {
    "version": "1.0.0",
    "generatedAt": "2025-12-04T08:32:13.723Z",
    "generatorVersion": "0.1.0"
  }
}
```
