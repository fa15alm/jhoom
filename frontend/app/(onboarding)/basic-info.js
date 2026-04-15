import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import useMobileFrame from "../../hooks/useMobileFrame";
import {
  buildPlanPreview,
  getDefaultOnboardingAnswers,
  saveOnboardingAnswers,
} from "../../lib/healthPlan";

const CARD_SPACING = 18;
const SHIMMER_TRAVEL = 220;
const ADDITIONAL_GOALS_LIMIT = 240;
const LIMITATIONS_LIMIT = 180;

const slides = [
  {
    eyebrow: "Personalised setup",
    title: "Set up your custom plan",
    text: "Sharing a few details helps AI build a more custom health plan around your body, habits, and goals.",
    kind: "greeting",
  },
  {
    title: "Basic information",
    kind: "basic-info",
  },
  {
    title: "Choose your goal",
    text: "You can change this later.",
    options: [
      "Lose weight",
      "Gain muscle",
      "Maintain weight",
      "Improve endurance",
    ],
    stateKey: "goal",
    kind: "question",
  },
  {
    title: "Your activity level",
    text: "Help us personalise your plan.",
    options: ["Beginner", "Intermediate", "Advanced"],
    stateKey: "activityLevel",
    kind: "question",
  },
  {
    title: "Personal details",
    text: "Optional, but useful for safer plan estimates.",
    options: ["Female", "Male", "Non-binary", "Prefer not to say"],
    stateKey: "sex",
    kind: "question",
  },
  {
    title: "Training days",
    text: "How often can you realistically train?",
    options: ["2 days per week", "3 days per week", "4 days per week", "5+ days per week"],
    stateKey: "trainingDays",
    kind: "question",
  },
  {
    title: "Equipment access",
    text: "This shapes the workout plan.",
    options: ["Home only", "Gym access", "Bodyweight", "Mixed access"],
    stateKey: "equipment",
    kind: "question",
  },
  {
    title: "Injuries or limits?",
    text: "Share anything the AI should avoid or adapt around.",
    placeholder: "Knee pain, lower back issues, shoulder injury, medical limits...",
    stateKey: "limitations",
    maxLength: LIMITATIONS_LIMIT,
    kind: "text-question",
  },
  {
    title: "Diet preference",
    text: "This helps shape meal suggestions.",
    options: ["Balanced", "Vegetarian", "Vegan", "High protein", "No preference"],
    stateKey: "dietaryPreference",
    kind: "question",
  },
  {
    title: "Sleep goal",
    text: "Set a realistic recovery target.",
    options: ["6-7 hours", "7-8 hours", "8+ hours", "Improve consistency"],
    stateKey: "sleepGoal",
    kind: "question",
  },
  {
    title: "Any other health goals?",
    text: "Share any extra overall health goals you want the AI to consider.",
    placeholder: "Better sleep, more energy, healthier routine, improved recovery...",
    stateKey: "additionalGoals",
    maxLength: ADDITIONAL_GOALS_LIMIT,
    kind: "text-question",
  },
  {
    title: "Plan preview",
    text: "Review the frontend plan summary before generating it.",
    kind: "plan-preview",
  },
];

