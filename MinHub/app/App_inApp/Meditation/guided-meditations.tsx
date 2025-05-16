import { Link } from 'expo-router';
import React from 'react';
import { FlatList, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MEDITATIONS_DATA, Meditation } from '../../data/meditations';

export default function GuidedMeditationsScreen() {
  const renderMeditationItem = ({ item }: { item: Meditation }) => (
    <Link href={`/meditation-player/${item.id}`} asChild>
      <TouchableOpacity style={styles.itemContainer}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.itemFooter}>
          <Text style={styles.itemDuration}>{item.durationMinutes} min</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
     <ImageBackground
        source={require('../../assets/images/background_forest.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <FlatList
            data={MEDITATIONS_DATA}
            renderItem={renderMeditationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContentContainer}
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E0F2F7',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    paddingTop: 10,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004D40',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: '#00695C',
    marginBottom: 12,
    lineHeight: 20,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDuration: {
    fontSize: 13,
    color: '#004D40',
    fontWeight: '500',
  },
  itemCategory: {
    fontSize: 13,
    color: '#FFFFFF',
    backgroundColor: '#00796B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
});