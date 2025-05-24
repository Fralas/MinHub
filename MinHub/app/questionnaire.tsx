import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const ONBOARDING_COMPLETED_KEY = 'minhub_onboarding_completed';
const USER_PROFILE_KEY = 'minhub_user_profile_data';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ProfessionOptions = ["🧑‍🎓 Student", "🧑‍💼 Employed", "🚫 Neither", "🤔 Other"];
const HobbyOptions = [
  { label: "🎨 Painting" },
  { label: "🎵 Music" },
  { label: "⚽ Sports" },
  { label: "📚 Reading" },
  { label: "🎮 Gaming" },
  { label: "🍳 Cooking" },
];
const ReasonOptions = ["🧘‍♀️ Reduce stress", "🤔 Manage overthinking", "💪 Increase productivity", "🙂 General well-being", "🌱 Improve habits"];

const validateEmailFormat = (emailToValidate: string): boolean => {
  if (!emailToValidate) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailToValidate);
};

export default function QuestionnaireScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const [age, setAge] = useState('');
  const [accountName, setAccountName] = useState('');
  const [profession, setProfession] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [reasonForUse, setReasonForUse] = useState('');

  const questionnairePages = [
    { id: '1', title: '🎂 Your Age?', image: require('../assets/images/questionIMG/1.png'), value: age, setter: setAge, keyboard: 'numeric', placeholder: 'E.g., 25', color: '#FFDAB9' },
    { id: '2', title: '👤 Account Name', image: require('../assets/images/questionIMG/2.png'), value: accountName, setter: setAccountName, placeholder: 'How should we call you?', color: '#E6E6FA' },
    { id: '3', title: '🧑‍💼 Profession', image: require('../assets/images/questionIMG/3.png'), options: ProfessionOptions, value: profession, setter: setProfession, color: '#ADD8E6' },
    { id: '4', title: '📧 Your Email', image: require('../assets/images/questionIMG/4.png'), value: email, setter: handleEmailChange, keyboard: 'email-address', placeholder: 'your@email.com', color: '#FFFACD', error: emailError },
    { id: '5', title: '🎨 Favorite Hobbies', image: require('../assets/images/questionIMG/5.png'), options: HobbyOptions.map(h => h.label), value: selectedHobbies, setter: setSelectedHobbies, multiSelect: true, color: '#90EE90' },
    { id: '6', title: '🎯 Main Reason for Use', image: require('../assets/images/questionIMG/6.png'), options: ReasonOptions, value: reasonForUse, setter: setReasonForUse, color: '#FFB6C1' },
  ];

  function handleEmailChange(text: string) {
    setEmail(text);
    if (emailError && validateEmailFormat(text)) {
      setEmailError('');
    }
  }

  const validateCurrentPageAndProceed = () => {
    const currentPageData = questionnairePages[currentPage];
    if (currentPageData.id === '4') {
      if (!validateEmailFormat(email)) {
        setEmailError('Please enter a valid email address.');
        return false;
      } else {
        setEmailError('');
      }
    }
    return true;
  };

  const handleCompleteQuestionnaire = async () => {
    if (!validateEmailFormat(email)) {
      setEmailError('Please enter a valid email address.');
      const emailPageIndex = questionnairePages.findIndex(p => p.id === '4');
      if (emailPageIndex !== -1) {
        scrollViewRef.current?.scrollTo({ x: screenWidth * emailPageIndex, animated: true });
        setCurrentPage(emailPageIndex);
      }
      Alert.alert("Invalid Email", "Please check your email address before finishing.");
      return;
    }
    setEmailError('');

    const userProfileData = {
      age,
      accountName,
      profession,
      email,
      hobbies: selectedHobbies,
      reasonForUse,
      questionnaireCompletedOn: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfileData));
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      router.replace('/home');
    } catch (e) {
      router.replace('/home');
    }
  };

  const toggleHobby = (hobby: string) => {
    setSelectedHobbies(prev =>
      prev.includes(hobby) ? prev.filter(h => h !== hobby) : [...prev, hobby]
    );
  };

  const onScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    if (slide !== currentPage) {
      setCurrentPage(slide);
    }
  };

  const goToNextPage = () => {
    if (!validateCurrentPageAndProceed()) {
      return;
    }
    if (currentPage < questionnairePages.length - 1) {
      scrollViewRef.current?.scrollTo({ x: screenWidth * (currentPage + 1), animated: true });
    }
  };

  const renderQuestionPage = (pageData: any) => (
    <View key={pageData.id} style={[styles.pageContainer, { width: screenWidth, backgroundColor: pageData.color || '#F5F5F5' }]}>
      <Image source={pageData.image} style={styles.pageImage} resizeMode="contain" />
      <Text style={styles.pageTitle}>{pageData.title}</Text>
      {pageData.options ? (
        <View style={styles.optionsContainer}>
          {pageData.options.map((option: string) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                pageData.multiSelect ? (pageData.value.includes(option) ? styles.optionSelected : {}) : (pageData.value === option ? styles.optionSelected : {}),
              ]}
              onPress={() => {
                if (pageData.multiSelect) {
                  toggleHobby(option);
                } else {
                  pageData.setter(option);
                }
              }}
            >
              <Text style={[styles.optionText, pageData.value === option || (pageData.multiSelect && pageData.value.includes(option)) ? styles.optionTextSelected : {}]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <>
          <TextInput
            style={[styles.input, pageData.error ? styles.inputError : {}]}
            placeholder={pageData.placeholder || ""}
            value={pageData.value}
            onChangeText={pageData.setter}
            keyboardType={pageData.keyboard || 'default'}
            autoCapitalize={pageData.id === '4' ? "none" : "sentences"}
            onBlur={pageData.id === '4' ? () => validateEmailFormat(email) ? setEmailError('') : setEmailError('Invalid email format.') : undefined}
          />
          {pageData.error && <Text style={styles.errorText}>{pageData.error}</Text>}
        </>
      )}
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
        keyboardShouldPersistTaps="handled"
      >
        {questionnairePages.map(renderQuestionPage)}
      </ScrollView>
      <View style={styles.bottomControls}>
        <View style={styles.pagination}>
          {questionnairePages.map((_, index) => (
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
          onPress={currentPage === questionnairePages.length - 1 ? handleCompleteQuestionnaire : goToNextPage}
        >
          <Text style={styles.buttonText}>
            {currentPage === questionnairePages.length - 1 ? "Finish" : "Next"}
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
    padding: 20,
  },
  pageImage: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    width: '80%',
    height: 50,
    borderColor: '#641E7A',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    backgroundColor: 'white',
    marginBottom: 5,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    width: '80%', // Match input width for alignment
    marginTop: 2,
    marginBottom: 10, // Space below error
    textAlign: 'left', // Align with input text
  },
  optionsContainer: {
    width: '90%',
    alignItems: 'center',
  },
  optionButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#641E7A',
    width: '80%',
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: '#641E7A',
    borderColor: '#4A0D5C',
  },
  optionText: {
    fontSize: 16,
    color: '#641E7A',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: 'white',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  paginationDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#BDBDBD',
    marginHorizontal: 8,
  },
  paginationDotActive: {
    backgroundColor: '#641E7A',
  },
  button: {
    backgroundColor: '#641E7A',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 30,
    minWidth: 180,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});