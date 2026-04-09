import { useRouter } from "expo-router";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function LifestyleScreen() {
  const router = useRouter();

  const options = ["Beginner", "Intermediate", "Advanced"];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your activity level</Text>
        <Text style={styles.subtitle}>Help us personalise your plan</Text>

        {options.map((option) => (
          <TouchableOpacity key={option} style={styles.optionCard}>
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(tabs)/dashboard")}
        >
          <Text style={styles.buttonText}>Finish onboarding</Text>
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
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  optionText: {
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
