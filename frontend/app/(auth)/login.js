import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 72;
const CARD_GAP = 18;
const FORM_WIDTH = CARD_WIDTH - CARD_GAP * 2;
const SHIMMER_TRAVEL = 220;

export default function LoginScreen() {
  const router = useRouter();
  const shimmerX = useRef(new Animated.Value(-SHIMMER_TRAVEL)).current;

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
      <View style={styles.outerShell}>
        <View style={styles.inner}>
          <View style={styles.headerSection}>
            <Text style={styles.wordmark}>Jhoom.</Text>
          </View>

          <View style={styles.contentSection}>
            <View style={styles.contentStack}>
              <View style={styles.formAnchor}>
                <View style={styles.formSection}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor="#5E6B7F"
                      style={styles.input}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      placeholder="Enter your password"
                      placeholderTextColor="#5E6B7F"
                      style={styles.input}
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomSection}>
            <Link href="/(auth)/register" style={styles.helperLink}>
              Need an account? Sign up
            </Link>

            <Pressable
              onPress={() => router.replace("/(onboarding)/welcome")}
              style={({ pressed }) => [
                styles.submitButton,
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
              <Text style={styles.submitText}>Log in</Text>
            </Pressable>
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
  wordmark: {
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
  contentSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentStack: {
    width: FORM_WIDTH,
    minHeight: 314,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  formAnchor: {
    width: FORM_WIDTH,
    justifyContent: "flex-end",
  },
  formSection: {
    gap: 16,
    alignItems: "center",
  },
  fieldGroup: {
    width: FORM_WIDTH,
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
  bottomSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 14,
    width: "100%",
  },
  helperLink: {
    marginBottom: 20,
    fontSize: 11,
    color: "#62716A",
    textTransform: "uppercase",
  },
  submitButton: {
    width: FORM_WIDTH,
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
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
