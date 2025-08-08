// src/styles/typography.js
import { I18nManager } from 'react-native';

export const typography = {
  fontFamily: I18nManager.isRTL ? 'NotoNastaliqUrdu' : 'System',
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 36
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 24
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20
  }
};
