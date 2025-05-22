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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const tutorialPagesData = [
  {
    id: '1',
    title: 'Welcome to MinHub!',
    description: 'Your new multi-function app to simplify daily life.',
    image: require('../assets/images/tutorialIMG/img1.png'),
  },
  {
    id: '2',
    title: 'Perfect Organization',
    description: 'Manage Todo Lists, Notes, Diary, and Calendar with ease.',
    image: require('../assets/images/tutorialIMG/img2.png'),
  },
  {
    id: '3',
    title: 'Well-being & Productivity',
    description: 'Relax with Meditation, track Sleep, and focus with Pomodoro.',
    image: require('../assets/images/tutorialIMG/img3.png'),
  },
  {
    id: '4',
    title: 'Useful Tools',
    description: 'From Period Tracker to Calculator, through Shopping Lists.',
    image: require('../assets/images/tutorialIMG/img4.png'),
  },
  {
    id: '5',
    title: 'Ready for the Next Step?',
    description: 'Complete a short questionnaire to personalize your experience.',
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
    minWidth: 220,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});