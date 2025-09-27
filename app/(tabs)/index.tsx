import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Camera, Plus, Flame, Award } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthBuddy } from '@/components/HealthBuddy';
import { SymptomLogger } from '@/components/SymptomLogger';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [healthStreak, setHealthStreak] = useState(0);
  const [todaySymptoms, setTodaySymptoms] = useState(0);
  const [showLogger, setShowLogger] = useState(false);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      const streak = await AsyncStorage.getItem('healthStreak');
      const symptoms = await AsyncStorage.getItem('todaySymptoms');
      const lastLogDate = await AsyncStorage.getItem('lastLogDate');
      
      const today = new Date().toDateString();
      
      if (lastLogDate !== today) {
        // Reset daily count if new day
        await AsyncStorage.setItem('todaySymptoms', '0');
        setTodaySymptoms(0);
      } else {
        setTodaySymptoms(symptoms ? parseInt(symptoms) : 0);
      }
      
      setHealthStreak(streak ? parseInt(streak) : 0);
    } catch (error) {
      console.error('Error loading health data:', error);
    }
  };

  const getStreakMessage = () => {
    if (healthStreak === 0) return "Start your health journey!";
    if (healthStreak < 7) return `Great start! ${healthStreak} days strong`;
    if (healthStreak < 30) return `Amazing! ${healthStreak} day streak`;
    return `Incredible! ${healthStreak} day streak! 🏆`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning! 👋</Text>
          <Text style={styles.subtitle}>How are you feeling today?</Text>
        </View>

        {/* Health Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Flame size={24} color="#F97316" />
            <Text style={styles.streakTitle}>Health Streak</Text>
          </View>
          <Text style={styles.streakNumber}>{healthStreak} days</Text>
          <Text style={styles.streakMessage}>{getStreakMessage()}</Text>
        </View>

        {/* Today's Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Today's Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Award size={20} color="#10B981" />
              <Text style={styles.summaryNumber}>{todaySymptoms}</Text>
              <Text style={styles.summaryLabel}>Symptoms Logged</Text>
            </View>
            <View style={styles.summaryItem}>
              <Flame size={20} color="#F59E0B" />
              <Text style={styles.summaryNumber}>85%</Text>
              <Text style={styles.summaryLabel}>Health Score</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Log Symptoms</Text>
          <Text style={styles.cardSubtitle}>Choose your preferred method</Text>
          
          <TouchableOpacity 
            style={styles.primaryAction}
            onPress={() => setShowLogger(true)}
          >
            <Plus size={24} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Quick Log</Text>
          </TouchableOpacity>

          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Mic size={24} color="#4F46E5" />
              <Text style={styles.actionText}>Voice Input</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Camera size={24} color="#4F46E5" />
              <Text style={styles.actionText}>Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Suggestions */}
        <View style={styles.suggestionsCard}>
          <Text style={styles.cardTitle}>Recent Suggestions</Text>
          
          <View style={[styles.suggestionItem, styles.lowSeverity]}>
            <View style={styles.suggestionDot} />
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionTitle}>Stay Hydrated</Text>
              <Text style={styles.suggestionDesc}>Based on your mild headache symptoms</Text>
            </View>
          </View>

          <View style={[styles.suggestionItem, styles.mediumSeverity]}>
            <View style={styles.suggestionDot} />
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionTitle}>Monitor Sleep</Text>
              <Text style={styles.suggestionDesc}>Consider tracking sleep patterns</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Symptom Logger Modal */}
      {showLogger && (
        <SymptomLogger 
          visible={showLogger}
          onClose={() => setShowLogger(false)}
          onSymptomLogged={loadHealthData}
        />
      )}

      {/* Health Buddy Chatbot */}
      <HealthBuddy />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  streakCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F97316',
    marginBottom: 4,
  },
  streakMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryAction: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    flex: 0.48,
  },
  actionText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
    marginTop: 8,
  },
  suggestionsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  lowSeverity: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  mediumSeverity: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  suggestionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginTop: 6,
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  suggestionDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
});