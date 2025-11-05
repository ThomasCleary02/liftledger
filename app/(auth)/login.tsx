import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../providers/Auth";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Login() {
  const router = useRouter();
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) router.replace("/(tabs)/workouts");
  }, [user, router]);

  const validate = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return false;
    }
    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email");
      return false;
    }
    if (!password || password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }
    if (mode === "signup" && password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.replace("/(tabs)/workouts");
    } catch (e: any) {
      const errorMessage = e?.message || "An error occurred";
      Alert.alert(
        mode === "login" ? "Login Failed" : "Sign Up Failed",
        errorMessage.includes("email-already-in-use")
          ? "An account with this email already exists. Please log in instead."
          : errorMessage.includes("invalid-credential") || errorMessage.includes("wrong-password")
          ? "Invalid email or password. Please try again."
          : errorMessage.includes("weak-password")
          ? "Password is too weak. Please use a stronger password."
          : errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50" 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo/Header */}
          <View className="items-center mb-12">
            <View className="bg-black rounded-3xl p-6 mb-4">
              <Ionicons name="barbell" size={48} color="#fff" />
            </View>
            <Text className="text-4xl font-bold text-gray-900 mb-2">LiftLedger</Text>
            <Text className="text-gray-500 text-center">
              Track your workouts,{'\n'}achieve your goals
            </Text>
          </View>

          {/* Form Card */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </Text>
            <Text className="text-gray-500 mb-6">
              {mode === "login" 
                ? "Sign in to continue tracking your progress" 
                : "Start your fitness journey today"}
            </Text>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Ionicons name="mail-outline" size={20} color="#6b7280" />
                <TextInput
                  className="flex-1 ml-3 text-base"
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Password</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
                <TextInput
                  className="flex-1 ml-3 text-base"
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={mode === "login" ? "password" : "password-new"}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm Password (Sign Up Only) */}
            {mode === "signup" && (
              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-2">Confirm Password</Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
                  <TextInput
                    className="flex-1 ml-3 text-base"
                    placeholder="Confirm your password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#6b7280" 
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <Pressable
              onPress={submit}
              disabled={loading || !email || !password || (mode === "signup" && !confirmPassword)}
              className={`rounded-xl py-4 shadow-lg ${
                loading || !email || !password || (mode === "signup" && !confirmPassword)
                  ? "bg-gray-300"
                  : "bg-black"
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <View className="flex-row items-center justify-center">
                {loading && (
                  <View className="mr-2">
                    <Text className="text-white">...</Text>
                  </View>
                )}
                <Text
                  className={`text-center font-bold text-base ${
                    loading || !email || !password || (mode === "signup" && !confirmPassword)
                      ? "text-gray-600"
                      : "text-white"
                  }`}
                >
                  {loading
                    ? mode === "login"
                      ? "Signing in..."
                      : "Creating account..."
                    : mode === "login"
                    ? "Sign In"
                    : "Create Account"}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Toggle Mode */}
          <View className="flex-row items-center justify-center">
            <Text className="text-gray-600">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <Pressable onPress={() => {
              setMode(mode === "login" ? "signup" : "login");
              setConfirmPassword("");
            }}>
              <Text className="text-black font-semibold">
                {mode === "login" ? "Sign Up" : "Log In"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}