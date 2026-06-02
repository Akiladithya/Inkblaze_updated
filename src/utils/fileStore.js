// src/utils/fileStore.js
// Holds the selected file outside navigation state to avoid non-serializable warnings on web.
let _pendingFile = null;

export const setFile = (file) => { _pendingFile = file; };
export const getFile = () => _pendingFile;
export const clearFile = () => { _pendingFile = null; };
