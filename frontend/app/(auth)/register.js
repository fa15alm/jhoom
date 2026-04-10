import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
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

const CARD_GAP = 18;
const SHIMMER_TRAVEL = 220;

export default function RegisterScreen() {
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
    wordmarkSize,
  } = useMobileFrame();
  const router = useRouter();
  const shimmerX = useRef(new Animated.Value(-SHIMMER_TRAVEL)).current;
  const formWidth = sliderWidth - CARD_GAP * 2;

  useEffect(() => {
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
  }, [shimmerX]);

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
              <Text style={[styles.wordmark, { fontSize: wordmarkSize }]}>Jhoom.</Text>
            </View>

            <View style={styles.contentSection}>
              <View
                style={[
                  styles.contentStack,
                  {
                    width: formWidth,
                    minHeight: isShortHeight ? 280 : 314,
                  },
                ]}
              >
                <View style={[styles.formAnchor, { width: formWidth }]}>
                  <View style={styles.formSection}>
                    <View style={[styles.fieldGroup, { width: formWidth }]}>
                      <Text style={styles.label}>Username</Text>
                      <TextInput
                        placeholder="Enter your Username"
                        placeholderTextColor="#5E6B7F"
                        style={styles.input}
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={[styles.fieldGroup, { width: formWidth }]}>
                      <Text style={styles.label}>Email</Text>
                      <TextInput
                        placeholder="Enter your Email"
                        placeholderTextColor="#5E6B7F"
                        style={styles.input}
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={[styles.fieldGroup, { width: formWidth }]}>
                      <Text style={styles.label}>Password</Text>
                      <TextInput
                        placeholder="Create a password"
                        placeholderTextColor="#5E6B7F"
                        style={styles.input}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.bottomSection, isCompactWidth && styles.compactBottomSection]}>
              <Pressable style={styles.uploadSection}>
                <View style={styles.uploadCircle}>
                  <Ionicons name="arrow-up-outline" size={24} color="#4EA955" />
                </View>
                <Text style={styles.uploadText}>Upload profile photo</Text>
              </Pressable>

              <Pressable
                onPress={() => router.replace("/(onboarding)/basic-info")}
                style={({ pressed }) => [
                  styles.submitButton,
                  { width: formWidth },
                  pressed && styles.buttonPressed,
                ]}
              >
                <View pointerEvents="none" style={styles.submitBackground}>
                  <LinearGradient
                    colors={["#5FBE67", "#4EA955", "#469A4D"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.submitGradient}
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
                <Text style={[styles.submitText, isCompactWidth && styles.compactSubmitText]}>
                  Complete sign up
                </Text>
              </Pressable>
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
  wordmark: {
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
  contentSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentStack: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
  formAnchor: {
    justifyContent: "flex-end",
  },
  formSection: {
    gap: 16,
    alignItems: "center",
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
    textTransform: "uppercase",
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CFEFD9",
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 18,
    fontSize: 11,
    color: "#111827",
  },
  uploadSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  uploadCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DCEFE1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  uploadText: {
    fontSize: 11,
    color: "#62716A",
    textTransform: "uppercase",
  },
  bottomSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 14,
    width: "100%",
  },
  compactBottomSection: {
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  submitButton: {
    height: 54,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  submitBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  submitGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  shimmerWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 140,
  },
  shimmer: {
    flex: 1,
    borderRadius: 999,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    zIndex: 1,
  },
  compactSubmitText: {
    fontSize: 14,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
