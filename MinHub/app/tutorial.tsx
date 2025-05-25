import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const tutorialPagesData = [
  {
    id: '1',
    title: 'Welcome to MinHub!',
    description: 'MinHub is your all-in-one lifestyle app, designed to simplify your daily organization and boost personal well-being.',
    image: require('../assets/images/tutorialIMG/img1.png'),
  },
  {
    id: '2',
    title: 'Perfect Organization',
    description: 'Effortlessly manage tasks, notes, appointments, and study plans with our suite of integrated productivity tools..',
    image: require('../assets/images/tutorialIMG/img2.png'),
  },
  {
    id: '3',
    title: 'Well-being & Productivity',
    description: 'Nurture your mind and body with dedicated features for meditation, sleep quality, workout tracking, and more..',
    image: require('../assets/images/tutorialIMG/img3.png'),
  },
  {
    id: '4',
    title: 'Useful Tools',
    description: 'Get a personalized experience by telling us a bit about yourself, helping MinHub tailor its suggestions for you.',
    image: require('../assets/images/tutorialIMG/img4.png'),
  },
  {
    id: '5',
    title: 'Ready for the Next Step?',
    description: 'Our goal is to help you live a more organized, mindful, and productive life, all from a single, easy-to-use platform.',
    image: require('../assets/images/tutorialIMG/img5.png'),
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleGoToQuestionnaire = () => {
    router.replace('/questionnaire');
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

  const renderPage = (page: any) => (
    <View key={page.id} style={[styles.pageContainer, { width: screenWidth }]}>
      <Text style={styles.pageTitle}>{page.title}</Text>
      <Image source={page.image} style={styles.pageImage} resizeMode="contain" />
      <Text style={styles.pageDescription}>{page.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.skipButton} onPress={handleGoToQuestionnaire}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
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
          onPress={currentPage === tutorialPagesData.length - 1 ? handleGoToQuestionnaire : goToNextPage}
        >
          <Text style={styles.buttonText}>
            {currentPage === tutorialPagesData.length - 1 ? "Start Questionnaire" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#C5C5EE',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 10, 
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#641E7A',
    fontWeight: '500',
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
    color: '#641E7A',
    textAlign: 'center',
    marginBottom: 20,
  },
  pageImage: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
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
    backgroundColor: '#641E7A',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  button: {
    backgroundColor: '#641E7A',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});