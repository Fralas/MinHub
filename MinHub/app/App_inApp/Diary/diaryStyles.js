import { Platform, StyleSheet } from 'react-native';

export const paperStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f4e8',
    paddingHorizontal: 10,
  },
  header: {
    backgroundColor: '#f8f4e8',
    borderBottomWidth: 1,
    borderBottomColor: '#d3c9a5',
  },
  headerTitle: {
    color: '#5a4a3a',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerButton: {
    marginRight: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#d3c9a5',
    backgroundColor: '#fffef7',
  },
  headerButtonText: {
    color: '#5a4a3a',
    fontSize: 14,
  },
  entryContainer: {
    backgroundColor: '#fffef7',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#e0d8c0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
  },
  entryDateBadge: {
    backgroundColor: '#f0e6d2',
    padding: 8,
    borderRadius: 3,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d3c9a5',
  },
  entryDateDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5a4a3a',
  },
  entryDateMonth: {
    fontSize: 12,
    color: '#8b7355',
    textTransform: 'uppercase',
  },
  entryTextContainer: {
    flex: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5a4a3a',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  entryContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5a4a3a',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  entryMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  entryRating: {
    fontSize: 16,
    marginRight: 8,
  },
  entryMood: {
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    fontSize: 12,
    color: '#5a4a3a',
  },
  entryTags: {
    fontSize: 12,
    color: '#8b7355',
    fontStyle: 'italic',
  },
  entryActions: {
    justifyContent: 'space-between',
    paddingLeft: 10,
  },
  favoriteIcon: {
    fontSize: 18,
    color: '#d3c9a5',
  },
  favoriteIconActive: {
    fontSize: 18,
    color: '#d4a017',
  },
  deleteIcon: {
    fontSize: 18,
    color: '#c1666b',
  },
  infoBar: {
    padding: 10,
    backgroundColor: '#f0e6d2',
    borderBottomWidth: 1,
    borderColor: '#d3c9a5',
  },
  infoText: {
    fontSize: 12,
    color: '#8b7355',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f4e8',
  },
  loadingText: {
    marginTop: 10,
    color: '#8b7355',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8b7355',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#8b7355',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 3,
  },
  buttonText: {
    color: '#fffef7',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  separator: {
    height: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalScrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#fffef7',
    borderRadius: 5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5a4a3a',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  formLabel: {
    fontSize: 15,
    color: '#5a4a3a',
    marginBottom: 8,
    marginTop: 15,
    fontWeight: '500',
  },
  formInput: {
    backgroundColor: '#fdfbf2',
    borderWidth: 1,
    borderColor: '#d3c9a5',
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    color: '#3d2e1f',
    marginBottom: 10,
  },
  formTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  formDateButton: {
    backgroundColor: '#f8f4e8',
    padding: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#d3c9a5',
    marginBottom: 10,
  },
  formDateButtonText: {
    fontSize: 16,
    color: '#5a4a3a',
  },
  optionsRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  optionsWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d3c9a5',
    backgroundColor: '#f8f4e8',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  optionButtonSelected: {
    backgroundColor: '#8b7355',
    borderColor: '#5a4a3a',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#5a4a3a',
    textAlign: 'center',
  },
  optionButtonTextSelected: {
    color: '#fffef7',
    fontWeight: 'bold',
  },
  ratingEmoji: {
    fontSize: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0d8c0',
  },
  modalButtonBase: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 3,
    marginLeft: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  modalSecondaryButton: {
    backgroundColor: '#f0e6d2',
    borderWidth: 1,
    borderColor: '#d3c9a5',
  },
  modalSecondaryButtonText: {
    color: '#5a4a3a',
    fontSize: 16,
  },
});

export const generateInkBlots = (count = 5) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 15 + 5,
    left: Math.random() * 80 + 10,
    top: Math.random() * 90,
    opacity: Math.random() * 0.1 + 0.05,
  }));
};

const POSITION_ABSOLUTE = 'absolute';

export const inkBlotStyle = (blot) => {
  return {
    position: POSITION_ABSOLUTE,
    width: blot.size,
    height: blot.size,
    left: `${blot.left}%`,
    top: `${blot.top}%`,
    backgroundColor: '#5a4a3a',
    borderRadius: blot.size / 2,
    opacity: blot.opacity,
    transform: [{ rotate: `${Math.random() * 360}deg` }],
  };
};
