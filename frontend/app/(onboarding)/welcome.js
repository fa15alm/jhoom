import { useRouter } from "expo-router";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.badge}>Jhoom</Text>
        <Text style={styles.title}>Your all-in-one fitness hub</Text>
        <Text style={styles.subtitle}>
          Personalised workouts, calorie tracking, progress insights, and
          motivation all in one place.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(onboarding)/basic-info")}
        >
          <Text style={styles.buttonText}>Get started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  badge: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 40,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#16A34A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
