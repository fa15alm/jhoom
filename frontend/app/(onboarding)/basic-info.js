import { useRouter } from "expo-router";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function BasicInfoScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Basic information</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

        <TextInput
          placeholder="Age"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Height (cm)"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Weight (kg)"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(onboarding)/goals")}
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
    marginBottom: 28,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#16A34A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
