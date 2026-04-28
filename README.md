# Sprite Cutter

Local-first static app for rebuilding the core `spriter.app` workflow:

- Upload a sprite sheet
- Auto-detect foreground components as frame boxes
- Adjust boxes manually in a canvas editor
- Preview the animation in fixed-size cells
- Export a normalized sprite sheet PNG
- Export box metadata as JSON

## Run locally

From the repo root:

```bash
python3 -m http.server 8126
```

Then open:

`http://127.0.0.1:8126`

## Included sample

The `Load Sample` button uses the bundled file:

`sample-wizard-sheet.png`

## Notes

- The app is pure client-side JavaScript. No backend is required.
- The repo intentionally includes only one sample sprite sheet.
- The current detector is based on connected foreground regions against the corner background color.
- This is an MVP, so the editor focuses on the useful basics rather than trying to clone every control from the reference UI.
