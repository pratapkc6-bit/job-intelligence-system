# Architecture

## V1

```text
Job data (sample/manual first)
          |
          v
   Python analysis
          |
          +----> Skill demand summary
          |
          v
 Next.js dashboard
```

## Target architecture

```text
Approved job sources
        |
        v
Python collection / normalisation
        |
        v
Neon PostgreSQL <---- skill extraction / matching
        |
        v
Next.js dashboard on Vercel
        |
        +----> APPLY
        +----> LEARN
        +----> BUILD
```

## Design principles

1. Store source URLs and dates so every job can be traced back to evidence.
2. Keep collection separate from analysis so a source can be replaced without rewriting the intelligence layer.
3. Never invent job requirements; extracted skills must trace back to the source description.
4. Use the Darwin/NT market as the priority signal, not generic global technology trends.
5. Start with transparent rules, then add AI only where it improves extraction or classification.
