import { basicSetup, EditorView } from "codemirror";
import { json } from "@codemirror/lang-json";

function createJsonEditor({ parent, value = "", onChange }) {
  const view = new EditorView({
    doc: value,
    parent,
    extensions: [
      basicSetup,
      json(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChange?.(view.state.doc.toString());
      }),
      EditorView.theme({
        "&": {
          minHeight: "46vh",
          fontSize: "0.9rem",
          backgroundColor: "var(--panel-2)",
          color: "var(--ink)",
        },
        ".cm-scroller": {
          minHeight: "46vh",
          fontFamily: "inherit",
          lineHeight: "1.45",
        },
        ".cm-content": {
          padding: "9px 12px",
          caretColor: "var(--ink)",
        },
        ".cm-gutters": {
          backgroundColor: "var(--panel-2)",
          color: "var(--muted)",
          borderRight: "2px solid var(--line)",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "rgba(109, 143, 179, 0.16)",
        },
        ".cm-activeLine": {
          backgroundColor: "rgba(109, 143, 179, 0.12)",
        },
        ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
          backgroundColor: "rgba(109, 143, 179, 0.32)",
        },
        "&.cm-focused": {
          outline: "2px solid var(--line-strong)",
          outlineOffset: "-2px",
        },
      }),
    ],
  });

  return {
    getValue() {
      return view.state.doc.toString();
    },
    setValue(nextValue) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: nextValue },
      });
    },
    focus() {
      view.focus();
    },
  };
}

window.SpriteSliceJsonEditor = { createJsonEditor };
