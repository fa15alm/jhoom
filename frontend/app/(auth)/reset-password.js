/*
 * Password reset screen.
 *
 * Reads the reset token from the URL and lets the user choose a new password.
 */
import { LinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
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
import { confirmPasswordReset } from "../../src/services/api/authApi";

const CARD_GAP = 18;
const SHIMMER_TRAVEL = 220;

export default function ResetPasswordScreen() {
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
  const params = useLocalSearchParams();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const shimmerX = useRef(new Animated.Value(-SHIMMER_TRAVEL)).current;
  const formWidth = sliderWidth - CARD_GAP * 2;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

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

  function clearFeedback() {
    if (errorText) {
      setErrorText("");
    }
    if (statusText) {
      setStatusText("");
    }
  }

  async function handleResetPassword() {
    if (!token) {
      setErrorText("This reset link is missing a token.");
      return;
    }

    if (password.length < 8) {
      setErrorText("Password needs to be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorText("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await confirmPasswordReset({
        token,
        password,
      });
      setIsComplete(true);
      setPassword("");
      setConfirmPassword("");
      setErrorText("");
      setStatusText("Password reset. You can log in with the new password.");
    } catch (error) {
      setErrorText(error.message || "Could not reset password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
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
              <Text style={[styles.wordmark, { fontSize: wordmarkSize }]}>Jhoom.</Text>
            </View>

            <View style={styles.contentSection}>
              <View
                style={[
                  styles.contentStack,
                  {
                    width: formWidth,
                    minHeight: isShortHeight ? 190 : 230,
                  },
                ]}
              >
                <Text style={styles.screenTitle}>Reset password</Text>
                <Text style={styles.screenText}>
                  Choose a new password for your account.
                </Text>

                {!token ? (
                  <Text accessibilityRole="alert" style={styles.errorText}>
                    This reset link is missing a token.
                  </Text>
                ) : null}

                {!isComplete ? (
                  <>
                    <View style={[styles.fieldGroup, { width: formWidth }]}>
                      <Text style={styles.label}>New password</Text>
                      <View style={styles.passwordWrap}>
                        <TextInput
                          value={password}
                          onChangeText={(value) => {
                            setPassword(value);
                            clearFeedback();
                          }}
                          placeholder="Create a new password"
                          placeholderTextColor="#5E6B7F"
                          style={[styles.input, styles.passwordInput]}
                          secureTextEntry={!showPassword}
                          autoComplete="new-password"
                          textContentType="newPassword"
                        />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            showPassword ? "Hide password" : "Show password"
                          }
                          onPress={() => setShowPassword((current) => !current)}
                          style={({ pressed }) => [
                            styles.passwordToggle,
                            pressed && styles.buttonPressed,
                          ]}
                        >
                          <Text style={styles.passwordToggleText}>
                            {showPassword ? "Hide" : "Show"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={[styles.fieldGroup, { width: formWidth }]}>
                      <Text style={styles.label}>Confirm password</Text>
                      <TextInput
                        value={confirmPassword}
                        onChangeText={(value) => {
                          setConfirmPassword(value);
                          clearFeedback();
                        }}
                        placeholder="Confirm the new password"
                        placeholderTextColor="#5E6B7F"
                        style={styles.input}
                        secureTextEntry={!showPassword}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        onSubmitEditing={handleResetPassword}
                      />
                    </View>
                  </>
                ) : null}

                {errorText ? (
                  <Text accessibilityRole="alert" style={styles.errorText}>
                    {errorText}
                  </Text>
                ) : null}

                {statusText ? (
                  <Text style={styles.noticeText}>{statusText}</Text>
                ) : null}
              </View>
            </View>

            <View style={[styles.bottomSection, isCompactWidth && styles.compactBottomSection]}>
              {!isComplete ? (
                <Pressable
                  onPress={handleResetPassword}
                  disabled={isSubmitting || !token}
                  style={({ pressed }) => [
                    styles.submitButton,
                    { width: formWidth },
                    (isSubmitting || !token) && styles.submitButtonDisabled,
                    pressed && !isSubmitting && token && styles.buttonPressed,
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
                    {isSubmitting ? "Resetting..." : "Reset password"}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => router.replace("/(auth)/login")}
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
                  </View>
                  <Text style={[styles.submitText, isCompactWidth && styles.compactSubmitText]}>
                    Back to login
                  </Text>
                </Pressable>
              )}

              <Link href="/(auth)/login" style={styles.loginLink}>
                Remembered your password? Log in
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
    flexGrow: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  contentStack: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  screenText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#62716A",
    textAlign: "center",
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
  passwordWrap: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 76,
  },
  passwordToggle: {
    position: "absolute",
    right: 8,
    height: 36,
    minWidth: 56,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CFEFD9",
  },
  passwordToggleText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#4EA955",
    textTransform: "uppercase",
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
  noticeText: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CFEFD9",
    backgroundColor: "#F4FFF7",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 11,
    fontWeight: "700",
    color: "#4EA955",
    textAlign: "center",
  },
  bottomSection: {
    flexGrow: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 22,
    paddingBottom: 10,
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
  submitButtonDisabled: {
    opacity: 0.72,
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
