// src/components/PDFViewer.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { getPdfUrl } from '../services/api';
import { colors, typography, spacing, radius, shadows } from '../styles/theme';

// WebView is only imported on native; web uses iframe
let WebView = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    // WebView not available
  }
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PDFViewer = ({ outputPdfPath, visible, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!visible || !outputPdfPath) return null;

  const pdfUrl = getPdfUrl(outputPdfPath);

  const handleLoad = () => setLoading(false);
  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Highlighted PDF</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {outputPdfPath?.split('/').pop()}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* PDF Content */}
        <View style={styles.pdfContainer}>
          {loading && !error && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading PDF…</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorState}>
              <Text style={styles.errorEmoji}>⚠️</Text>
              <Text style={styles.errorTitle}>Could not load PDF</Text>
              <Text style={styles.errorBody}>
                Try downloading the file and opening it locally.
              </Text>
            </View>
          )}

          {!error && Platform.OS === 'web' ? (
            // Web: use iframe with PDF.js compatibility
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 0,
              }}
              onLoad={handleLoad}
              onError={handleError}
              title="PDF Viewer"
            />
          ) : !error && WebView ? (
            // Native: use WebView to embed PDF
            <WebView
              source={{
                uri: Platform.OS === 'ios'
                  ? pdfUrl  // iOS Safari can render PDFs natively
                  : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`,
              }}
              style={styles.webview}
              onLoad={handleLoad}
              onError={handleError}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            />
          ) : !error ? (
            <View style={styles.fallback}>
              <Text style={styles.fallbackEmoji}>📄</Text>
              <Text style={styles.fallbackTitle}>PDF Viewer unavailable</Text>
              <Text style={styles.fallbackBody}>
                WebView not installed. Please download the PDF to view it.
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 18, 38, 0.75)',
    zIndex: 999,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    height: SCREEN_HEIGHT * 0.92,
    overflow: 'hidden',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginTop: 2,
    maxWidth: 220,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: typography.bold,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    zIndex: 1,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    color: colors.textMuted,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: typography.sm * typography.relaxed,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  fallbackEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  fallbackTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  fallbackBody: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: typography.sm * typography.relaxed,
  },
});

export default PDFViewer;
