# Design QA — 深圳高薪岗位观察

## Visual target

- Reference: `C:/Users/27134/AppData/Local/Temp/codex-clipboard-9f20413c-a7cf-4e5c-8360-c6aa52ebfca3.png`
- Implementation: responsive React/Vite build at `/index.html`

## Final review

| Check | Result | Notes |
| --- | --- | --- |
| Information density | Pass | First viewport contains one question, one supporting sentence, three salary summaries and micro-annotations only. |
| Visual hierarchy | Pass | Headline → explanation → salary summaries is unambiguous. |
| Navigation | Pass | Reduced to 高薪机会 / 成长路径 / 真实岗位. |
| Terminology | Pass | Technical terms are confined to small annotations. |
| Responsive layout | Pass | Desktop uses three columns; mobile uses single-column salary and job cards with a compact menu. |
| Accessibility baseline | Pass | Semantic controls, visible text labels, reduced-motion handling and AA-level primary text contrast. |
| Runtime | Pass | Production build completes; production browser console has no errors. |

## Intentional differences

- “赚钱路径” is renamed to “成长路径”.
- Representative roles are expressed as role families, avoiding the false precision of implying that one title always maps to one salary.
- Detailed evidence is moved below the fold or into the job database instead of competing with the homepage headline.

## Result

PASSED — no open P0, P1 or P2 visual issues.
