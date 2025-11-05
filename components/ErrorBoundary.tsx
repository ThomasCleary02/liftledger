import React from "react";
import { View, Text, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-gray-50 px-6">
          <Ionicons name="alert-circle" size={64} color="#dc2626" />
          <Text className="text-2xl font-bold text-gray-900 mt-6 mb-2">Something went wrong</Text>
          <Text className="text-gray-600 text-center mb-6">
            We're sorry for the inconvenience. Please try restarting the app.
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false })}
            className="bg-black rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
