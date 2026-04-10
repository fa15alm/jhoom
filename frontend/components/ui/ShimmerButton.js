import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { FLOW_WIDTH } from "./FlowShell";

const SHIMMER_TRAVEL = 220;

export default function ShimmerButton({ label, onPress, disabled = false }) {
  const shimmerX = useRef(new Animated.Value(-SHIMMER_TRAVEL)).current;

  useEffect(() => {
    if (disabled) {
      shimmerX.setValue(-SHIMMER_TRAVEL);
      return undefined;
    }

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
  }, [disabled, shimmerX]);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <View pointerEvents="none" style={styles.background}>
        {disabled ? (
          <View style={styles.disabledBackground} />
        ) : (
          <>
            <LinearGradient
              colors={["#5FBE67", "#4EA955", "#469A4D"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.gradient}
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
          </>
        )}
      </View>
      <Text style={[styles.text, disabled && styles.textDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: FLOW_WIDTH,
    height: 54,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  disabledBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
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
  text: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    zIndex: 1,
  },
  textDisabled: {
    color: "#F8FAFC",
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
