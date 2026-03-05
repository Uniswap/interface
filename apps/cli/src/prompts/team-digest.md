You will analyze repository commit data to create a team digest for engineers at Uniswap Labs. Your goal is to transform raw development activity into a readable summary that explains what the team accomplished during a specific time period.

## Your Task

Create a structured team digest that describes what was built, added, or modified based on the commit data. Write factually about the work completed without making assumptions about completion status or quality.

## Critical Requirements

Follow these requirements strictly:

1. **Use GitHub usernames only** - Format as @username, never use or invent human names
2. **Describe changes factually** - State what was built/added/modified without making quality judgments  
3. **Avoid completion language** - Do not use "complete," "finished," "fully implemented," or "comprehensive" since you cannot determine completion status from commit messages alone
4. **Avoid embellished language** - Do not use "significantly improved," "enhanced," or "optimized" unless these are objectively measurable facts explicitly stated in the commit messages
5. **Right-size technical detail** - Include key components and patterns, skip implementation minutiae
6. **Focus on outcomes first** - Lead with what changed for users/developers, then explain how
7. **Minimize code content** - Be very selective about including code snippets or technical implementation details. Focus on impact and readability. Only include essential code-related information when truly necessary for understanding the work's significance
8. **Improve readability** - Limit to 4-6 themes maximum to avoid monotony. Vary your sentence structure and integrate contributor mentions naturally rather than starting every paragraph with "@person did xyz"

## Analysis Process

Before writing your digest, complete a thorough analysis inside <analysis> tags within your thinking block. It's OK for this section to be quite long. Include:

1. **Extract All Commit Messages**: Quote every single commit message verbatim from the data, one by one
2. **Extract Contributors**: Systematically go through the data and list all GitHub usernames (format as @username), counting them as you go
3. **Group into 4-6 Themes**: Organize commits into coherent themes based on functionality or area of work. For each theme:
   - Theme name
   - Specific commits that belong (quote relevant messages verbatim)
   - Contributors who worked on it
4. **Plan Technical Details**: For each theme, identify:
   - Main outcome or change (focus on impact, not implementation)
   - 1-2 key technical details worth mentioning only if they help explain impact
   - Avoid code snippets unless absolutely essential
5. **Structure Planning**: Write your planned theme names and brief descriptions
6. **Readability Check**: Review your planned descriptions to ensure you:
   - Have 4-6 themes maximum for better flow
   - Vary sentence structure (don't start every paragraph with contributor names)
   - Integrate contributor mentions naturally throughout the narrative
   - State facts from commits without making quality assessments
   - Avoid completion language
   - Focus on outcomes over technical implementation
7. **Requirements Verification**: Systematically check each planned theme description against all 8 critical requirements listed above, going through them one by one to ensure compliance

## Output Structure

Write your digest following this exact structure:

### Team Digest: [Date Range]

[Opening paragraph: Main areas of work. Be specific but concise - 2-3 sentences maximum.]

### What Was Shipped

For each theme (4-6 total):

#### [Clear Theme Name]

[2-3 paragraphs explaining:
- Paragraph 1: What was built and why it matters (outcome and impact)
- Paragraph 2: Key approach - mention important components only when relevant for understanding impact  
- Paragraph 3 (if needed): Integration points or collaboration details

Mention contributors naturally throughout, varying sentence structure]

### Technical Highlights

[3-5 bullet points of technically interesting work that other engineers would want to know about. Focus on reusable patterns, architectural decisions, or important changes. Only include items that add significant value and aren't duplicative of what was stated above.]

## Example Output Structure

### Team Digest: March 1-15, 2024

The team focused on expanding notification capabilities, refactoring data layer components, and improving test infrastructure.

### What Was Shipped

#### Notification System Development

A new notification system now polls the backend and manages dismissal state locally, allowing users to receive timely updates about important events. The system provides options for different notification types and integrates with existing user preferences through the settings panel.

Working primarily on the core functionality, @alice built the polling mechanism and state management, while @bob handled the integration work that allows users to configure which notifications they receive and how they're delivered.

#### Data Layer Refactoring

The data access layer underwent restructuring with multiple API clients consolidated into a unified service. This change provides more consistent error handling and simplifies how the application manages data across different features.

@charlie led this refactoring effort, which resulted in a unified error handling pattern that reduces code duplication across components.

### Technical Highlights

• New notification provider can be easily integrated into other applications
• Unified error handling pattern reduces code duplication across components
• Test suite now runs 40% faster due to infrastructure improvements
• New data fetching approach simplifies component logic and improves testability

Your final output should consist only of the structured team digest following the format above, without duplicating or rehashing any of the analysis work you completed in your thinking block.

Here is the commit data you need to analyze:

<commit_data>
{{COMMIT_DATA}}
</commit_data>
