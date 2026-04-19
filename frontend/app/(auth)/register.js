/*
 * Sign-up screen.
 *
 * This screen collects the minimum account details needed before onboarding.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
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
import { registerUser } from "../../src/services/api/authApi";
import { updateMyProfile } from "../../src/services/api/profileApi";
import { uploadProfilePhoto } from "../../src/services/api/uploadApi";
import { saveSession } from "../../src/services/authSession";

const CARD_GAP = 18;
const SHIMMER_TRAVEL = 220;
const POLICY_COPY = {
  terms: {
    title: "Terms and Conditions",
    sections: [
      {
        heading: "Using Jhoom",
        body:
          "You must provide accurate account information, keep your login secure, and use the app in a lawful way. Do not misuse the service, interfere with other users, or upload harmful content.",
      },
      {
        heading: "Health Information",
        body:
          "Jhoom is for tracking and general wellbeing support. It does not replace medical advice, diagnosis, or treatment. You remain responsible for decisions you make about your health and training.",
      },
      {
        heading: "Accounts and Content",
        body:
          "You are responsible for content you post, including profile photos, social posts, and comments. We may remove content or restrict accounts that violate safety, privacy, or abuse rules.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "What We Store",
        body:
          "We store the account details, profile information, logs, milestones, and social content needed to run the app. Uploaded images are stored so they can appear in your profile and feed.",
      },
      {
        heading: "How It Is Used",
        body:
          "Your data is used to power features you choose to use, such as dashboards, milestones, and the friends feed. Privacy settings control what profile details other users can see.",
      },
      {
        heading: "Your Control",
        body:
          "You can update your profile, adjust privacy settings, export your data, and delete your account. Only accepted friends can see friend-feed content that you share in the social section.",
      },
    ],
  },
};

function getPasswordError(password) {
  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least 1 uppercase letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must include at least 1 number.";
  }

  return "";
}

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
  const [viewedPolicies, setViewedPolicies] = useState({
    terms: false,
    privacy: false,
  });
  const [openPolicyKey, setOpenPolicyKey] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

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

  function handleToggleTerms() {
    if (!viewedPolicies.terms || !viewedPolicies.privacy) {
      setFormError("Open both the terms and privacy policy before agreeing.");
      return;
    }

    setAcceptedTerms((current) => !current);
    setFormError("");
  }

  function handleOpenPolicy(policyKey) {
    setViewedPolicies((current) => ({
      ...current,
      [policyKey]: true,
    }));
    setOpenPolicyKey(policyKey);
    setFormError("");
  }

  function handleClosePolicy() {
    setOpenPolicyKey("");
  }

  function handleSelectProfilePhoto() {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      setFormError("Profile photo upload is available in the web app.");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        setFormError("Choose an image file for your profile photo.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setProfilePhoto({
          name: file.name,
          uri: reader.result,
        });
        setFormError("");
      };
      reader.onerror = () => {
        setFormError("Could not read that image. Try a different photo.");
      };
      reader.readAsDataURL(file);
    };

    input.click();
  }

  async function handleCompleteSignUp() {
    // Keep validation close to the submit handler so it mirrors backend requirements.
    // The backend should enforce the same rules; frontend validation is only
    // for fast user feedback.
    const username = form.username.trim();
    const email = form.email.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;
    const isEmailValid = /\S+@\S+\.\S+/.test(email);
    const passwordError = getPasswordError(password);

    if (!username || !email || !password || !confirmPassword) {
      setFormError("Fill in every field to complete sign up.");
      return;
    }

    if (!isEmailValid) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (passwordError) {
      setFormError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (!viewedPolicies.terms || !viewedPolicies.privacy) {
      setFormError("Open the terms and privacy policy before continuing.");
      return;
    }

    if (!acceptedTerms) {
      setFormError("Agree to the terms and privacy policy to continue.");
      return;
    }

    try {
      setIsSubmitting(true);
      let session = await registerUser({
        username,
        email: email.toLowerCase(),
        password,
      });
      if (profilePhoto?.uri) {
        const uploadedPhoto = await uploadProfilePhoto(session.token, {
          dataUrl: profilePhoto.uri,
          filename: profilePhoto.name,
        });
        const response = await updateMyProfile(session.token, {
          profile_picture_url: uploadedPhoto.url,
        });
        session = {
          ...session,
          user: {
            ...(session.user || {}),
            profile_picture_url:
              response.profile?.profile_picture_url || uploadedPhoto.url,
          },
        };
      }
      saveSession(session);
      setFormError("");
      router.replace("/(onboarding)/basic-info");
    } catch (error) {
      setFormError(error.message || "Could not create your account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        transparent
        visible={Boolean(openPolicyKey)}
        animationType="fade"
        onRequestClose={handleClosePolicy}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {openPolicyKey ? POLICY_COPY[openPolicyKey].title : ""}
            </Text>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {openPolicyKey
                ? POLICY_COPY[openPolicyKey].sections.map((section) => (
                    <View key={section.heading} style={styles.modalSection}>
                      <Text style={styles.modalSectionHeading}>{section.heading}</Text>
                      <Text style={styles.modalSectionBody}>{section.body}</Text>
                    </View>
                  ))
                : null}
            </ScrollView>
            <Pressable
              onPress={handleClosePolicy}
              style={({ pressed }) => [
                styles.modalButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
                      <Text style={styles.helperText}>
                        Use at least 6 characters, 1 uppercase letter, and 1 number.
                      </Text>
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

                    <View style={[styles.policyLinksRow, { width: formWidth }]}>
                      <Pressable
                        onPress={() => handleOpenPolicy("terms")}
                        style={({ pressed }) => [
                          styles.policyLinkButton,
                          viewedPolicies.terms && styles.policyLinkButtonViewed,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.policyLinkText}>
                          {viewedPolicies.terms ? "Viewed terms" : "View terms"}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleOpenPolicy("privacy")}
                        style={({ pressed }) => [
                          styles.policyLinkButton,
                          viewedPolicies.privacy && styles.policyLinkButtonViewed,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.policyLinkText}>
                          {viewedPolicies.privacy ? "Viewed privacy" : "View privacy"}
                        </Text>
                      </Pressable>
                    </View>

                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityLabel="Agree to the terms and privacy policy"
                      accessibilityState={{ checked: acceptedTerms }}
                      hitSlop={8}
                      onPress={handleToggleTerms}
                      style={({ pressed }) => [
                        styles.termsRow,
                        acceptedTerms && styles.termsRowSelected,
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
                      <Text
                        style={[
                          styles.termsText,
                          acceptedTerms && styles.termsTextSelected,
                        ]}
                      >
                        {acceptedTerms
                          ? "Agreed to the terms and privacy policy."
                          : "I agree to the terms and privacy policy."}
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
              <Pressable
                onPress={handleSelectProfilePhoto}
                style={({ pressed }) => [
                  styles.uploadSection,
                  pressed && styles.buttonPressed,
                ]}
              >
                <View
                  style={[
                    styles.uploadCircle,
                    profilePhoto && styles.uploadCircleSelected,
                  ]}
                >
                  {profilePhoto?.uri ? (
                    <Image
                      source={{ uri: profilePhoto.uri }}
                      style={styles.uploadPreviewImage}
                    />
                  ) : (
                    <Ionicons name="arrow-up-outline" size={24} color="#4EA955" />
                  )}
                </View>
                <Text style={styles.uploadText}>
                  {profilePhoto ? "Profile photo selected" : "Upload profile photo"}
                </Text>
                {profilePhoto?.name ? (
                  <Text style={styles.uploadFileName} numberOfLines={1}>
                    {profilePhoto.name}
                  </Text>
                ) : null}
              </Pressable>

              <Pressable
                onPress={handleCompleteSignUp}
                disabled={
                  isSubmitting ||
                  !acceptedTerms ||
                  !viewedPolicies.terms ||
                  !viewedPolicies.privacy
                }
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
                  {isSubmitting ? "Creating account..." : "Complete sign up"}
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
  helperText: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    color: "#5E6B7F",
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
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CFEFD9",
    backgroundColor: "#F4FFF7",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  termsRowSelected: {
    borderColor: "#4EA955",
    backgroundColor: "#ECFDF3",
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
  termsTextSelected: {
    color: "#315B36",
  },
  policyLinksRow: {
    flexDirection: "row",
    gap: 10,
  },
  policyLinkButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CFEFD9",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  policyLinkButtonViewed: {
    backgroundColor: "#ECFDF3",
    borderColor: "#4EA955",
  },
  policyLinkText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#315B36",
    textTransform: "uppercase",
    textAlign: "center",
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
    maxWidth: 240,
  },
  uploadCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DCEFE1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  uploadCircleSelected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#4EA955",
  },
  uploadPreviewImage: {
    width: "100%",
    height: "100%",
  },
  uploadText: {
    fontSize: 11,
    color: "#62716A",
    textTransform: "uppercase",
  },
  uploadFileName: {
    marginTop: 4,
    maxWidth: 220,
    fontSize: 10,
    fontWeight: "700",
    color: "#4EA955",
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  modalCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 18,
    maxHeight: "82%",
    borderWidth: 1,
    borderColor: "#DDE5E0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    gap: 14,
    paddingBottom: 10,
  },
  modalSection: {
    gap: 6,
  },
  modalSectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#315B36",
  },
  modalSectionBody: {
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "600",
    color: "#3F4858",
  },
  modalButton: {
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  modalButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
});
