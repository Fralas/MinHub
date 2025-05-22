import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const TUTORIAL_COMPLETED_KEY = 'minhub_tutorial_completed';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const tutorialPagesData = [
  {
    id: '1',
    title: 'Benvenuto in MinHub!',
    description: 'La tua nuova app multifunzione per semplificare la vita quotidiana.',
    image: require('../assets/images/tutorialIMG/img1.png'),
  },
  {
    id: '2',
    title: 'Organizzazione Perfetta',
    description: 'Gestisci Todo List, Note, Diario e Calendario con facilità.',
    image: require('../assets/images/tutorialIMG/img2.png'),
  },
  {
    id: '3',
    title: 'Benessere e Produttività',
    description: 'Rilassati con Meditazione, traccia il Sonno e concentrati con Pomodoro.',
    image: require('../assets/images/tutorialIMG/img3.png'),
  },
  {
    id: '4',
    title: 'Strumenti Utili',
    description: 'Dal Period Tracker alla Calcolatrice, passando per Liste della Spesa.',
    image: require('../assets/images/tutorialIMG/img4.png'),
  },
  {
    id: '5',
    title: 'Pronto a Cominciare?',
    description: 'Esplora tutte le funzionalità e personalizza la tua esperienza.',
    image: require('../assets/images/tutorialIMG/img5.png'),
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleCompleteTutorial = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
      router.replace('/home');
    } catch (e) {
      router.replace('/home');
    }
  };

  const onScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    if (slide !== currentPage) {
      setCurrentPage(slide);
    }
  };

  const goToNextPage = () => {
    if (currentPage < tutorialPagesData.length - 1) {
      scrollViewRef.current?.scrollTo({ x: screenWidth * (currentPage + 1), animated: true });
    }
  };

  const renderPage = (page: any, index: number) => (
    <View key={page.id} style={[styles.pageContainer, { width: screenWidth }]}>
      <Text style={styles.pageTitle}>{page.title}</Text>
      <Image source={page.image} style={styles.pageImage} resizeMode="contain" />
      <Text style={styles.pageDescription}>{page.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={{ height: screenHeight * 0.8 }}
      >
        {tutorialPagesData.map(renderPage)}
      </ScrollView>

      <View style={styles.bottomControls}>
        <View style={styles.pagination}>
          {tutorialPagesData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                currentPage === index ? styles.paginationDotActive : {},
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={currentPage === tutorialPagesData.length - 1 ? handleCompleteTutorial : goToNextPage}
        >
          <Text style={styles.buttonText}>
            {currentPage === tutorialPagesData.length - 1 ? "Inizia Ora" : "Avanti"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  pageContainer: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#005b4f',
    textAlign: 'center',
    marginBottom: 20,
  },
  pageImage: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    marginBottom: 25,
  },
  pageDescription: {
    fontSize: 17,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  paginationDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#D1D1D6',
    marginHorizontal: 6,
  },
  paginationDotActive: {
    backgroundColor: '#00796b',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  button: {
    backgroundColor: '#00796b',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    minWidth: 180,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
