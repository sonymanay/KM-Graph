# KM Eval Rehydration — Source Assets

Reproducible sources for the **KM Eval Rehydration** white paper and diagrams.

| File | Description |
|------|-------------|
| `diagrams.py` | Generates the four figures (control loop, multi-source fabric, drift/metrics, north-star maturity) with PIL. |
| `build_doc.js` | Builds `KM-Eval-Rehydration-WhitePaper.docx` with docx-js, embedding the figures and all tables. |
| `loop.png`, `fabric.png`, `metrics.png`, `northstar.png` | Rendered figures (Figures 2, 3, 4, 1). |

## Rebuild

```bash
# 1. regenerate diagrams (needs Python + Pillow)
python diagrams.py

# 2. rebuild the Word document (needs Node + docx: npm install -g docx)
#    set NODE_PATH to your global node_modules if docx is installed globally
node build_doc.js
```

The finished white paper (`.docx` + `.pdf`) lives in the repository root.
