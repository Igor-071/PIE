# Gold Standard Product Requirements Document (PRD)

**Version:** {{prdVersion}}  
**Document Type:** Canonical / AI-Ready  
**Ownership:** Product Strategy

---

## 0. Document Metadata

**Purpose:** Ensure traceability, governance, and AI parsing.

- **Product Name:** {{productName}}  
- **PRD Version:** {{prdVersion}}  
- **Status:** {{status}}  
- **Document Owner:** {{documentOwner}}  
- **Stakeholders:** {{stakeholders}}  
- **Source Inputs:** {{sourceInputs}}  
- **Last Updated:** {{lastUpdated}}  
- **Linked Artifacts:** {{linkedArtifacts}}

---

## 1. Executive Summary

<!--
INSTRUCTION:
Provide a concise, executive-level overview of the product and its purpose.

Answer explicitly:
- What problem does this product solve?
- Who is affected by this problem?
- What is the proposed solution at a high level?
- Why is this initiative important now?
- What business or strategic impact is expected?

Constraints:
- Single short paragraph (7-10 sentences max)
- Written for CEO / Board audience
- No technical details
- No feature lists
- Clear, confident, outcome-focused language
-->

{{executiveSummary}}

---

## 2. Brand & Product Foundations

<!--
INSTRUCTION:
Define the product's identity, intent, and boundaries to guide all future decisions.

Answer explicitly:
- Why does this product exist beyond solving the immediate problem?
- What long-term future or change does the product aim to create?
- What promise does the product make to its users?
- What values guide product and design decisions?
- How should the product communicate and feel to users?
- What does this product explicitly NOT aim to be or do?

Constraints:
- Be clear and concrete, not aspirational fluff
- Avoid buzzwords and generic statements
- Keep statements short and decisive
- This section should prevent feature drift and inconsistent messaging
-->

{{brandFoundations}}

---

### 3.1 Primary Problem

<!--
INSTRUCTION (do not include in final PRD output):

Clearly articulate the single most important problem this product exists to solve.

Answer all of the following explicitly:
- Who experiences the problem? (role, context)
- What exactly is broken or inefficient?
- Where does the problem manifest? (process, system, moment)
- Why is this problem critical now? (cost, risk, missed opportunity)
- What happens if this problem is NOT solved?

Constraints:
- Focus on ONE core problem (not a list)
- Avoid describing the solution
- Use clear, non-technical language
- 3–6 sentences max
-->

**Primary Problem**

{{primaryProblem}}

---

## 4. User & Stakeholder Landscape

### 4.1 Primary Personas

<!--
INSTRUCTION:
Define the primary user personas for whom this product is being built.

Answer explicitly for EACH primary persona:
- Who is the user? (role, seniority, domain)
- In what context do they use the product?
- What goals are they trying to achieve?
- What are their key pain points related to the problem?
- What job are they hiring this product to do?
- How do they define success?

Constraints:
- Personas must be real, not hypothetical
- Focus on decision-making and usage behavior
- Avoid demographic-only descriptions
- 1–3 primary personas maximum
-->

{{primaryPersonas}}

---

### 4.2 Secondary Personas

<!--
INSTRUCTION:
Identify secondary or indirect users who interact with the product or are affected by its outcomes.

Answer explicitly:
- Who are the secondary users or observers?
- How do they interact with or depend on the product?
- What information or outcomes do they care about?

Constraints:
- Include only personas that materially influence adoption or success
- Do not repeat primary personas
- Keep descriptions concise
-->

{{secondaryPersonas}}

---

### 4.3 Internal Stakeholders

<!--
INSTRUCTION:
List internal stakeholders who have an interest in or dependency on this product.

Answer explicitly:
- Which internal roles or teams are involved?
- Why does this product matter to them?
- What decisions, workflows, or outcomes depend on it?

Constraints:
- Focus on stakeholders with decision power or operational dependency
- Avoid listing entire departments without justification
-->

{{internalStakeholders}}

---

## 5. Value Proposition & Solution Overview

<!--
INSTRUCTION:
Explain how the product addresses the defined problem and why it is valuable to users and the business.

Answer explicitly:
- What core value does the product deliver?
- How does it help solve the primary problem?
- What key benefits does it provide to each primary persona?
- What makes this solution meaningfully different from existing alternatives?
- Why is this approach effective given the current context?

Constraints:
- Focus on outcomes and value, not feature lists
- Do not repeat the problem statement verbatim
- Avoid technical or implementation details
- 1–2 short paragraphs maximum
-->

{{valueProposition}}

---

## 6. Strategic Model

