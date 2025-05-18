/*import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PRESET_PRODUCTIVE_REMINDERS, ProductiveReminderTemplate, getVerboseTemplateDetails } from '../data/templates';

export default function SelectProductiveTemplateScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'category'>('category'); 
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null); 

  const handleTemplateSelection = (template: ProductiveReminderTemplate) => {
    setLastSelectedId(template.id); 

    if (router.canGoBack()) {
        router.replace({ pathname: '/App_inApp/Reminders/reminders', params: { selectedTemplateId: template.id, sourceScreen: 'selectproductive' } });
    } else {
        router.push({ pathname: '/App_inApp/Reminders/reminders', params: { selectedTemplateId: template.id, sourceScreen: 'selectproductive' } });
    }
  };
  
  const filteredTemplates = useMemo(() => {
    let templatesToFilter = [...PRESET_PRODUCTIVE_REMINDERS];
    if (searchTerm.trim() !== '') {
      templatesToFilter = templatesToFilter.filter(template =>
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.keywords.some((keyword: string) => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (sortOrder === 'asc') {
        templatesToFilter.sort((a,b) => a.title.localeCompare(b.title));
    } else if (sortOrder === 'desc') {
        templatesToFilter.sort((a,b) => b.title.localeCompare(a.title));
    } else if (sortOrder === 'category') {
        templatesToFilter.sort((a,b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
    }
    return templatesToFilter;
  }, [searchTerm, sortOrder]);


  const renderTemplateListItem = ({ item }: { item: ProductiveReminderTemplate }) => (
    <TouchableOpacity style={styles.templateItem} onPress={() => handleTemplateSelection(item)}>
      <View style={styles.templateItemHeader}>
        <Text style={styles.templateItemTitle}>{item.title}</Text>
        <Text style={styles.templateItemCategory}>{item.category}</Text>
      </View>
      <Text style={styles.templateItemDescription}>{item.description}</Text>
      <Text style={styles.templateItemVerboseDetails} numberOfLines={2}>{getVerboseTemplateDetails(item)}</Text>
    </TouchableOpacity>
  );
  
  const UselessButtonComponent = ({label}: {label:string}) => {
    return (
        <View style={styles.uselessButtonContainer}>
            <TouchableOpacity onPress={() => Alert.alert("Useless Action", `Button "${label}" pressed.`)}>
                <Text style={styles.uselessButtonText}>{label}</Text>
            </TouchableOpacity>
        </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Choose a Productive Preset' }} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search templates (e.g., focus, planning)..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <View style={styles.uselessButtonRow}>
        <UselessButtonComponent label="Sort A-Z" />
        <UselessButtonComponent label="Sort by Category" />
      </View>
      <FlatList
        data={filteredTemplates}
        renderItem={renderTemplateListItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={<Text style={styles.emptyListInfo}>No matching templates found.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F6',
  },
  searchInput: {
    height: 45,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    margin: 15,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  templateItem: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#B0B0B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    borderLeftWidth: 5,
    borderColor: '#6366F1', 
  },
  templateItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateItemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937', 
    flexShrink: 1,
  },
  templateItemCategory: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4338CA', 
    backgroundColor: '#E0E7FF', 
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  templateItemDescription: {
    fontSize: 14,
    color: '#4B5563', 
    marginBottom: 10,
    lineHeight: 20,
  },
   templateItemVerboseDetails: { 
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyListInfo: { 
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#6B7280',
  },
  uselessButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  uselessButtonContainer: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  uselessButtonText: {
    color: '#374151',
    fontSize: 13,
  },
});*/