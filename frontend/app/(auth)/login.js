/*
 * Login screen.
 *
 * Uses the backend auth API, stores the returned session, then routes into the app.
 */
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
import { loginUser, requestPasswordReset } from "../../src/services/api/authApi";
import { getMyProfile } from "../../src/services/api/profileApi";
import { saveSession } from "../../src/services/authSession";

const CARD_GAP = 18;
const SHIMMER_TRAVEL = 220;

export default function LoginScreen() {
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotNotice, setForgotNotice] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reuses the landing-page shimmer motion for the primary login CTA.
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

  function clearLoginError() {
    // Clear any old feedback as soon as the user starts correcting the form.
    if (loginError) {
      setLoginError("");
    }
    if (forgotNotice) {
      setForgotNotice("");
    }
    if (resetLink) {
      setResetLink("");
    }
  }

  function handleEmailChange(value) {
    setEmail(value);
    clearLoginError();
  }

  function handlePasswordChange(value) {
    setPassword(value);
    clearLoginError();
  }

  async function handleLogin() {
    const normalisedEmail = email.trim().toLowerCase();

    if (!normalisedEmail || !password) {
      setLoginError("Enter your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      let session = await loginUser({
        email: normalisedEmail,
        password,
      });
      try {
        const profile = await getMyProfile(session.token);
        session = {
          ...session,
          user: {
            ...(session.user || {}),
            username: profile.username || session.user?.username,
            email: profile.email || session.user?.email || normalisedEmail,
            profile_picture_url: profile.profile_picture_url || "",
          },
        };
      } catch {
        // Keep login resilient even if the profile refresh fails.
      }
      saveSession(session);
      setLoginError("");
      router.replace("/dashboard");
    } catch (error) {
      setLoginError(error.message || "The details were incorrect.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    const normalisedEmail = email.trim().toLowerCase();

    setLoginError("");

    if (!normalisedEmail) {
      setLoginError("Enter your email first, then tap Forgot password.");
      return;
    }

    try {
      const response = await requestPasswordReset({ email: normalisedEmail });
      setResetLink(response.resetUrl || "");
      setForgotNotice(response.resetUrl
        ? "Reset link created for dev. Open it below."
        : response.message || "Check your email for a reset link.");
    } catch (error) {
      setLoginError(error.message || "Could not start password reset.");
    }
  }

  function handleOpenResetLink() {
    if (!resetLink) {
      return;
    }

    try {
      const parsedUrl = new URL(resetLink);
      router.push(`${parsedUrl.pathname}${parsedUrl.search}`);
    } catch {
      router.push(resetLink);
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
                    minHeight: isShortHeight ? 136 : 180,
                  },
                ]}
              >
                <View style={[styles.formAnchor, { width: formWidth }]}>
                  <View style={styles.formSection}>
                    <View style={[styles.fieldGroup, { width: formWidth }]}>
                      <Text style={styles.label}>Email</Text>
                      <TextInput
                        value={email}
                        onChangeText={handleEmailChange}
                        placeholder="Enter your email"
                        placeholderTextColor="#5E6B7F"
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                      />
                    </View>

                    <View style={[styles.fieldGroup, { width: formWidth }]}>
                      <Text style={styles.label}>Password</Text>
                      <View style={styles.passwordWrap}>
                        <TextInput
                          value={password}
                          onChangeText={handlePasswordChange}
                          placeholder="Enter your password"
                          placeholderTextColor="#5E6B7F"
                          style={[styles.input, styles.passwordInput]}
                          secureTextEntry={!showPassword}
                          autoComplete="password"
                          textContentType="password"
                          onSubmitEditing={handleLogin}
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

                    {loginError ? (
                      <Text accessibilityRole="alert" style={styles.errorText}>
                        {loginError}
                      </Text>
                    ) : null}

                    {forgotNotice ? (
                      <Text style={styles.noticeText}>{forgotNotice}</Text>
                    ) : null}

                    {resetLink ? (
                      <Pressable
                        onPress={handleOpenResetLink}
                        style={({ pressed }) => [
                          styles.resetLinkButton,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.resetLinkButtonText}>
                          Open reset page
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.bottomSection, isCompactWidth && styles.compactBottomSection]}>
              <Link href="/(auth)/register" style={styles.helperLink}>
                Need an account? Sign up
              </Link>

              <Pressable onPress={handleForgotPassword} style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>

              <Pressable
                onPress={handleLogin}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.submitButton,
                  { width: formWidth },
                  isSubmitting && styles.submitButtonDisabled,
                  pressed && !isSubmitting && styles.buttonPressed,
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
                  {isSubmitting ? "Logging in..." : "Log in"}
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
    flexGrow: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  contentStack: {
    justifyContent: "center",
    alignItems: "center",
  },
  formAnchor: {
    justifyContent: "center",
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
  resetLinkButton: {
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  resetLinkButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
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
  helperLink: {
    marginBottom: 10,
    fontSize: 11,
    color: "#62716A",
    textTransform: "uppercase",
  },
  forgotButton: {
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4EA955",
    textTransform: "uppercase",
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
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
