import React, { useState } from "react";
import { View, Text, Pressable, Modal, TextInput } from "react-native";
import { format, parseISO, addDays, subDays } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

interface DayNavigationProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  onTodayClick?: () => void;
}

export default function DayNavigation({ currentDate, onDateChange, onTodayClick }: DayNavigationProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState(currentDate);
  const insets = useSafeAreaInsets();

  const date = parseISO(currentDate);
  const formattedDate = format(date, "EEEE, MMMM d, yyyy");

  const goToPreviousDay = () => {
    const prevDate = subDays(date, 1);
    onDateChange(format(prevDate, "yyyy-MM-dd"));
  };

  const goToNextDay = () => {
    const nextDate = addDays(date, 1);
    onDateChange(format(nextDate, "yyyy-MM-dd"));
  };

  const isToday = format(new Date(), "yyyy-MM-dd") === currentDate;

  const handleDateConfirm = () => {
    onDateChange(dateInput);
    setShowDatePicker(false);
  };

  return (
    <>
      <View 
        className="bg-white border-b border-gray-200 flex-row items-center justify-between px-4 py-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={goToPreviousDay}
          className="p-2 rounded-lg"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#4b5563" />
        </Pressable>

        <Pressable
          onPress={() => {
            setDateInput(currentDate);
            setShowDatePicker(true);
          }}
          className="flex-1 items-center"
        >
          <Text className="text-lg font-bold text-gray-900">{formattedDate}</Text>
          {isToday && (
            <Text className="text-xs text-gray-500 mt-0.5">Today</Text>
          )}
        </Pressable>

        <Pressable
          onPress={goToNextDay}
          className="p-2 rounded-lg"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-forward" size={24} color="#4b5563" />
        </Pressable>
      </View>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 24 }}>
            <Text className="text-xl font-bold mb-4 text-center">Select Date</Text>
            <TextInput
              value={dateInput}
              onChangeText={setDateInput}
              placeholder="YYYY-MM-DD"
              className="border border-gray-300 rounded-lg px-4 py-3 text-lg mb-4"
              maxLength={10}
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowDatePicker(false)}
                className="flex-1 bg-gray-200 rounded-lg py-3"
              >
                <Text className="text-center font-semibold text-gray-800">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDateConfirm}
                className="flex-1 bg-black rounded-lg py-3"
              >
                <Text className="text-center font-semibold text-white">Confirm</Text>
              </Pressable>
            </View>
            {onTodayClick && !isToday && (
              <Pressable
                onPress={() => {
                  onTodayClick();
                  setShowDatePicker(false);
                }}
                className="mt-3 bg-blue-50 rounded-lg py-3"
              >
                <Text className="text-center font-semibold text-blue-700">Jump to Today</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
