# Prompt Comparison

| Evaluation criteria | Initial prompt | Optimized prompt |
|---|---|---|
| Application context | Generic application | Specifies Ledgerly's architecture |
| Log analysis | General explanation | Requires dependency and sequence analysis |
| Root causes | Unranked possibilities | Ranked hypotheses with evidence |
| Symptoms vs causes | Basic distinction | Explicit classification |
| Troubleshooting | General steps | Ordered investigation with expected outcomes |
| Linux commands | Basic suggestions | Docker and infrastructure diagnostics |
| SQL queries | Basic connection queries | Connection, query and blocking diagnostics |
| Production safety | Not explicitly addressed | Read-only first and approval for risky actions |
| Missing information | General list | Prioritized information requirements |
| Recovery validation | Not clearly defined | Measurable recovery checklist |
| Output format | Broad response | Twelve structured sections |

## Why the optimized prompt is better

1. **More context:** It tells the AI about the actual application stack, reducing irrelevant assumptions.
2. **Evidence-driven analysis:** It requires the AI to distinguish observed facts from hypotheses.
3. **Better prioritization:** It ranks possible root causes and explains what evidence would confirm them.
4. **Actionable troubleshooting:** Each investigation step includes commands, purpose and expected interpretation.
5. **Production safety:** It discourages destructive actions and requires approval for risky remediation.
6. **Clear validation:** It defines how to determine whether service has recovered.
7. **Structured output:** It produces a consistent investigation report that can be reviewed and shared.

## Conclusion

The optimized prompt is more effective because it turns a broad troubleshooting request into a structured, evidence-based production investigation. It reduces unsupported conclusions, improves technical relevance and makes the AI's recommendations safer to apply.
