import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 72;
const CARD_SPACING = 18;
const SHIMMER_TRAVEL = 220;

const slides = [
  {
    eyebrow: "Welcome",
    title: "Start your health journey with Jhoom",
    text: "Track the essentials, stay consistent, and keep your routine simple from one mobile-first dashboard with AI Built in.",
    accent: "#16A34A",
    kind: "greeting",
  },
  {
    eyebrow: "Workout tracking",
    title: "Log sessions and build momentum",
    text: "Record workouts quickly and see your weekly effort without digging through multiple screens.",
    accent: "#16A34A",
    kind: "feature",
  },
  {
    eyebrow: "Nutrition overview",
    title: "Keep meals and calories in check",
    text: "Stay on top of your food intake with a clear summary designed for fast mobile check-ins.",
    accent: "#16A34A",
    kind: "feature",
  },
  {
    eyebrow: "Progress feedback",
    title: "Watch habits turn into results",
    text: "See streaks, milestones, and simple progress signals that keep you moving forward each week.",
    accent: "#16A34A",
    kind: "feature",
  },
];

function ActionButton({ href, label, variant = "primary" }) {
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
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function FeatureCard({ item }) {
  if (item.kind === "greeting") {
    return (
      <View style={[styles.featureCard, styles.greetingCard]}>
        <Text style={styles.featureEyebrow}>{item.eyebrow}</Text>
        <Text style={styles.greetingTitle}>{item.title}</Text>
        <Text style={styles.greetingText}>{item.text}</Text>
      </View>
    );
  }

  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureEyebrow}>{item.eyebrow}</Text>
      <Text style={styles.featureTitle}>{item.title}</Text>
      <Text style={styles.featureText}>{item.text}</Text>
    </View>
  );
}

export default function LandingPage() {
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
      <View style={styles.outerShell}>
        <View style={styles.inner}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Jhoom.</Text>
          </View>

          <View style={styles.sliderSection}>
            <FlatList
              ref={listRef}
              data={slides}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => index.toString()}
              style={styles.sliderList}
              contentContainerStyle={styles.sliderContent}
              renderItem={({ item }) => <FeatureCard item={item} />}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
            />

            <View style={styles.dotsRow}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeIndex === index && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.bottomSection}>
            <ActionButton
              href="/(auth)/login"
              label="Login"
              variant="secondary"
            />
            <ActionButton
              href="/(auth)/register"
              label="Sign up"
              variant="primary"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FB",
  },
  outerShell: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  inner: {
    flex: 1,
    borderRadius: 38,
    backgroundColor: "#F7F8FB",
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 26,
  },
  headerSection: {
    alignItems: "center",
    paddingTop: 42,
    marginBottom: 28,
  },
  title: {
    fontSize: 52,
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
    width: CARD_WIDTH,
    flexGrow: 0,
  },
  sliderContent: {
    alignItems: "center",
  },
  featureCard: {
    width: CARD_WIDTH - CARD_SPACING * 2,
    marginHorizontal: CARD_SPACING,
    backgroundColor: "#ECFDF3",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#CFEFD9",
    paddingHorizontal: 24,
    paddingVertical: 28,
    minHeight: 314,
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
    width: 8,
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
  primaryButtonText: {
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#111827",
  },
});