<!--
INSTRUCTION:
Describe the strategic and business context in which this product operates.

Answer explicitly:
- Who are the primary customer segments?
- What core value streams does the product create?
- How is value captured or justified? (revenue, cost reduction, risk reduction, efficiency)
- What key metrics indicate strategic success?
- Through which channels does the product reach its users?

Constraints:
- High-level strategic view only
- Do not include detailed financial models
- Avoid operational or implementation details
- 1 short section (bullets or concise paragraphs)
-->

{{strategicModel}}

---

## 7. Goals, Success Metrics & KPIs

### 7.1 Product Goals

<!--
INSTRUCTION:
Define the concrete outcomes that must be achieved for this product to be considered successful.

Answer explicitly:
- What must be true after launch for this product to be a success?
- What user, business, or operational outcomes are expected?
- How do these goals relate directly to the primary problem?

Constraints:
- Goals must be outcome-oriented, not activity-based
- Avoid vague language (e.g. "improve", "optimize" without context)
- 3–6 goals maximum
-->

{{productGoals}}

---

### 7.2 Success Metrics & KPIs

<!--
INSTRUCTION:
Define how success will be measured for each product goal.

Answer explicitly:
- Which metrics indicate progress or success?
- What target value defines success?
- How and when will each metric be measured?

Constraints:
- Every goal must map to at least one metric
- Metrics must be objectively measurable
- Avoid vanity metrics
-->

{{successMetrics}}

---

## 8. Scope Definition

### 8.1 MVP Scope (In Scope)

<!--
INSTRUCTION:
Define the minimum set of capabilities required to solve the primary problem and achieve the stated goals.

Answer explicitly for EACH item:
- What is the capability or feature?
- What user problem or goal does it address?
- What value does it deliver to the user?
- How critical is it for MVP success?
- Which screens or user flows does it affect?

Constraints:
- Focus on outcomes and capabilities, not technical implementation
- Avoid over-scoping; MVP means "minimum"
- Prioritize based on user value and business impact
- Use a clear, structured list or table
-->

{{mvpInScope}}

---

### 8.2 Out of Scope

<!--
INSTRUCTION:
Explicitly define what will NOT be included in the MVP to protect scope and delivery.

Answer explicitly:
- Which features or capabilities are intentionally excluded?
- Why are they excluded? (e.g. future phase, low priority, high complexity)

Constraints:
- Be explicit and unambiguous
- Do not use placeholders like "TBD"
- This list should prevent scope creep
-->

{{mvpOutOfScope}}

---

## 9. Functional Requirements & Acceptance Criteria

<!--
INSTRUCTION:
Translate the defined scope into clear, testable functional requirements.

Answer explicitly for EACH functional area or feature:
- What does the system need to do?
- In which user context or scenario?
- What conditions must be met for the requirement to be considered complete?
- What edge cases or failure states must be handled?

Constraints:
- Organize requirements by feature or module
- Acceptance criteria must be objectively testable
- Avoid technical implementation details
- Use clear, unambiguous language
-->

{{functionalRequirements}}

---

## 10. User Experience & Interaction Design

### 10.1 Key User Flows

<!--
INSTRUCTION:
Describe the most critical user journeys through the product.

Answer explicitly for EACH key flow:
- What is the user's intent?
- What triggers the flow?
- What steps does the user take?
- How does the system respond at each step?
- What decisions or validations occur?
- What is the successful end state?

Constraints:
- Focus on primary and high-risk flows only
- Use step-by-step structure
- Avoid visual design details
- Keep flows understandable without mockups
-->

{{keyUserFlows}}

---

### 10.2 Navigation & Information Architecture

<!--
INSTRUCTION:
Define how the product is structured and how users move through it.

Answer explicitly:
- What screens or main views exist?
- How do users enter each screen?
- How are screens connected?
- Which roles can access which areas?
- What is restricted or hidden per role?

Constraints:
- Focus on structure, not styling
- Reflect role-based access clearly
- Avoid implementation details (routing, frameworks)
-->

{{navigationArchitecture}}

---

## 11. Data & Domain Model

<!--
INSTRUCTION:
Define the core domain concepts and data entities that underpin the product.

Answer explicitly:
- What are the key entities or objects in the system?
- What does each entity represent in the real world?
- How do these entities relate to each other?
- Who owns or creates each entity?
- How does each entity change over time? (lifecycle)

Constraints:
- Focus on domain concepts, not database schemas
- Avoid technical implementation details (tables, fields, indexes)
- Use clear, business-oriented language
- Include only entities that are relevant to the MVP
-->

