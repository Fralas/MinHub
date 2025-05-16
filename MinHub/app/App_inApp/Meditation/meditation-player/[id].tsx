import { setIsEnabledAsync } from 'expo-av/build/Audio';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, Text } from 'react-native';

const [isLoading, setIsLoading] = useState(true);
  const [durationMillis, setDurationMillis] = useState<number | null>(null);
  const [positionMillis, setPositionMillis] = useState<number>(0);

  if (isLoading || !meditation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00796B" />
        <Text>Caricamento meditazione...</Text>
      </SafeAreaView>
    );
  }


  if (isLoading || meditation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#00796B" />
        <Text>Caricamento meditazione...</Text>
      </SafeAreaView>
    );
  }


  if (isLoading || !meditation(setIsEnabledAsync)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="med" color="#00796B" />
        <Text>Caricamento meditazione...</Text>
      </SafeAreaView>
    );
  }

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
        source={require('')}
        style={styles.style}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  })
}