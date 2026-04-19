/*
 * AI health coach screen.
 *
 * Shows the current plan above a chat-style question box backed by the coach API.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "../src/shared/ui/AppHeader";
import BottomNav from "../src/shared/ui/BottomNav";
import useMobileFrame from "../src/shared/hooks/useMobileFrame";
import {
  getCurrentPlanSections,
  getPlanSummary,
  saveGeneratedHealthPlan,
} from "../src/features/health-plan/healthPlan";
import { askHealthCoach } from "../src/services/api/coachApi";
import { getHealthPlan } from "../src/services/api/healthPlanApi";
import { getAuthToken } from "../src/services/authSession";

const promptSuggestions = [
  "Adjust today",
  "Explain workout",
  "Meal ideas",
  "Recovery tips",
];

const starterMessages = [
  // Initial coach message gives the chat a friendly empty state.
  // Backend chat history can replace this array once conversations are persisted.
  {
    id: "coach-welcome",
    role: "coach",
    text: "Ask me anything about your current plan, recovery, workouts, meals, or what to adjust today.",
  },
];

export default function AiScreen() {
  const router = useRouter();
  const {
    shellPaddingHorizontal,
    shellPaddingVertical,
    innerPaddingHorizontal,
    innerPaddingTop,
    innerPaddingBottom,
    shellMinHeight,
    cardWidth,
  } = useMobileFrame();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState(starterMessages);
  const [isThinking, setIsThinking] = useState(false);
  const [planVersion, setPlanVersion] = useState(0);
  const planSections = getCurrentPlanSections();
  const planSummary = getPlanSummary();

  useEffect(() => {
    async function loadPlan() {
      const token = getAuthToken();

      if (!token) {
        return;
      }

      try {
        saveGeneratedHealthPlan(await getHealthPlan(token));
        setPlanVersion((current) => current + 1);
      } catch {
        saveGeneratedHealthPlan(null);
      }
    }

    loadPlan();
  }, []);

  void planVersion;

  function handleSuggestionPress(suggestion) {
    // Suggestion chips prefill the composer instead of sending immediately,
    // giving the user a chance to edit the question first.
    setQuestion(suggestion);
  }

  async function handleSendQuestion() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    const timestamp = Date.now();

    setMessages((current) => [
      ...current,
      {
        id: `user-${timestamp}`,
        role: "user",
        text: trimmedQuestion,
      },
    ]);
    setIsThinking(true);
    setQuestion("");

    try {
      const token = getAuthToken();
      const answer = token
        ? await askHealthCoach(token, {
            message: trimmedQuestion,
            plan: planSections,
          })
        : null;

      setMessages((current) => [
        ...current,
        {
          id: `coach-${timestamp}`,
          role: "coach",
          text:
            answer?.response ||
            `Based on your current plan (${planSummary.title}), choose one action for today, log the result, then adjust from your recovery notes.`,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `coach-${timestamp}`,
          role: "coach",
          text: error.message || "I could not reach the coach API. Try again in a moment.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleClearChat() {
    setMessages(starterMessages);
    setQuestion("");
    setIsThinking(false);
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
                minHeight: Math.max(shellMinHeight, 780),
                paddingHorizontal: innerPaddingHorizontal,
                paddingTop: innerPaddingTop,
                paddingBottom: innerPaddingBottom,
              },
            ]}
          >
            <AppHeader title='AI "HEALTH COACH"' />

            <View style={styles.contentSection}>
              <Pressable
                onPress={() => router.push("/(onboarding)/basic-info")}
                style={({ pressed }) => [
                  styles.newPlanButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.newPlanText}>New plan?</Text>
              </Pressable>

              <View style={[styles.planCard, { width: cardWidth }]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardEyebrow}>Your health plan</Text>
                    <Text style={styles.cardTitle}>Plan overview</Text>
                  </View>
                  <Ionicons name="sparkles-outline" size={22} color="#4EA955" />
                </View>

                <ScrollView
                  style={styles.planScroll}
                  contentContainerStyle={styles.planScrollContent}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {planSections.map((section) => (
                    <View key={section.title} style={styles.planSection}>
                      <Text style={styles.planSectionTitle}>{section.title}</Text>
                      <Text style={styles.planSectionBody}>{section.body}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <View style={[styles.questionCard, { width: cardWidth }]}>
                <View style={styles.chatHeader}>
                  <View>
                    <Text style={styles.cardEyebrow}>Coach chat</Text>
                    <Text style={styles.cardTitle}>Ask a question</Text>
                  </View>
                  <Pressable
                    onPress={handleClearChat}
                    style={({ pressed }) => [
                      styles.clearChatButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.clearChatText}>Clear</Text>
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.chatScroll}
                  contentContainerStyle={styles.chatScrollContent}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {messages.map((message) => {
                    const isUser = message.role === "user";

                    return (
                      <View
                        key={message.id}
                        style={[
                          styles.messageBubble,
                          isUser ? styles.userMessageBubble : styles.coachMessageBubble,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            isUser && styles.userMessageText,
                          ]}
                        >
                          {message.text}
                        </Text>
                      </View>
                    );
                  })}

                  {isThinking ? (
                    <View style={[styles.messageBubble, styles.coachMessageBubble]}>
                      <Text style={styles.messageText}>Coach is thinking...</Text>
                    </View>
                  ) : null}
                </ScrollView>

                <View style={styles.promptSection}>
                  <Text style={styles.promptTitle}>Prompt suggestions</Text>
                  <View style={styles.promptGrid}>
                    {promptSuggestions.map((suggestion) => (
                      <Pressable
                        key={suggestion}
                        onPress={() => handleSuggestionPress(suggestion)}
                        style={({ pressed }) => [
                          styles.promptChip,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.promptChipText}>{suggestion}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.questionRow}>
                  <TextInput
                    value={question}
                    onChangeText={setQuestion}
                    placeholder="Space for question"
                    placeholderTextColor="#7A8699"
                    style={styles.questionInput}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Send question"
                    onPress={handleSendQuestion}
                    style={({ pressed }) => [
                      styles.sendButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Ionicons name="chevron-forward-outline" size={22} color="#FFFFFF" />
                  </Pressable>
                </View>

                <Text style={styles.disclaimerText}>
                  AI guidance is not medical advice. For injuries, symptoms, or clinical decisions, speak to a qualified professional.
                </Text>
              </View>
            </View>

            <BottomNav activeTab="ai" />
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
    justifyContent: "space-between",
  },
  contentSection: {
    flex: 1,
    alignItems: "center",
    gap: 16,
    paddingBottom: 24,
  },
  newPlanButton: {
    minWidth: 112,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  newPlanText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  planCard: {
    minHeight: 330,
    maxHeight: 390,
    borderRadius: 28,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    padding: 18,
  },
  questionCard: {
    minHeight: 360,
    borderRadius: 28,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    padding: 18,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  clearChatButton: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  clearChatText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#4EA955",
    textTransform: "uppercase",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: "#83B66E",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  cardTitle: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.2,
  },
  planScroll: {
    minHeight: 230,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
  },
  planScrollContent: {
    padding: 14,
    gap: 12,
  },
  planSection: {
    borderRadius: 18,
    backgroundColor: "#F4FFF7",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  planSectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  planSectionBody: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "700",
    color: "#3F4858",
  },
  promptSection: {
    paddingTop: 16,
  },
  chatScroll: {
    minHeight: 130,
    maxHeight: 190,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
  },
  chatScrollContent: {
    padding: 14,
    gap: 10,
  },
  messageBubble: {
    maxWidth: "86%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  coachMessageBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#F4FFF7",
    borderWidth: 1,
    borderColor: "#DDF4E4",
  },
  userMessageBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#4EA955",
  },
  messageText: {
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "700",
    color: "#3F4858",
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  promptTitle: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CFEFD9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  promptGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  promptChip: {
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  promptChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },
  questionInput: {
    flex: 1,
    height: 50,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CFEFD9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimerText: {
    marginTop: 12,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    color: "#7A8699",
    textAlign: "center",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
