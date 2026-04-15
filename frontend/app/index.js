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
  View,
} from "react-native";
import useMobileFrame from "../hooks/useMobileFrame";

const CARD_SPACING = 18;
const SHIMMER_TRAVEL = 220;

const slides = [
  {
    eyebrow: "App overview",
    title: "Your health plan, logs, progress, and coach in one place",
    text: "Jhoom helps you set up a custom plan, track daily health metrics, follow progress, hit milestones, and get AI guidance from a mobile-first dashboard.",
    kind: "greeting",
  },
  {
    eyebrow: "Dashboard",
    title: "See your week at a glance",
    text: "View calories burned, sleep time, steps, workouts, streaks, and upcoming plan focus from one clean dashboard.",
    kind: "feature",
  },
  {
    eyebrow: "Daily logging",
    title: "Log what matters each day",
    text: "Add workouts, cardio, nutrition, calories burned, sleep, and steps, then return to previous days to edit your logs.",
    kind: "feature",
  },
  {
    eyebrow: "AI health coach",
    title: "Generate and adjust your plan",
    text: "Answer onboarding questions to build a custom plan, then ask the AI coach for guidance around training, recovery, and routine changes.",
    kind: "feature",
  },
  {
    eyebrow: "Milestones and social",
    title: "Stay accountable as you improve",
    text: "Set milestones, see what you have reached, share weekly updates, and follow friends for extra motivation.",
    kind: "feature",
  },
  {
    eyebrow: "Privacy",
    title: "Your health data stays personal",
    text: "Profile details, logs, integrations, and social sharing should always be controlled by you. Backend privacy controls will connect here later.",
    kind: "feature",
  },
];

function ActionButton({ href, label, variant = "primary", compact = false }) {
  const isPrimary = variant === "primary";
  const router = useRouter();
  const shimmerX = useRef(new Animated.Value(-SHIMMER_TRAVEL)).current;

  useEffect(() => {
    if (!isPrimary) {
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
  }, [isPrimary, shimmerX]);

  return (
    <View style={styles.actionButtonSlot}>
      <Pressable
        onPress={() => router.push(href)}
        style={({ pressed }) => [
          styles.actionButton,
          isPrimary ? styles.primaryButton : styles.secondaryButton,
          compact && styles.compactButton,
          pressed && styles.buttonPressed,
        ]}
      >
        {isPrimary ? (
          <View pointerEvents="none" style={styles.primaryButtonBackground}>
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
          </View>
        ) : null}
        <Text
          style={[
            styles.actionButtonText,
            isPrimary ? styles.primaryButtonText : styles.secondaryButtonText,
            compact && styles.compactButtonText,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function FeatureCard({ item, cardWidth, compact, short }) {
  const cardStyle = [
    styles.featureCard,
    item.kind === "greeting" && styles.greetingCard,
    {
      width: cardWidth,
      minHeight: short ? 280 : 314,
      paddingHorizontal: compact ? 18 : 24,
      paddingVertical: compact ? 22 : 28,
    },
  ];

  if (item.kind === "greeting") {
    return (
      <View style={cardStyle}>
        <Text style={[styles.featureEyebrow, compact && styles.compactEyebrow]}>
          {item.eyebrow}
        </Text>
        <Text style={[styles.greetingTitle, compact && styles.compactGreetingTitle]}>
          {item.title}
        </Text>
        <Text style={[styles.greetingText, compact && styles.compactBodyText]}>
          {item.text}
        </Text>
      </View>
    );
  }

  return (
    <View style={cardStyle}>
      <Text style={[styles.featureEyebrow, compact && styles.compactEyebrow]}>
        {item.eyebrow}
      </Text>
      <Text style={[styles.featureTitle, compact && styles.compactFeatureTitle]}>
        {item.title}
      </Text>
      <Text style={[styles.featureText, compact && styles.compactBodyText]}>
        {item.text}
      </Text>
    </View>
  );
}

export default function LandingPage() {
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
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0]?.index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

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
                minHeight: shellMinHeight,
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
                href="/(auth)/login"
                label="Login"
                variant="secondary"
                compact={isCompactWidth}
              />
              <ActionButton
                href="/(auth)/register"
                label="Sign up"
                variant="primary"
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
  compactFeatureTitle: {
    fontSize: 24,
    lineHeight: 30,
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
  compactBodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  greetingText: {
    fontSize: 16,
    color: "#5E6B7F",
    lineHeight: 25,
    textAlign: "center",
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
    gap: 10,
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
  secondaryButton: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
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
  secondaryButtonText: {
    color: "#111827",
  },
});
