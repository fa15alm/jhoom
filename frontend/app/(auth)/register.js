/*
 * Sign-up screen.
 *
 * This screen collects the minimum account details needed before onboarding.
 * It currently performs frontend validation only. Backend integration should
 * replace the final route change in `handleCompleteSignUp` with a call to
 * `authApi.registerUser`, then persist the returned session/user data.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import useMobileFrame from "../../src/shared/hooks/useMobileFrame";

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
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    // Runs the same subtle shimmer used on the landing/auth primary buttons.
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

  function handleFieldChange(field, value) {
    // Keep all registration fields in a single object so the payload shape
    // will be easy to pass directly to the auth API later.
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    if (formError) {
      setFormError("");
    }
  }

  function handleCompleteSignUp() {
    // Keep validation close to the submit handler so it mirrors backend requirements.
    // The backend should enforce the same rules; frontend validation is only
    // for fast user feedback.
    const username = form.username.trim();
    const email = form.email.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;
    const isEmailValid = /\S+@\S+\.\S+/.test(email);

    if (!username || !email || !password || !confirmPassword) {
      setFormError("Fill in every field to complete sign up.");
      return;
    }

    if (!isEmailValid) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setFormError("Password needs to be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setFormError("Agree to the terms and privacy policy to continue.");
      return;
    }

    setFormError("");
    // Temporary success path. Replace with registerUser(...) before routing.
    router.replace("/(onboarding)/basic-info");
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
                        value={form.username}
                        onChangeText={(value) => handleFieldChange("username", value)}
                        placeholder="Enter your Username"
                        placeholderTextColor="#5E6B7F"
                        style={styles.input}
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={[styles.fieldGroup, { width: formWidth }]}>
                      <Text style={styles.label}>Email</Text>
                      <TextInput
                        value={form.email}
                        onChangeText={(value) => handleFieldChange("email", value)}
                        placeholder="Enter your Email"
                        placeholderTextColor="#5E6B7F"
                        style={styles.input}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                        textContentType="emailAddress"
                      />
                    </View>

                    <View style={[styles.fieldGroup, { width: formWidth }]}>
                      <Text style={styles.label}>Password</Text>
                      <TextInput
                        value={form.password}
                        onChangeText={(value) => handleFieldChange("password", value)}
                        placeholder="Create a password"
                        placeholderTextColor="#5E6B7F"
                        style={styles.input}
                        secureTextEntry
                        autoComplete="new-password"
                        textContentType="newPassword"
                      />
                    </View>

                    <View style={[styles.fieldGroup, { width: formWidth }]}>
                      <Text style={styles.label}>Confirm password</Text>
                      <TextInput
                        value={form.confirmPassword}
                        onChangeText={(value) => handleFieldChange("confirmPassword", value)}
                        placeholder="Confirm your password"
                        placeholderTextColor="#5E6B7F"
                        style={styles.input}
                        secureTextEntry
                        autoComplete="new-password"
                        textContentType="newPassword"
                      />
                    </View>

                    <Pressable
                      onPress={() => {
                        setAcceptedTerms((current) => !current);
                        setFormError("");
                      }}
                      style={({ pressed }) => [
                        styles.termsRow,
                        { width: formWidth },
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          acceptedTerms && styles.checkboxSelected,
                        ]}
                      >
                        {acceptedTerms ? (
                          <Ionicons name="checkmark-outline" size={14} color="#FFFFFF" />
                        ) : null}
                      </View>
                      <Text style={styles.termsText}>
                        I agree to the terms and privacy policy.
                      </Text>
                    </Pressable>

                    {formError ? (
                      <Text accessibilityRole="alert" style={styles.errorText}>
                        {formError}
                      </Text>
                    ) : null}
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
                onPress={handleCompleteSignUp}
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

              <Link href="/(auth)/login" style={styles.loginLink}>
                Already have an account? Log in
              </Link>
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
  termsRow: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CFEFD9",
    backgroundColor: "#F4FFF7",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A8C995",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#4EA955",
    borderColor: "#4EA955",
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "#62716A",
  },
  errorText: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 11,
    fontWeight: "700",
    color: "#991B1B",
    textAlign: "center",
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
  loginLink: {
    marginTop: 14,
    fontSize: 11,
    color: "#62716A",
    textTransform: "uppercase",
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