{{dataDomainModel}}

---

## 12. Technical Constraints & Architecture (High-Level)

<!--
INSTRUCTION:
Define the high-level technical boundaries and assumptions that shape how the product can be built.

Answer explicitly:
- What platform or environment assumptions are being made?
- How and where is the product expected to be hosted?
- What external systems or services must it integrate with?
- What general API style or communication patterns are expected?
- What assumptions exist around state management or data flow?

Constraints:
- High-level only — this is NOT a Technical Requirements Document (TRD)
- Avoid implementation details, libraries, or frameworks unless critical
- Focus on constraints, not solutions
- Describe boundaries that engineering must respect
-->

{{technicalConstraints}}

---

## 13. Non-Functional Requirements

<!--
INSTRUCTION:
Define the quality attributes and system guarantees that must be upheld regardless of feature behavior.

Answer explicitly for EACH quality attribute:
- What requirement must the system meet?
- How is this requirement measured?
- What target value defines acceptable performance or compliance?

Constraints:
- Requirements must be measurable and testable
- Avoid vague statements (e.g. "fast", "secure", "scalable" without metrics)
- Focus on system behavior, not implementation
- Include only attributes relevant to the product context
-->

{{nonFunctionalRequirements}}

---

## 14. Dependencies & Assumptions

### 14.1 Dependencies

<!--
INSTRUCTION:
Identify all dependencies that must be satisfied for the product to be delivered and operate successfully.

Answer explicitly:
- What technical dependencies exist? (systems, platforms, integrations)
- What operational dependencies exist? (processes, teams, resources)
- What legal or regulatory dependencies exist?
- What external dependencies exist? (vendors, partners, third parties)

Constraints:
- List only dependencies that materially impact delivery or operation
- Be explicit about what is depended on and why
- Avoid vague statements (e.g. "depends on alignment")
-->

{{dependencies}}

---

### 14.2 Assumptions

<!--
INSTRUCTION:
Document assumptions that underpin this PRD and could affect its validity if proven false.

Answer explicitly:
- What conditions are assumed to be true?
- What user, market, or technical behaviors are taken for granted?
- What would need to change if an assumption is invalidated?

Constraints:
- Assumptions must be testable or observable
- Avoid obvious or trivial assumptions
- Keep the list focused and relevant
-->

{{assumptions}}

---

## 15. Risk Management

<!--
INSTRUCTION:
Identify, assess, and document meaningful risks that could threaten the success of the product.

Answer explicitly for EACH risk:
- What is the risk?
- What is the likelihood of it occurring?
- What would be the impact if it occurs?
- What actions can mitigate or reduce this risk?

Constraints:
- Focus on real, product-specific risks (not generic ones)
- Include strategic, operational, technical, and adoption risks
- Be honest and concrete
- Avoid vague wording
-->

{{riskManagement}}

---

## 16. Delivery Plan & Cost

<!--
INSTRUCTION:
Outline how the product will be delivered and what level of effort and cost is expected.

Answer explicitly:
- What are the major delivery phases?
- What is included in each phase?
- What roles or team composition are required?
- What is the expected timeline at a high level?
- What cost range is anticipated and why?

Constraints:
- High-level planning only (not a detailed project plan)
- Use realistic estimates, not optimistic assumptions
- Focus on phases and milestones, not tasks
- Costs may be indicative ranges, not exact numbers
-->

{{deliveryPlan}}

---

## 17. Launch & Rollout Plan

<!--
INSTRUCTION:
Describe how the product will be introduced to users and how adoption and success will be managed post-launch.

Answer explicitly:
- How will the product be released? (phased, pilot, full launch)
- Who is included in each rollout phase?
- What onboarding or enablement is required?
- How will users be supported after launch?
- What signals indicate a successful or problematic launch?

Constraints:
- Focus on rollout strategy, not marketing campaigns
- Align rollout phases with risk and readiness
- Avoid operational minutiae
-->

{{launchPlan}}

---

### 18. Open Questions & Decisions Log

<!--
INSTRUCTION:
Track unresolved questions and pending or recently made decisions that impact the product.

Answer explicitly:
- What question or decision is outstanding?
- Why does it matter for the product?
- Who owns resolving it?
- By when does it need to be resolved?
- What is the current status?

Constraints:
- Only include items that materially affect scope, timeline, or success
- Keep the list current and actively maintained
- Avoid historical decisions that are already fully resolved
-->

{{openQuestions}}

---

## 19. Change Log

{{changeLog}}

---

## 20. Appendix (AI-Friendly)

{{appendix}}

