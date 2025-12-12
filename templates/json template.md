{
  "_meta": {
    "mandatoryFields": {
      "project.name": "Project title as stated in client brief or prototype documentation",
      "project.client": "Client organisation name from brief header or project documentation",
      "brandFoundations.brandDescription": "Extract from 'About Us', brand overview, or company description sections in brief",
      "brandFoundations.mission": "Mission statement from brief's brand section or strategic overview",
      "brandFoundations.vision": "Vision statement from brief's brand foundations or future state description",
      "problemDefinition.primaryProblem": "Core problem statement from brief's problem/challenge section or user research findings",
      "solutionOverview.valueProposition": "Value proposition from brief's solution overview or product positioning section",
      "targetAudience[0].name": "Audience segment name from brief's target market or persona sections",
      "targetAudience[0].painPoints": "User frustrations and challenges described in personas or user research sections",
      "targetAudience[0].jobsToBeDone": "User goals and needs extracted from persona documentation or user stories"
    },
    "recommendedFields": {
      "positioningAndMessaging.tagline": "Tagline or slogan if present in brand materials or marketing brief",
      "visualIdentity.designInspiration[0].site": "Reference sites or design examples cited in brief's visual direction section"
    }
  },
  "project": {
    "id": "System-generated unique identifier for tracking this PRD instance",
    "name": "Project title as stated in client brief or prototype documentation",
    "client": "Client organisation name from brief header or project documentation",
    "version": "System-managed version number for PRD iteration tracking",
    "createdAt": "System-generated timestamp when PRD is first created",
    "updatedAt": "System-generated timestamp of last PRD modification",
    "date": "Date from brief header or project kickoff documentation",
    "preparedBy": "PM name and role preparing this PRD",
    "description": "Project overview from brief's executive summary or introduction section"
  },
  "brandFoundations": {
    "brandDescription": "Extract from 'About Us', brand overview, or company description sections in brief",
    "mission": "Mission statement from brief's brand section or strategic overview",
    "vision": "Vision statement from brief's brand foundations or future state description",
    "coreValues": [
      "List of values from brand guidelines or company culture sections in brief"
    ],
    "problemStatement": "Problem definition from brief's challenge statement or market analysis section",
    "solutionStatement": "Solution overview from brief's approach or product concept section",
    "toneOfVoice": [
      "Brand voice descriptors from brief's communication guidelines or brand personality section"
    ],
    "brandEthos": "Brand philosophy from strategic positioning or brand essence sections",
    "brandArchetype": "Brand personality type if specified in brand strategy section of brief",
    "brandPromise": "Customer promise statement from brand positioning or value proposition sections"
  },
  "targetAudience": [
    {
      "id": "System-generated unique identifier for this audience segment",
      "name": "Audience segment name from brief's target market or persona sections",
      "segment": "Segmentation criteria from market analysis or customer profiling sections",
      "role": "Job titles listed in persona descriptions or target user profiles",
      "techComfort": "Technical skill level mentioned in persona profiles or user research",
      "demographics": "Age, location, education data from persona demographics or market research sections",
      "psychographics": "Lifestyle, values, attitudes from persona psychographic profiles or user insights",
      "goals": [
        "User objectives listed in persona goals or user needs sections"
      ],
      "painPoints": [
        "User frustrations and challenges described in personas or user research sections"
      ],
      "behaviours": [
        "User behaviour patterns from research findings or behavioural analysis sections"
      ],
      "geography": "Target regions or markets specified in market scope or geographic targeting sections",
      "jobsToBeDone": [
        "User goals and needs extracted from persona documentation or user stories"
      ]
    }
  ],
  "desiredEmotions": [
    "Emotional responses to evoke, listed in brand strategy or experience design sections"
  ],
  "positioningAndMessaging": {
    "tagline": "Tagline or slogan if present in brand materials or marketing brief",
    "positioningStatement": "Market positioning from competitive analysis or brand strategy sections",
    "elevatorPitch": "Pitch text from executive summary or product overview sections",
    "messagingPillars": [
      "Key messages from messaging framework or communication strategy sections"
    ],
    "coreHooks": [
      "Value hooks or selling points from marketing strategy or positioning sections"
    ],
    "narrativeFragments": [
      "Brand stories or examples from narrative sections or case study materials"
    ]
  },
  "visualIdentity": {
    "primaryColor": "Primary brand colour from brand guidelines or design system documentation",
    "secondaryColors": [
      "Supporting colours from brand palette or design specifications"
    ],
    "typography": {
      "headingFont": "Headline typeface specified in brand guidelines or design system",
      "bodyFont": "Body text typeface from typography specifications or design brief"
    },
    "logoPrimary": "Primary logo description or file reference from brand asset specifications",
    "logoSecondary": "Alternative logo variants described in brand guidelines or asset list",
    "symbol": "Brand mark or icon description from visual identity section",
    "imageryGuidelines": [
      "Photography and illustration style rules from brand guidelines or creative brief"
    ],
    "designInspiration": [
      {
        "site": "Reference sites or design examples cited in brief's visual direction section",
        "notes": "Specific design elements or rationale noted in inspiration references"
      }
    ],
    "mockupExamples": [
      "Design mockup references or prototype screens cited in brief materials"
    ]
  },
  "brandAssets": {
    "includedFiles": [
      "List of deliverable files specified in project scope or asset delivery section"
    ],
    "exportFormat": "zip",
    "deliveryUrl": "Asset location if specified in brief or existing in project repository"
  },
  "competitiveAnalysis": {
    "marketCategory": "Market or category definition from competitive landscape or industry analysis sections",
    "positioningSummary": "Competitive positioning summary from market analysis or differentiation sections",
    "comparativeDimensions": [
      "Evaluation criteria from competitive matrix or comparison framework"
    ],
    "competitors": [
      "Competitor names listed in competitive analysis or market overview sections"
    ],
    "differentiationStrategy": {
      "keyOpportunities": [
        "Market gaps identified in opportunity analysis or SWOT sections"
      ],
      "uniqueSellingPoints": [
        "Differentiators listed in competitive advantage or USP sections"
      ],
      "whiteSpaceInsights": "Unmet needs described in market gap analysis or opportunity sections",
      "blueOceanIndicators": [
        "Untapped market opportunities from strategic analysis or innovation sections"
      ]
    },
    "visualReferences": [
      "Competitor screenshots or examples referenced in competitive visual analysis"
    ]
  },
  "webAndContentNotes": {
    "websiteGoals": [
      "Website objectives from digital strategy or web requirements sections"
    ],
    "requiredPages": ["Page list from sitemap or content inventory sections"],
    "techRequirements": [
      "Technical specifications from requirements or platform sections"
    ],
    "contentStrategyNotes": "Content guidance from content strategy or editorial brief sections"
  },
  "problemDefinition": {
    "context": "Background information from situation analysis or market context sections",
    "primaryProblem": "Core problem statement from brief's problem/challenge section or user research findings",
    "marketGap": "What existing solutions/tools fail to address and why this product is needed now",
    "secondaryProblems": [
      "Related issues from extended problem analysis or user pain points"
    ],
    "businessImpact": "Impact metrics or business case from ROI or business justification sections",
    "userPainPoints": [
      "User challenges from research findings or pain point analysis sections"
    ],
    "outcomes": [
      "Clear, measurable outcomes this product aims to achieve for users and the business"
    ],
    "hypotheses": [
      "Assumptions to test from hypothesis sections or research questions"
    ],
    "constraints": [
      "Limitations listed in constraints or project boundaries sections"
    ]
  },
  "solutionOverview": {
    "valueProposition": "Value proposition from brief's solution overview or product positioning section",
    "keyFeatures": [
      "Core capabilities from feature list or product requirements sections"
    ],
    "differentiators": [
      "Unique features from differentiation or competitive advantage sections"
    ],
    "outOfScopeForNow": [
      "Excluded features from scope limitations or future roadmap sections"
    ],
    "nonFunctionalRequirements": [
      "Performance, security specs from technical requirements or NFR sections"
    ]
  },
  "customerProfiles": {
    "earlyAdopterProfile": {
      "description": "Early adopter characteristics from go-to-market or launch strategy sections",
      "organisationType": ["Company types from target market or ICP sections"],
      "teamSizeRange": "Organisation size from market segmentation or customer profile sections",
      "currentTools": [
        "Existing solutions mentioned in competitive analysis or user research"
      ],
      "triggerEvents": [
        "Purchase triggers from buyer journey or sales insights sections"
      ],
      "successSignals": [
        "Adoption indicators from success criteria or KPI sections"
      ]
    },
    "idealCustomerProfile": {
      "description": "ICP definition from customer profiling or target market sections",
      "organisationType": [
        "Target industries from market segmentation or vertical focus sections"
      ],
      "teamSizeRange": "Target company size from ICP or market sizing sections",
      "regions": [
        "Geographic focus from market scope or regional strategy sections"
      ],
      "budgetRange": "Spending capacity from market analysis or pricing strategy sections",
      "maturityLevel": "Organisational sophistication from ICP or buyer profile sections",
      "keyStakeholders": [
        "Decision-makers from buying committee or stakeholder analysis sections"
      ]
    }
  },
  "leanCanvas": {
    "uniqueValueProposition": "UVP from lean canvas or value proposition sections in brief",
    "unfairAdvantage": "Defensible advantage from competitive strategy or moat analysis sections",
    "customerSegments": [
      "Target segments from lean canvas or market segmentation sections"
    ],
    "existingAlternatives": [
      "Current solutions from competitive landscape or alternatives analysis"
    ],
    "keyMetrics": [
      "Success metrics from KPI framework or measurement plan sections"
    ],
    "highLevelConcept": "Product concept from executive summary or product vision sections",
    "channels": [
      "Distribution channels from go-to-market or channel strategy sections"
    ],
    "costStructure": [
      "Cost categories from business model or financial assumptions sections"
    ],
    "revenueStreams": [
      "Revenue model from monetisation or pricing strategy sections"
    ]
  },
  "goalsAndSuccessCriteria": {
    "primaryGoals": [
      "Primary goal statements (what success looks like)"
    ],
    "successMetrics": [
      {
        "name": "Metric name",
        "description": "What this metric measures and why it matters",
        "target": "Target value / threshold",
        "measurementMethod": "How this metric will be measured"
      }
    ],
    "kpis": [
      "Optional KPI list (short-form)"
    ]
  },
  "mvpScope": {
    "phase": "1",
    "inScope": [
      "High-level in-scope items (feature list)"
    ],
    "features": [
      {
        "name": "Feature name",
        "description": "Feature description",
        "priority": "high",
        "screens": [
          "Related screens"
        ],
        "dependencies": [
          "Dependencies required for this feature"
        ]
      }
    ],
    "outOfScope": [
      "Explicitly out-of-scope items for MVP"
    ],
    "roleStages": [
      {
        "role": "Role name",
        "stages": [
          {
            "name": "Stage name",
            "items": [
              "Step/capability in this stage"
            ]
          }
        ]
      }
    ]
  },
  "assumptions": {
    "technical": [
      "Technical assumptions"
    ],
    "operational": [
      "Operational assumptions"
    ],
    "financial": [
      "Financial assumptions"
    ],
    "legal": [
      "Legal/compliance assumptions"
    ]
  },
  "dependencies": {
    "service": [
      {
        "name": "Service dependency",
        "description": "What it is and why it is needed",
        "impact": "Impact if unavailable or delayed"
      }
    ],
    "operational": [
      {
        "description": "Operational dependency (people/process)",
        "requirement": "Requirement / condition"
      }
    ],
    "content": [
      {
        "description": "Content/legal dependency",
        "source": "Source / owner"
      }
    ]
  },
  "roleDefinition": {
    "roles": [
      {
        "id": "role-id",
        "name": "Role name",
        "description": "Role description"
      }
    ],
    "accessMatrix": [
      {
        "feature": "Feature name",
        "role-id": "Access level (e.g., Read, CRUD)"
      }
    ]
  },
  "productRequirements": [
    {
      "module": "Feature area / module name",
      "purpose": "Purpose (why this exists)",
      "objective": "Objective (what this achieves)",
      "keyCapabilities": [
        "Key capability bullets (optional)"
      ],
      "systemResponsibilities": [
        "What the system must do (optional)"
      ],
      "constraints": [
        "Constraints/limitations (optional)"
      ],
      "features": [
        {
          "name": "Feature name",
          "description": "Feature description",
          "acceptanceCriteria": [
            {
              "id": "ac-1",
              "description": "Specific, testable criterion",
              "testable": true
            }
          ]
        }
      ]
    }
  ],
  "dependencyMapping": [
    {
      "featureArea": "Feature area / module name",
      "dependsOn": [
        "Dependency name"
      ],
      "description": "How/why this dependency blocks or enables delivery"
    }
  ],
  "criticalUserFlows": [
    {
      "id": "flow-1",
      "name": "Flow name",
      "role": "Role performing the flow",
      "goal": "User goal",
      "steps": [
        {
          "stepNumber": 1,
          "action": "User action",
          "screen": "Optional screen name",
          "systemResponse": "Optional system response",
          "painPoint": "Optional pain point"
        }
      ]
    }
  ],
  "technicalRequirements": [
    {
      "category": "architecture",
      "requirements": [
        "Technical requirement"
      ],
      "details": {
        "key": "value"
      }
    }
  ],
  "nonFunctionalRequirements": [
    {
      "category": "performance",
      "requirements": [
        "NFR requirement"
      ],
      "metrics": {
        "p95": "<2s"
      }
    }
  ],
  "riskManagement": {
    "risks": [
      {
        "id": "risk-1",
        "description": "Risk description",
        "category": "technical",
        "probability": "medium",
        "impact": "high",
        "mitigationStrategy": "Mitigation approach"
      }
    ]
  },
  "openQuestions": {
    "questions": [
      {
        "id": "q-1",
        "question": "Open question",
        "category": "client",
        "priority": "high",
        "context": "Why we need an answer"
      }
    ],
    "decisions": [
      {
        "id": "d-1",
        "decision": "Decision statement",
        "rationale": "Rationale",
        "date": "YYYY-MM-DD"
      }
    ]
  },
  "documentMetadata": {
    "documentOwner": "Document owner / PM",
    "stakeholders": [
      "Stakeholder list"
    ],
    "collaborators": [
      "Collaborators / discovery/design contributors"
    ],
    "referenceDocuments": [
      "Reference documents (links)"
    ],
    "jiraLink": "Jira link",
    "trdLink": "TRD link",
    "lastUpdated": "ISO timestamp or date",
    "status": "Draft"
  },
  "deliveryTimeline": {
    "phases": [
      {
        "name": "Phase name",
        "duration": "e.g., 6 weeks",
        "teamSize": {
          "Fullstack Engineer": 2
        },
        "deliverables": [
          "Deliverable list"
        ],
        "milestones": [
          {
            "week": 1,
            "milestone": "Milestone description"
          }
        ],
        "costEstimate": {
          "min": 100000,
          "max": 150000
        }
      }
    ]
  },
  "launchPlan": {
    "launchStrategy": {
      "approach": "Soft launch / phased rollout",
      "phases": [
        {
          "name": "Beta",
          "duration": "2 weeks",
          "description": "Description"
        }
      ]
    }
  },
  "stakeholdersAndRaci": {
    "stakeholders": [
      {
        "name": "Stakeholder name",
        "role": "Role",
        "influence": "high",
        "interest": "high",
        "engagementLevel": "Weekly sync"
      }
    ],
    "raciChart": [
      {
        "activity": "Activity name",
        "responsible": [
          "Engineering"
        ],
        "accountable": [
          "Product"
        ],
        "consulted": [
          "Design"
        ],
        "informed": [
          "Stakeholders"
        ]
      }
    ]
  },
  "glossary": {
    "terms": [
      {
        "term": "Term",
        "definition": "Definition"
      }
    ]
  },
  "screens": [
    {
      "id": "System-generated unique identifier for this screen",
      "name": "Screen name from prototype labels or sitemap in brief",
      "purpose": "Screen function from prototype annotations or user flow descriptions",
      "components": [
        "Component IDs extracted from prototype component inventory or design system"
      ],
      "roleIds": [
        "User roles from prototype access matrix or permission specifications"
      ]
    }
  ],
  "components": [
    {
      "id": "System-generated unique identifier for this component",
      "type": "Component type identified from prototype or design system documentation",
      "props": {
        "key": "Component properties extracted from prototype specifications or design annotations"
      },
      "events": [
        {
          "type": "Interaction type observed in prototype or described in interaction specifications",
          "target": "Event target extracted from prototype flows or interaction model",
          "condition": "Conditional logic from prototype behaviour specifications or business rules"
        }
      ]
    }
  ],
  "navigation": [
    {
      "fromScreenId": "Origin screen from prototype navigation flows or user journey maps",
      "toScreenId": "Destination screen from prototype navigation or sitemap",
      "event": "Trigger action from prototype interactions or flow diagram",
      "condition": "Navigation conditions from prototype logic or business rules documentation"
    }
  ],
  "userJourneys": [
    {
      "roleId": "System-generated unique identifier for this role",
      "roleName": "Role name from user journey maps or persona documentation",
      "scope": "Journey scope from user journey mapping or experience map sections",
      "primaryGoal": "Main objective from journey goal statements or scenario descriptions",
      "secondaryGoals": [
        "Supporting goals from extended journey analysis or user needs"
      ],
      "phases": [
        {
          "id": "System-generated unique identifier for this phase",
          "name": "Phase name from journey map stage labels or flow sections",
          "description": "Phase details from journey map annotations or phase descriptions",
          "touchpoints": [
            "Interaction channels from touchpoint mapping or channel inventory"
          ],
          "userActions": [
            "Actions from journey map user action lanes or task analysis"
          ],
          "tasks": ["Tasks from task analysis or user story breakdowns"],
          "activities": [
            "Activities from journey phase descriptions or activity mapping"
          ],
          "systemResponses": [
            "System behaviour from journey map system lane or interaction specifications"
          ],
          "painPoints": [
            "Friction points from journey map pain point analysis or research findings"
          ],
          "successMetrics": [
            "Phase metrics from journey measurement framework or success criteria"
          ]
        }
      ]
    }
  ],
  "flowDiagram": {
    "nodes": [
      {
        "id": "System-generated unique identifier for this node",
        "type": "Node type determined from flowchart or process diagram in brief",
        "ref": "Reference ID linking to screen or component in prototype",
        "label": "Node label from flowchart annotations or diagram documentation",
        "roleIds": [
          "Role access from flowchart swim lanes or permission matrix"
        ],
        "metadata": {
          "key": "Additional context from flowchart notes or diagram annotations"
        }
      }
    ],
    "edges": [
      {
        "from": "Origin node from flowchart connections or process flow",
        "to": "Destination node from flowchart arrows or sequence diagram",
        "condition": "Edge condition from flowchart decision criteria or business rules"
      }
    ]
  },
  "dataModel": {
    "EntityName": {
      "fields": {
        "fieldName": {
          "type": "Data type from data dictionary or schema documentation in technical brief",
          "required": "Field requirement from data model specifications or validation rules",
          "unique": "Uniqueness constraint from data model or entity relationship diagram"
        }
      },
      "relationships": [
        {
          "type": "Relationship type from ERD or data model documentation",
          "target": "Related entity from data model relationships or schema",
          "via": "Relationship field from ERD or database schema documentation"
        }
      ]
    }
  },
  "api": [
    {
      "name": "Endpoint name from API documentation or integration specifications in brief",
      "endpoint": "API path from technical specifications or integration guide",
      "method": "HTTP method from API documentation or technical requirements",
      "payloadFields": [
        "Request fields from API specification or integration documentation"
      ],
      "responseFields": [
        "Response fields from API documentation or data contract specifications"
      ],
      "authRequired": "Authentication requirement from security specifications or API documentation"
    }
  ],
  "state": {
    "global": {
      "key": "Application state variables from prototype state management or technical specifications"
    }
  },
  "events": [
    {
      "id": "System-generated unique identifier for this event",
      "type": "Event category determined from prototype interactions or technical specifications",
      "trigger": "Event trigger from prototype behaviour or interaction specifications",
      "inputs": [
        "Event inputs from prototype data flow or technical documentation"
      ],
      "outputs": [
        "Event outputs from prototype state changes or side effect documentation"
      ]
    }
  ],
  "aiMetadata": {
    "creationPrompt": "Original extraction instruction given to AI when analysing the brief or prototype",
    "sourceCodeType": "Type of source analysed: frontend code, backend API, config files, or database schema",
    "extractionSummary": "Brief overview of what was successfully extracted from the source materials",
    "dataQualityAssessment": {
      "highConfidence": [
        "Information explicitly stated in brief or clearly evident in prototype"
      ],
      "mediumConfidence": [
        "Information inferred from context clues or implicit in prototype behaviour"
      ],
      "lowConfidence": [
        "Information requiring validation with stakeholders or additional source materials"
      ],
      "notAvailable": [
        "Expected information completely absent from provided brief and prototype materials"
      ]
    },
    "missingInformation": {
      "fromTier3": [
        "Required PRD information that cannot be extracted from current brief or prototype"
      ],
      "potentialSources": [
        "Suggested documents, stakeholders, or research needed to fill information gaps"
      ],
      "recommendation": "Next steps to obtain missing information before finalising PRD"
    },
    "assumptions": [
      "Interpretive assumptions made when brief or prototype was ambiguous or incomplete"
    ],
    "extractionNotes": "Important caveats about data quality, limitations, or extraction challenges"
  }
}