// src/hooks/useHighlighter.js
//
// Encapsulates the full file-processing flow so screens stay lean.
// Usage:
//   const { process, state, reset } = useHighlighter();
//   await process(file);

import { useReducer, useCallback } from 'react';
import { highlightText } from '../services/api';

const INITIAL = {
  status: 'idle',        // 'idle' | 'uploading' | 'processing' | 'done' | 'error'
  uploadProgress: 0,
  highlightedText: null,
  outputPdfPath: null,
  sentenceCount: null,
  totalSentences: null,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'START':
      return { ...INITIAL, status: 'uploading' };
    case 'UPLOAD_PROGRESS':
      return {
        ...state,
        uploadProgress: action.payload,
        status: action.payload >= 100 ? 'processing' : 'uploading',
      };
    case 'DONE':
      return {
        ...state,
        status: 'done',
        highlightedText: action.payload.highlighted_text,
        outputPdfPath: action.payload.output_pdf_path,
        sentenceCount: action.payload.sentence_count ?? null,
        totalSentences: action.payload.total_sentences ?? null,
        error: null,
      };
    case 'ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'RESET':
      return INITIAL;
    default:
      return state;
  }
}

export function useHighlighter() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const process = useCallback(async (file) => {
    dispatch({ type: 'START' });
    try {
      const result = await highlightText(file, (pct) => {
        dispatch({ type: 'UPLOAD_PROGRESS', payload: pct });
      });

      if (!result?.highlighted_text || !result?.output_pdf_path) {
        throw new Error('Server returned an incomplete response.');
      }

      dispatch({ type: 'DONE', payload: result });
      return result;
    } catch (err) {
      const message = err?.message || 'Processing failed. Please try again.';
      dispatch({ type: 'ERROR', payload: message });
      throw new Error(message);
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { process, state, reset };
}

export default useHighlighter;
