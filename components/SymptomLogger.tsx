import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Plus, Mic, Camera } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SymptomLoggerProps {
  visible: boolean;
  onClose: () => void;
  onSymptomLogged: () => void;
}

interface Symptom {
  id: string;
  name: string;
  severity: number;
  duration: string;
  description: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'image';
}

export function SymptomLogger({ visible, onClose, onSymptomLogged }: SymptomLoggerProps) {
  const [symptomText, setSymptomText] = useState('');
  const [severity, setSeverity] = useState(1);
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const severityLabels = ['Mild', 'Moderate', 'Severe', 'Very Severe', 'Extreme'];
  const severityColors = ['#10B981', '#F59E0B', '#EF4444', '#DC2626', '#991B1B'];

  const handleSubmit = async () => {
    if (!symptomText.trim()) {
      Alert.alert('Error', 'Please describe your symptoms');
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse symptoms using Gemini-like parsing (simulated)
      const parsedSymptoms = await parseSymptoms(symptomText);
      
      // Save to storage
      await saveSymptom(parsedSymptoms);
      
      // Update counters
      await updateHealthCounters();
      
      Alert.alert('Success', 'Symptoms logged successfully!', [
        { text: 'OK', onPress: () => {
          onSymptomLogged();
          onClose();
          resetForm();
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to log symptoms. Please try again.');
      console.error('Error logging symptoms:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseSymptoms = async (text: string): Promise<Symptom[]> => {
    // Simulate Gemini API parsing
    // In real app, you'd call the Gemini API here
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const symptoms: Symptom[] = [];
    const commonSymptoms = [
      'headache', 'fever', 'cough', 'nausea', 'fatigue', 'pain', 'dizziness',
      'sore throat', 'runny nose', 'stomach ache', 'muscle ache', 'chills'
    ];
    
    // Simple keyword matching (replace with actual Gemini API)
    commonSymptoms.forEach(symptom => {
      if (text.toLowerCase().includes(symptom)) {
        symptoms.push({
          id: `${Date.now()}_${symptom}`,
          name: symptom,
          severity,
          duration: duration || 'Current',
          description: text,
          timestamp: new Date(),
          type: 'text',
        });
      }
    });
    
    // If no specific symptoms found, create a general entry
    if (symptoms.length === 0) {
      symptoms.push({
        id: Date.now().toString(),
        name: 'General symptoms',
        severity,
        duration: duration || 'Current',
        description: text,
        timestamp: new Date(),
        type: 'text',
      });
    }
    
    return symptoms;
  };

  const saveSymptom = async (symptoms: Symptom[]) => {
    const existingData = await AsyncStorage.getItem('symptoms');
    const existingSymptoms = existingData ? JSON.parse(existingData) : [];
    const updatedSymptoms = [...existingSymptoms, ...symptoms];
    await AsyncStorage.setItem('symptoms', JSON.stringify(updatedSymptoms));
  };

  const updateHealthCounters = async () => {
    const today = new Date().toDateString();
    const currentCount = await AsyncStorage.getItem('todaySymptoms');
    const newCount = (currentCount ? parseInt(currentCount) : 0) + 1;
    
    await AsyncStorage.setItem('todaySymptoms', newCount.toString());
    await AsyncStorage.setItem('lastLogDate', today);
    
    // Update streak (simplified logic)
    const currentStreak = await AsyncStorage.getItem('healthStreak');
    const newStreak = (currentStreak ? parseInt(currentStreak) : 0) + 1;
    await AsyncStorage.setItem('healthStreak', newStreak.toString());
  };

  const resetForm = () => {
    setSymptomText('');
    setSeverity(1);
    setDuration('');
  };

  const handleVoiceInput = () => {
    Alert.alert('Voice Input', 'Voice recording feature coming soon!');
  };

  const handleImageInput = () => {
    Alert.alert('Image Input', 'Photo capture feature coming soon!');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Log Symptoms</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Input Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Input Method</Text>
            <View style={styles.inputMethods}>
              <TouchableOpacity style={styles.methodButton} onPress={handleVoiceInput}>
                <Mic size={20} color="#4F46E5" />
                <Text style={styles.methodText}>Voice</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.methodButton} onPress={handleImageInput}>
                <Camera size={20} color="#4F46E5" />
                <Text style={styles.methodText}>Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Symptom Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Describe Your Symptoms</Text>
            <TextInput
              style={styles.textArea}
              value={symptomText}
              onChangeText={setSymptomText}
              placeholder="e.g., I have a headache and feel nauseous. Started this morning..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Severity Scale */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Severity Level</Text>
            <View style={styles.severityContainer}>
              {severityLabels.map((label, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.severityButton,
                    severity === index + 1 && { 
                      backgroundColor: severityColors[index],
                      borderColor: severityColors[index]
                    }
                  ]}
                  onPress={() => setSeverity(index + 1)}
                >
                  <Text style={[
                    styles.severityText,
                    severity === index + 1 && styles.severityTextActive
                  ]}>
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.severityLabel}>
              {severity}/5 - {severityLabels[severity - 1]}
            </Text>
          </View>

          {/* Duration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={duration}
              onChangeText={setDuration}
              placeholder="e.g., 2 hours, since yesterday, 3 days"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!symptomText.trim() || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!symptomText.trim() || isSubmitting}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Logging...' : 'Log Symptoms'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  inputMethods: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  severityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  severityTextActive: {
    color: '#FFFFFF',
  },
  severityLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});