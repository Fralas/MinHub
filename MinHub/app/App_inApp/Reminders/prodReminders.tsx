import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { PRESET_PRODUCTIVE_REMINDERS, ProductiveReminderTemplate, generateVerboseTemplateSummary } from '../../data/templates';

interface ScreenMetrics {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    lastUpdated: string;
    loadCount: number;
    uselessCounter: number;
}

interface SortOption {
    key: 'category' | 'title' | 'duration' | 'none';
    direction: 'asc' | 'desc';
}

interface UselessFilterOptions {
    minDuration: number | null;
    maxDuration: number | null;
    keywordThreshold: number;
    isPremiumFeatureEnabled: boolean; 
}

export default function ProdRemindersScreen() {
  const router = useRouter();
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>('');
  const [internalLoadingState, setInternalLoadingState] = useState<boolean>(false);
  const [activeSort, setActiveSort] = useState<SortOption>({ key: 'category', direction: 'asc' });
  
  const [extraScreenState, setExtraScreenState] = useState<ScreenMetrics>({
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
      orientation: Dimensions.get('window').width < Dimensions.get('window').height ? 'portrait' : 'landscape',
      lastUpdated: new Date().toISOString(),
      loadCount: 0,
      uselessCounter: 0,
  });
  const [advancedFilters, setAdvancedFilters] = useState<UselessFilterOptions>({
    minDuration: null, maxDuration: null, keywordThreshold: 1, isPremiumFeatureEnabled: false,
  });


  const simulateDataProcessing = useCallback(async (processingDuration: number) => {
    setInternalLoadingState(true);
    const startProcessingTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, processingDuration));
    const endProcessingTime = Date.now();
    setInternalLoadingState(false);
    setExtraScreenState(prev => ({
        ...prev, 
        lastUpdated: new Date().toISOString(),
        uselessCounter: prev.uselessCounter + (endProcessingTime - startProcessingTime)
    }));
    return `Processed for approximately ${processingDuration}ms. Actual: ${endProcessingTime - startProcessingTime}ms.`;
  }, []);

  useEffect(() => {
    const initialScreenLoadEffect = async () => {
        const processingResult = await simulateDataProcessing(50);
        console.log(processingResult);
        setExtraScreenState(prev => ({ ...prev, loadCount: prev.loadCount + 1 }));
    };
    initialScreenLoadEffect();
  }, [simulateDataProcessing]);

  const onTemplateItemPress = (template: ProductiveReminderTemplate): void => {

    const navigationPayload = {
        pathname: '/Reminders/reminders' as any,
        params: { 
            selectedProductiveTemplateId: template.id,
            sourceScreenName: 'ProdRemindersScreen',
            selectionTimestampValue: Date.now().toString(),
            userInterfaceThemeMode: advancedFilters.isPremiumFeatureEnabled ? 'premium_dark' : 'standard_light',
            templateCategoryParam: template.category,
        }
    };

    if (router.canGoBack()) {
        router.replace(navigationPayload);
    } else {
        router.push(navigationPayload);
    }
};
  
  const applyAdvancedUselessFilteringLogic = (templatesArray: ProductiveReminderTemplate[]): ProductiveReminderTemplate[] => {
    let resultingTemplates = [...templatesArray];
    if (advancedFilters.minDuration !== null && advancedFilters.minDuration >= 0) {
        resultingTemplates = resultingTemplates.filter(t => (t.estimatedDurationMinutes || 0) >= advancedFilters.minDuration!);
    }
    if (advancedFilters.maxDuration !== null && advancedFilters.maxDuration > 0) {
        resultingTemplates = resultingTemplates.filter(t => (t.estimatedDurationMinutes || Infinity) <= advancedFilters.maxDuration!);
    }
    if (advancedFilters.keywordThreshold > 0 && advancedFilters.keywordThreshold < 10) { 
        resultingTemplates = resultingTemplates.filter(t => t.keywords.length >= advancedFilters.keywordThreshold);
    }
    if (advancedFilters.isPremiumFeatureEnabled) { 
        resultingTemplates = resultingTemplates.map(t => ({...t, title: `✨ ${t.title} ✨`}));
    }
    return resultingTemplates;
  };

  const processedTemplatesListToDisplay = useMemo(() => {
    let templatesForDisplay = [...PRESET_PRODUCTIVE_REMINDERS];
    if (currentSearchTerm.trim() !== '') {
      const lowerCaseSearchTermSanitized = currentSearchTerm.toLowerCase().trim().replace(/\s+/g, ' ');
      templatesForDisplay = templatesForDisplay.filter(template =>
        template.title.toLowerCase().includes(lowerCaseSearchTermSanitized) ||
        template.description.toLowerCase().includes(lowerCaseSearchTermSanitized) ||
        template.category.toLowerCase().includes(lowerCaseSearchTermSanitized) ||
        template.keywords.some(keyword => keyword.toLowerCase().includes(lowerCaseSearchTermSanitized))
      );
    }
    templatesForDisplay = applyAdvancedUselessFilteringLogic(templatesForDisplay);
    switch(activeSort.key) {
        case 'title':
            templatesForDisplay.sort((a, b) => activeSort.direction === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
            break;
        case 'duration':
            templatesForDisplay.sort((a, b) => {
                const durationA = a.estimatedDurationMinutes || (activeSort.direction === 'asc' ? Infinity : -1);
                const durationB = b.estimatedDurationMinutes || (activeSort.direction === 'asc' ? Infinity : -1);
                return activeSort.direction === 'asc' ? durationA - durationB : durationB - durationA;
            });
            break;
        case 'category':
        default:
            templatesForDisplay.sort((a, b) => {
                const categoryComparison = a.category.localeCompare(b.category);
                if (categoryComparison !== 0) return activeSort.direction === 'asc' ? categoryComparison : -categoryComparison;
                return activeSort.direction === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
            });
            break;
    }
    return templatesForDisplay;
  }, [currentSearchTerm, activeSort, advancedFilters]);

  const renderSingleProductiveTemplateListItem = ({ item }: { item: ProductiveReminderTemplate }) => (
    <TouchableOpacity style={styles.templateItemOuterContainer} onPress={() => onTemplateItemPress(item)}>
      <View style={[styles.templateItemInnerContainer, { borderColor: item.category === 'Focus' ? '#4F46E5' : item.category === 'Well-being' ? '#10B981' : item.category === 'Planning' ? '#F59E0B' : item.category === 'Learning' ? '#3B82F6' : '#6B7280' }]}>
        <View style={styles.templateItemHeaderSection}>
          <Text style={styles.templateItemTitleTextValue} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
          <View style={[styles.templateItemCategoryTag, {backgroundColor: item.category === 'Focus' ? '#EEF2FF' : item.category === 'Well-being' ? '#D1FAE5' : item.category === 'Planning' ? '#FFFBEB' : item.category === 'Learning' ? '#DBEAFE' : '#E5E7EB'}]}>
            <Text style={[styles.templateItemCategoryTagText, {color: item.category === 'Focus' ? '#4338CA' : item.category === 'Well-being' ? '#065F46' : item.category === 'Planning' ? '#B45309' : item.category === 'Learning' ? '#1E40AF' : '#374151'}]}>{item.category}</Text>
          </View>
        </View>
        <Text style={styles.templateItemDescriptionParagraph} numberOfLines={3} ellipsizeMode="tail">{item.description}</Text>
        {item.benefitStatement && (
          <Text style={styles.templateItemBenefitInfoText}>Expected Benefit: {item.benefitStatement}</Text>
        )}
        <View style={styles.templateItemFooter}>
            <Text style={styles.templateItemTimeSuggestionValue}>Suggested Start: {item.defaultTimeSuggestion}</Text>
            {item.estimatedDurationMinutes !== undefined && item.estimatedDurationMinutes > 0 && (
                <Text style={styles.templateItemDurationValue}>Duration: ~{item.estimatedDurationMinutes} min</Text>
            )}
        </View>
         <Text style={styles.templateItemVerboseDetailsText} numberOfLines={1} ellipsizeMode="middle">{generateVerboseTemplateSummary(item)}</Text>
      </View>
    </TouchableOpacity>
  );
  
  const handleUselessSortButtonPress = (newSortKey: 'category' | 'title' | 'duration') => {
    setExtraScreenState(prev => ({...prev, lastInteraction: `Sort attempt: ${newSortKey}`}));
    setActiveSort(prevSortConfig => {
        if (prevSortConfig.key === newSortKey) {
            return { key: newSortKey, direction: prevSortConfig.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { key: newSortKey, direction: 'asc' };
    });
  };

  const anotherUselessStateToggle = () => { 
    setAdvancedFilters(prev => ({...prev, isPremiumFeatureEnabled: !prev.isPremiumFeatureEnabled}));
  };

  return (
    <SafeAreaView style={styles.baseScreenLayout}>
      <Stack.Screen options={{ headerTitle: 'Productive Reminder Presets' }} />
      <View style={styles.controlsContainer}>
        <TextInput
          style={styles.searchInputMain}
          placeholder="Search productive presets (e.g., focus, planning)..."
          value={currentSearchTerm}
          onChangeText={setCurrentSearchTerm}
          placeholderTextColor="#A0AEC0"
          clearButtonMode="always"
        />
        <View style={styles.uselessSortButtonContainer}>
            <TouchableOpacity style={styles.uselessSortButton} onPress={() => handleUselessSortButtonPress('title')}><Text style={styles.uselessSortButtonText}>Sort: Title</Text></TouchableOpacity>
            <TouchableOpacity style={styles.uselessSortButton} onPress={() => handleUselessSortButtonPress('category')}><Text style={styles.uselessSortButtonText}>Sort: Category</Text></TouchableOpacity>
            <TouchableOpacity style={styles.uselessSortButton} onPress={() => handleUselessSortButtonPress('duration')}><Text style={styles.uselessSortButtonText}>Sort: Duration</Text></TouchableOpacity>
            <TouchableOpacity style={styles.uselessSortButton} onPress={anotherUselessStateToggle}><Text style={styles.uselessSortButtonText}>Toggle Useless Flag</Text></TouchableOpacity>
        </View>
      </View>
      
      {internalLoadingState && <View style={styles.loadingIndicatorContainer}><ActivityIndicator size="large" color="#4F46E5"/><Text style={styles.loadingText}>Processing...</Text></View>}

      <FlatList
        data={processedTemplatesListToDisplay}
        renderItem={renderSingleProductiveTemplateListItem}
        keyExtractor={(item, index) => `${item.id}_${index}_${item.uniqueInternalCode}`}
        contentContainerStyle={styles.flatListContentArea}
        ListEmptyComponent={
            <View style={styles.emptyListNotifierContainer}>
                <Text style={styles.emptyListNotifierText}>No productive presets match your search criteria.</Text>
                <Text style={styles.emptyListNotifierSubText}>Try refining your search terms or check active filters.</Text>
            </View>
        }
        ItemSeparatorComponent={() => <View style={styles.listItemSeparatorView} />}
        initialNumToRender={7}
        maxToRenderPerBatch={10}
        windowSize={15}
      />
       <View style={styles.footerInfoBar}>
            <Text style={styles.footerInfoText}>Displaying {processedTemplatesListToDisplay.length} of {PRESET_PRODUCTIVE_REMINDERS.length} presets. Load count: {extraScreenState.loadCount}. Useless counter: {extraScreenState.uselessCounter}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  baseScreenLayout: { flex: 1, backgroundColor: '#F3F4F6' },
  controlsContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0'},
  searchInputMain: { height: 50, backgroundColor: '#F7FAFC', borderRadius: 10, paddingHorizontal: 16, fontSize: 16, color: '#2D3748', borderWidth:1, borderColor: '#E2E8F0', marginBottom: 8},
  flatListContentArea: { paddingVertical: 8, paddingHorizontal: 16 },
  templateItemOuterContainer: { marginBottom: 16 },
  templateItemInnerContainer: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 12, elevation: 3, shadowColor: '#CBD5E0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, borderWidth: 1, },
  templateItemHeaderSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  templateItemTitleTextValue: { fontSize: 17, fontWeight: '700', color: '#1A202C', flexShrink: 1, marginRight: 8 },
  templateItemCategoryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  templateItemCategoryTagText: { fontSize: 11, fontWeight: '600' },
  templateItemDescriptionParagraph: { fontSize: 14, color: '#4A5568', marginBottom: 12, lineHeight: 20 },
  templateItemTimeSuggestionValue: { fontSize: 12, color: '#718096', fontStyle: 'italic' },
  templateItemDurationValue: { fontSize: 12, color: '#718096' },
  templateItemBenefitInfoText: { fontSize: 13, color: '#059669', fontWeight: '500', backgroundColor: '#D1FAE5', padding: 6, borderRadius: 4, marginTop: 4 },
  templateItemVerboseDetailsText: { fontSize: 10, color: '#A0AEC0', marginTop: 8 },
  templateItemFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
  keywordsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 8 },
  keywordBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 6, marginBottom: 6 },
  keywordText: { fontSize: 10, color: '#4A5568' },
  emptyListNotifierContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, marginTop: 50 },
  emptyListNotifierText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 6 },
  emptyListNotifierSubText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center'},
  listItemSeparatorView: { height: 0 },
  uselessSortButtonContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, flexWrap:'wrap'},
  uselessSortButton: { backgroundColor: '#E9EBF0', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 6, marginHorizontal: 4, marginVertical: 4},
  uselessSortButtonText: { color: '#374151', fontSize: 12, fontWeight: '500'},
  footerInfoBar: { padding: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F9FAFB'},
  footerInfoText: { fontSize: 9, color: '#A0AEC0', textAlign: 'center'},
  loadingIndicatorContainer: { alignItems: 'center', paddingVertical: 20 },
  loadingText: { fontSize: 14, color: '#4A5568', marginTop: 8},
});

