// src/hooks/useMCQ.js
//
// Standalone hook for the /generate-mcqs endpoint.
// Usage:
//   const { generate, state } = useMCQ();
//   await generate(file, 5);

import { useReducer, useCallback } from 'react';
import { generateMCQs } from '../services/api';

const INITIAL = {
  status: 'idle',   // 'idle' | 'loading' | 'done' | 'error'
  mcqs: null,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'START':
      return { ...INITIAL, status: 'loading' };
    case 'DONE':
      return { status: 'done', mcqs: action.payload, error: null };
    case 'ERROR':
      return { status: 'error', mcqs: null, error: action.payload };
    case 'RESET':
      return INITIAL;
    default:
      return state;
  }
}

export function useMCQ() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const generate = useCallback(async (file, numQuestions = 5) => {
    dispatch({ type: 'START' });
    try {
      const result = await generateMCQs(file, numQuestions);
      if (!result?.mcqs) throw new Error('No MCQs returned from server.');
      dispatch({ type: 'DONE', payload: result.mcqs });
      return result.mcqs;
    } catch (err) {
      const message = err?.message || 'MCQ generation failed.';
      dispatch({ type: 'ERROR', payload: message });
      throw new Error(message);
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { generate, state, reset };
}

export default useMCQ;