function ActionButton({ label, onPress, disabled = false, compact = false }) {
  const shimmerX = useRef(new Animated.Value(-SHIMMER_TRAVEL)).current;

  useEffect(() => {
    if (disabled) {
      shimmerX.setValue(-SHIMMER_TRAVEL);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.timing(shimmerX, {
        toValue: SHIMMER_TRAVEL,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
      shimmerX.setValue(-SHIMMER_TRAVEL);
    };
  }, [disabled, shimmerX]);

  return (
    <View style={styles.actionButtonSlot}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionButton,
          disabled ? styles.disabledButton : styles.primaryButton,
          compact && styles.compactButton,
          pressed && !disabled && styles.buttonPressed,
        ]}
      >
        <View pointerEvents="none" style={styles.primaryButtonBackground}>
          {disabled ? (
            <LinearGradient
              colors={["#CBD5E1", "#CBD5E1"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryGradient}
            />
          ) : (
            <>
              <LinearGradient
                colors={["#5FBE67", "#4EA955", "#469A4D"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.primaryGradient}
              />
              <Animated.View
                style={[
                  styles.shimmerWrap,
                  { transform: [{ translateX: shimmerX }] },
                ]}
              >
                <LinearGradient
                  colors={[
                    "rgba(255,255,255,0)",
                    "rgba(255,255,255,0.26)",
                    "rgba(255,255,255,0)",
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.shimmer}
                />
              </Animated.View>
            </>
          )}
        </View>
        <Text
          style={[
            styles.actionButtonText,
            disabled ? styles.disabledButtonText : styles.primaryButtonText,
            compact && styles.compactButtonText,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function FeatureCard({
  item,
  basicInfo,
  planDetails,
  onChangeBasicInfo,
  onChangePlanDetail,
  planPreview,
  missingRequiredFields,
  cardWidth,
  compact,
  short,
}) {
  const cardStyle = [
    styles.featureCard,
    styles.greetingCard,
    {
      width: cardWidth,
      minHeight: short ? 300 : 340,
      paddingHorizontal: compact ? 18 : 24,
      paddingVertical: compact ? 22 : 28,
    },
  ];

  if (item.kind === "basic-info") {
    return (
      <View style={cardStyle}>
        <Text style={[styles.greetingTitle, compact && styles.compactGreetingTitle]}>
          {item.title}
        </Text>

        <View style={styles.basicInfoForm}>
          <TextInput
            value={basicInfo.dateOfBirth}
            onChangeText={(value) => onChangeBasicInfo("dateOfBirth", value)}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#7A8699"
            style={styles.basicInfoInput}
            keyboardType="numbers-and-punctuation"
          />
          <TextInput
            value={basicInfo.height}
            onChangeText={(value) => onChangeBasicInfo("height", value)}
            placeholder="Height"
            placeholderTextColor="#7A8699"
            style={styles.basicInfoInput}
            keyboardType="numeric"
          />
          <TextInput
            value={basicInfo.weight}
            onChangeText={(value) => onChangeBasicInfo("weight", value)}
            placeholder="Weight"
            placeholderTextColor="#7A8699"
            style={styles.basicInfoInput}
            keyboardType="numeric"
          />
        </View>
      </View>
    );
  }

  if (item.kind === "question") {
    return (
      <View style={cardStyle}>
        <Text style={[styles.greetingTitle, compact && styles.compactGreetingTitle]}>
          {item.title}
        </Text>
        <Text style={[styles.greetingText, compact && styles.compactBodyText]}>
          {item.text}
        </Text>

        <View style={styles.optionList}>
          {item.options.map((option) => {
            const isSelected = planDetails[item.stateKey] === option;

            return (
              <Pressable
                key={option}
                onPress={() => onChangePlanDetail(item.stateKey, option)}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    isSelected && styles.optionButtonTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (item.kind === "text-question") {
    return (
      <View style={cardStyle}>
        <Text style={[styles.greetingTitle, compact && styles.compactGreetingTitle]}>
          {item.title}
        </Text>
        <Text style={[styles.greetingText, compact && styles.compactBodyText]}>
          {item.text}
        </Text>

        <View style={styles.basicInfoForm}>
          <TextInput
            value={planDetails[item.stateKey]}
            onChangeText={(value) => onChangePlanDetail(item.stateKey, value)}
            placeholder={item.placeholder}
            placeholderTextColor="#7A8699"
            style={[styles.basicInfoInput, styles.goalsInput]}
            multiline
            maxLength={item.maxLength}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {planDetails[item.stateKey].length}/{item.maxLength}
          </Text>
        </View>
      </View>
    );
  }

  if (item.kind === "plan-preview") {
    return (
      <View style={cardStyle}>
        <Text style={[styles.greetingTitle, compact && styles.compactGreetingTitle]}>
          {item.title}
        </Text>
        <Text style={[styles.greetingText, compact && styles.compactBodyText]}>
          {missingRequiredFields.length
            ? "Complete the required setup cards so the AI plan has enough context."
            : item.text}
        </Text>

        <View style={styles.previewList}>
          {missingRequiredFields.length ? (
            <Text style={styles.previewMissing}>
              Missing: {missingRequiredFields.join(", ")}
            </Text>
          ) : (
            planPreview.map((section) => (
              <View key={section.title} style={styles.previewItem}>
                <Text style={styles.previewTitle}>{section.title}</Text>
                <Text style={styles.previewText}>{section.body}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={cardStyle}>
      <Text style={[styles.featureEyebrow, compact && styles.compactEyebrow]}>
        {item.eyebrow}
      </Text>
      <Text style={[styles.featureTitle, compact && styles.compactGreetingTitle]}>
        {item.title}
      </Text>
      <Text style={[styles.featureText, compact && styles.compactBodyText]}>
        {item.text}
      </Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const {
    isCompactWidth,
    isShortHeight,
    shellPaddingHorizontal,
    shellPaddingVertical,
    innerPaddingHorizontal,
    innerPaddingTop,
    innerPaddingBottom,
    shellMinHeight,
    sliderWidth,
    cardWidth,
    wordmarkSize,
  } = useMobileFrame();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const defaultAnswers = getDefaultOnboardingAnswers();
  const [basicInfo, setBasicInfo] = useState({
    dateOfBirth: defaultAnswers.dateOfBirth,
    height: defaultAnswers.height,
    weight: defaultAnswers.weight,
  });
  const [planDetails, setPlanDetails] = useState({
    goal: defaultAnswers.goal,
    activityLevel: defaultAnswers.activityLevel,
    sex: defaultAnswers.sex,
    trainingDays: defaultAnswers.trainingDays,
    equipment: defaultAnswers.equipment,
    limitations: defaultAnswers.limitations,
    dietaryPreference: defaultAnswers.dietaryPreference,
    sleepGoal: defaultAnswers.sleepGoal,
    additionalGoals: defaultAnswers.additionalGoals,
  });
  const listRef = useRef(null);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;
  const isLastSlide = activeIndex === slides.length - 1;
  const planAnswers = {
    ...basicInfo,
    ...planDetails,
  };
  const requiredFields = [
    ["dateOfBirth", "date of birth"],
    ["height", "height"],
    ["weight", "weight"],
    ["goal", "goal"],
    ["activityLevel", "activity level"],
    ["trainingDays", "training days"],
    ["equipment", "equipment"],
    ["sleepGoal", "sleep goal"],
  ];
  const missingRequiredFields = requiredFields
    .filter(([key]) => !planAnswers[key]?.trim())
    .map(([, label]) => label);
  const isOnboardingComplete = missingRequiredFields.length === 0;
  const planPreview = buildPlanPreview(planAnswers);
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0]?.index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  function handleBasicInfoChange(field, value) {
    setBasicInfo((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handlePlanDetailChange(field, value) {
    setPlanDetails((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleGeneratePlan() {
    if (!isOnboardingComplete) {
      return;
    }

    saveOnboardingAnswers(planAnswers);
    router.replace("/dashboard");
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View
          style={[
            styles.outerShell,
            {
              paddingHorizontal: shellPaddingHorizontal,
              paddingVertical: shellPaddingVertical,
            },
          ]}
        >
          <View
            style={[
              styles.inner,
              {
                minHeight: Math.max(shellMinHeight, 700),
                paddingHorizontal: innerPaddingHorizontal,
                paddingTop: innerPaddingTop,
                paddingBottom: innerPaddingBottom,
              },
            ]}
          >
            <View style={[styles.headerSection, isShortHeight && styles.compactHeaderSection]}>
              <Text style={[styles.title, { fontSize: wordmarkSize }]}>Jhoom.</Text>
            </View>

            <View style={styles.sliderSection}>
              <FlatList
                ref={listRef}
                data={slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                style={[styles.sliderList, { width: sliderWidth }]}
                contentContainerStyle={styles.sliderContent}
                renderItem={({ item }) => (
                  <FeatureCard
                    item={item}
                    basicInfo={basicInfo}
                    planDetails={planDetails}
                    onChangeBasicInfo={handleBasicInfoChange}
                    onChangePlanDetail={handlePlanDetailChange}
                    planPreview={planPreview}
                    missingRequiredFields={missingRequiredFields}
                    cardWidth={cardWidth}
                    compact={isCompactWidth}
                    short={isShortHeight}
                  />
                )}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
              />

              <View style={styles.dotsRow}>
                {slides.map((_, index) => (
                  <View
                    key={index}
                    style={[styles.dot, activeIndex === index && styles.activeDot]}
                  />
                ))}
              </View>
            </View>

            <View style={[styles.bottomSection, isCompactWidth && styles.compactBottomSection]}>
              <ActionButton
                label="Generate custom plan"
                disabled={!isLastSlide || !isOnboardingComplete}
                onPress={handleGeneratePlan}
                compact={isCompactWidth}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FB",
  },
  scrollContent: {
    flexGrow: 1,
  },
  outerShell: {
    flexGrow: 1,
  },
  inner: {
    flexGrow: 1,
    borderRadius: 38,
    backgroundColor: "#F7F8FB",
  },
  headerSection: {
    alignItems: "center",
    paddingTop: 42,
    marginBottom: 28,
  },
  compactHeaderSection: {
    paddingTop: 24,
    marginBottom: 22,
  },
  title: {
    fontWeight: "600",
    color: "#111827",
    letterSpacing: 0.1,
    fontFamily: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "serif",
    }),
    textShadowColor: "rgba(34, 197, 94, 0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  sliderSection: {
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  sliderList: {
    flexGrow: 0,
  },
  sliderContent: {
    alignItems: "center",
  },
  featureCard: {
    marginHorizontal: CARD_SPACING,
    backgroundColor: "#ECFDF3",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#CFEFD9",
    justifyContent: "center",
    alignItems: "center",
  },
  greetingCard: {
    backgroundColor: "#E7F9EE",
  },
  featureEyebrow: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7A8699",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  compactEyebrow: {
    fontSize: 12,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 36,
    marginBottom: 12,
    textAlign: "center",
  },
  featureText: {
    fontSize: 15,
    color: "#5E6B7F",
    lineHeight: 24,
    textAlign: "center",
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 38,
    marginBottom: 12,
    textAlign: "center",
  },
  compactGreetingTitle: {
    fontSize: 26,
    lineHeight: 32,
  },
  greetingText: {
    fontSize: 16,
    color: "#5E6B7F",
    lineHeight: 25,
    textAlign: "center",
  },
  compactBodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  basicInfoForm: {
    width: "100%",
    marginTop: 8,
  },
  basicInfoInput: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CFE0D4",
    backgroundColor: "#F7F8FB",
    paddingHorizontal: 18,
    fontSize: 15,
    color: "#111827",
    marginBottom: 12,
  },
  goalsInput: {
    minHeight: 120,
    paddingTop: 16,
    paddingBottom: 16,
  },
  characterCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7A8699",
    textAlign: "right",
  },
  previewList: {
    width: "100%",
    gap: 10,
    marginTop: 10,
  },
  previewItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CFEFD9",
    backgroundColor: "#F7F8FB",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#4EA955",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  previewText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: "#5E6B7F",
  },
  previewMissing: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
    color: "#991B1B",
    textAlign: "center",
  },
  optionList: {
    width: "100%",
    marginTop: 8,
  },
  optionButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CFE0D4",
    backgroundColor: "#F7F8FB",
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  optionButtonTextSelected: {
    color: "#166534",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#D7DEE8",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#111827",
  },
  bottomSection: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 8,
    paddingBottom: 14,
    width: "100%",
  },
  compactBottomSection: {
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  actionButtonSlot: {
    flex: 1,
    height: 54,
  },
  actionButton: {
    flex: 1,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    overflow: "hidden",
    position: "relative",
  },
  compactButton: {
    paddingHorizontal: 12,
  },
  primaryButton: {
    backgroundColor: "#16A34A",
  },
  disabledButton: {
    backgroundColor: "#CBD5E1",
  },
  primaryButtonBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  primaryGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  shimmerWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 120,
  },
  shimmer: {
    flex: 1,
    borderRadius: 999,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    zIndex: 1,
  },
  compactButtonText: {
    fontSize: 14,
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  disabledButtonText: {
    color: "#F8FAFC",
  },
});
