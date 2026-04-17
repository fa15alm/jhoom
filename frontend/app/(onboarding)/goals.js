import { useRouter } from "expo-router";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function GoalsScreen() {
  const router = useRouter();

  const goals = [
    "Lose weight",
    "Gain muscle",
    "Maintain weight",
    "Improve endurance",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose your goal</Text>
        <Text style={styles.subtitle}>You can change this later</Text>

        {goals.map((goal) => (
          <TouchableOpacity key={goal} style={styles.goalCard}>
            <Text style={styles.goalText}>{goal}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(onboarding)/lifestyle")}
        >
          <Text style={styles.buttonText}>Continue</Text>
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
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 24,
  },
  goalCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  goalText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  button: {
    backgroundColor: "#16A34A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
